import * as THREE from 'three';
import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { INTRO_ANNOUNCEMENT, AI_QUIPS, BLACK_FRIDAY_ADS } from '../data/narrative.js';
import { buildEnvironment } from '../scene/EnvironmentBuilder.js';
import { createCharacterManager } from '../characters/CharacterManager.js';
import { PlayerController } from './PlayerController.js';
import { InteractionSystem } from './InteractionSystem.js';

function shuffleCopy(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatMMSS(totalSeconds) {
  const clamped = Math.max(0, Math.ceil(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export class GameEngine {
  /**
   * @param {HTMLElement|string} [containerOrSelector='#canvas-container']
   */
  constructor(containerOrSelector = '#canvas-container') {
    this.container =
      typeof containerOrSelector === 'string'
        ? document.querySelector(containerOrSelector)
        : containerOrSelector;

    if (!this.container) {
      throw new Error('GameEngine: #canvas-container element not found');
    }

    this._disposed = false;
    this._rafId = null;
    this._clock = new THREE.Clock();
    this._elapsedTime = 0;

    // Timers & shuffled decks for non-repetitive ads & AI quips
    this._lastCountdownWhole = Math.ceil(gameState.countdownSeconds);
    this._countdownWarningsTriggered = new Set();
    this._adTimer = 26;
    this._quipTimer = 20;
    this._adDeck = shuffleCopy(BLACK_FRIDAY_ADS);
    this._quipDecks = {};
    this._aiSpeakTimeout = null;
    this._introTimeout = null;

    this._unsubs = [];

    this._initRendererAndScene();
    this._initWorld();
    this._bindEvents();
    this._startLoop();
  }

  _initRendererAndScene() {
    const width = this.container.clientWidth || window.innerWidth || 1280;
    const height = this.container.clientHeight || window.innerHeight || 720;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b090e);
    this.scene.fog = new THREE.FogExp2(0x110d14, 0.028);

    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 60);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this._onResize = () => {
      if (this._disposed || !this.container) return;
      const w = this.container.clientWidth || window.innerWidth || 1280;
      const h = this.container.clientHeight || window.innerHeight || 720;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', this._onResize);
  }

  _initWorld() {
    this.env = buildEnvironment(this.scene);
    this.charManager = createCharacterManager(this.scene);
    this.player = new PlayerController(this.camera, this.renderer.domElement);
    this.interaction = new InteractionSystem(this.camera, this.renderer.domElement);

    const allInteractables = [
      ...(this.env?.interactables || []),
      ...(this.charManager?.interactables || []),
    ];
    this.interaction.setInteractables(allInteractables);
  }

  _bindEvents() {
    const sub = (event, fn) => {
      const unsub = eventBus.on(event, fn);
      this._unsubs.push(unsub);
    };

    sub('game:start', () => {
      this._startFreshSession();
    });

    sub('game:restart', () => {
      this._startFreshSession();
    });

    sub('game:pause', () => {
      if (gameState.phase === 'playing') {
        gameState.setPhase('paused');
        this.player.unlock();
      }
    });

    sub('game:resume', () => {
      if (gameState.phase === 'paused') {
        gameState.setPhase('playing');
        this.player.lock();
      }
    });

    sub('modal:open', () => {
      if (gameState.phase === 'playing') {
        gameState.setPhase('modal');
      }
      this.player.unlock();
    });

    sub('modal:close', () => {
      if (gameState.phase === 'modal') {
        gameState.setPhase('playing');
        this.player.lock();
      }
    });

    sub('game:ending', (payload) => {
      const endingId = payload?.endingId || payload?.id || gameState.endingId || 'A';
      gameState.endingId = endingId;
      if (gameState.phase !== 'ending') {
        gameState.setPhase('ending');
      }
      this.player.unlock();

      if (endingId === 'B') {
        this.env?.screenTextures?.setMode?.('tv', 'cancelled');
      } else if (endingId === 'C') {
        this.env?.screenTextures?.setMode?.('tv', 'checkout');
      }
    });

    sub('heat:changed', (payload) => {
      const heat = payload?.heat ?? gameState.argumentHeat;
      if (
        heat >= 100 &&
        gameState.phase !== 'ending' &&
        gameState.phase !== 'title'
      ) {
        this._triggerEnding('B', 'max_heat');
      }
    });

    sub('screen:update', (payload) => {
      if (!payload) return;
      const { target = 'tv', mode, data } = payload;
      this.env?.screenTextures?.setMode?.(target, mode, data ?? payload.payload);
    });

    sub('character:react', (payload) => {
      if (!payload || !payload.characterId) return;
      this.charManager?.triggerReaction?.(payload.characterId, payload.reaction || 'annoyed');
    });

    sub('ai:speak', (payload) => {
      const text = typeof payload === 'string' ? payload : payload?.text || '';
      this.charManager?.setAISpeaking?.(true);
      if (this._aiSpeakTimeout) {
        clearTimeout(this._aiSpeakTimeout);
      }
      const durationMs = Math.min(7500, Math.max(2400, text.length * 52));
      this._aiSpeakTimeout = setTimeout(() => {
        this.charManager?.setAISpeaking?.(false);
        this._aiSpeakTimeout = null;
      }, durationMs);
    });

    sub('settings:changed', (settings) => {
      if (!settings) return;
      if (settings.mouseSensitivity !== undefined) {
        this.player.setSensitivity(settings.mouseSensitivity);
      } else if (settings.sensitivity !== undefined) {
        this.player.setSensitivity(settings.sensitivity);
      }
    });
  }

  _startFreshSession() {
    if (this._introTimeout) {
      clearTimeout(this._introTimeout);
      this._introTimeout = null;
    }

    gameState.reset();
    gameState.setPhase('playing');

    this._lastCountdownWhole = Math.ceil(gameState.countdownSeconds);
    this._countdownWarningsTriggered.clear();
    this._adTimer = 28 + Math.random() * 10;
    this._quipTimer = 18 + Math.random() * 8;
    this._adDeck = shuffleCopy(BLACK_FRIDAY_ADS);
    this._quipDecks = {};

    this.player.resetPosition();
    this.player.lock();

    this.env?.screenTextures?.setMode?.('tv', 'ai_face');

    eventBus.emit('countdown:tick', {
      seconds: this._lastCountdownWhole,
      formatted: formatMMSS(this._lastCountdownWhole),
    });

    eventBus.emit('audio:sfx', { name: 'lock' });

    this._introTimeout = setTimeout(() => {
      if (this._disposed || gameState.phase === 'title') return;
      eventBus.emit('ai:speak', {
        text: INTRO_ANNOUNCEMENT.fullText,
        mood: 'corporate',
      });
      this._introTimeout = null;
    }, 600);
  }

  _triggerEnding(endingId, reason) {
    if (gameState.phase === 'ending') return;
    gameState.endingId = endingId;
    gameState.setPhase('ending');
    this.player.unlock();

    if (endingId === 'B') {
      this.env?.screenTextures?.setMode?.('tv', 'cancelled');
      eventBus.emit('audio:sfx', { name: 'ending_bad' });
    } else if (endingId === 'C') {
      this.env?.screenTextures?.setMode?.('tv', 'checkout');
      eventBus.emit('audio:sfx', { name: 'ending_bad' });
    } else {
      eventBus.emit('audio:sfx', { name: 'ending_good' });
    }

    eventBus.emit('game:ending', { endingId, reason });
  }

  _nextAd() {
    if (!this._adDeck || this._adDeck.length === 0) {
      this._adDeck = shuffleCopy(BLACK_FRIDAY_ADS);
    }
    return this._adDeck.pop();
  }

  _nextQuip(category) {
    const pool = AI_QUIPS[category] || AI_QUIPS.idle;
    if (!pool || pool.length === 0) return null;

    if (!this._quipDecks[category] || this._quipDecks[category].length === 0) {
      this._quipDecks[category] = shuffleCopy(pool);
    }
    return this._quipDecks[category].pop();
  }

  _updateGameplayTimers(dt) {
    // 1. Countdown & elapsed time
    gameState.stats.elapsedSeconds += dt;
    gameState.countdownSeconds = Math.max(0, gameState.countdownSeconds - dt);

    const wholeSecs = Math.ceil(gameState.countdownSeconds);
    if (wholeSecs !== this._lastCountdownWhole) {
      this._lastCountdownWhole = wholeSecs;
      eventBus.emit('countdown:tick', {
        seconds: wholeSecs,
        formatted: formatMMSS(wholeSecs),
      });

      // Milestone countdown warnings at 5:00, 2:00, and 0:30
      if (
        (wholeSecs === 300 || wholeSecs === 120 || wholeSecs === 30) &&
        !this._countdownWarningsTriggered.has(wholeSecs)
      ) {
        this._countdownWarningsTriggered.add(wholeSecs);
        const warningText = this._nextQuip('countdownWarning');
        if (warningText) {
          eventBus.emit('ai:speak', { text: warningText, mood: 'warning' });
        }
      }
    }

    if (gameState.countdownSeconds <= 0) {
      this._triggerEnding('C', 'countdown_expired');
      return;
    }

    // 2. Periodic Black Friday fake ad notifications (28-45s, faster at higher heat)
    this._adTimer -= dt;
    if (this._adTimer <= 0) {
      const ad = this._nextAd();
      if (ad) {
        eventBus.emit('notification:ad', ad);
        eventBus.emit('audio:sfx', { name: 'ping' });
      }
      const heatFactor = 1 - Math.min(0.38, (gameState.argumentHeat / 100) * 0.38);
      this._adTimer = (28 + Math.random() * 17) * heatFactor;
    }

    // 3. Contextual DINNER.AI quips (non-repetitive shuffle)
    this._quipTimer -= dt;
    if (this._quipTimer <= 0) {
      const heat = gameState.argumentHeat;
      let category = 'idle';
      let mood = 'corporate';

      if (heat >= 70) {
        category = 'highHeat';
        mood = 'hostile';
      } else if (heat >= 36) {
        category = Math.random() < 0.78 ? 'mediumHeat' : 'idle';
        mood = 'warning';
      } else {
        category = Math.random() < 0.65 ? 'lowHeat' : 'idle';
        mood = 'corporate';
      }

      const text = this._nextQuip(category);
      if (text) {
        eventBus.emit('ai:speak', { text, mood });
      }
      this._quipTimer = 24 + Math.random() * 14;
    }
  }

  _updateTitleCamera() {
    // Gentle cinematic slow pan across the Thanksgiving dining table while on Title screen
    const angle = Math.sin(this._elapsedTime * 0.18) * 0.42;
    this.camera.position.set(
      Math.sin(angle) * 3.4,
      1.85 + Math.sin(this._elapsedTime * 0.35) * 0.06,
      3.1 + Math.cos(angle) * 0.5
    );
    this.camera.lookAt(0, 1.15, -1.2);
  }

  _startLoop() {
    this._clock.start();

    const tick = () => {
      if (this._disposed) return;
      this._rafId = requestAnimationFrame(tick);

      const dt = Math.min(this._clock.getDelta(), 0.1);
      this._elapsedTime += dt;

      const phase = gameState.phase;
      const heat = gameState.argumentHeat;

      if (phase === 'title') {
        this._updateTitleCamera();
      } else if (phase === 'playing') {
        this.player.update(dt, this.env?.colliders || []);
        this.interaction.update(dt);
        this._updateGameplayTimers(dt);
      } else {
        // Ensure hover highlight clears when paused, in modal, or on ending screen
        this.interaction.update(dt);
      }

      // Always animate environment lighting/screens/steam and characters so world feels alive
      this.env?.update?.(dt, this._elapsedTime, heat);
      this.charManager?.update?.(dt, this._elapsedTime, heat, this.player.getPosition());

      this.renderer.render(this.scene, this.camera);
    };

    this._rafId = requestAnimationFrame(tick);
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;

    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._aiSpeakTimeout) {
      clearTimeout(this._aiSpeakTimeout);
      this._aiSpeakTimeout = null;
    }
    if (this._introTimeout) {
      clearTimeout(this._introTimeout);
      this._introTimeout = null;
    }

    window.removeEventListener('resize', this._onResize);

    for (const unsub of this._unsubs) {
      if (typeof unsub === 'function') unsub();
    }
    this._unsubs = [];

    this.interaction?.dispose?.();
    this.player?.dispose?.();
    this.charManager?.dispose?.();
    this.env?.dispose?.();

    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj.geometry && typeof obj.geometry.dispose === 'function') {
          obj.geometry.dispose();
        }
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of mats) {
            if (!mat) continue;
            if (mat.map && typeof mat.map.dispose === 'function') mat.map.dispose();
            if (typeof mat.dispose === 'function') mat.dispose();
          }
        }
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
