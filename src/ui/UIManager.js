import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { ENDINGS } from '../data/narrative.js';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMMSS(totalSeconds) {
  const clamped = Math.max(0, Math.ceil(totalSeconds || 0));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getHeatInfo(heat) {
  const h = Math.max(0, Math.min(100, Math.round(heat || 0)));
  if (h <= 25) return { label: 'Cold Turkey', tier: 0, vignette: 'heat-low' };
  if (h <= 55) return { label: 'Passive-Aggressive', tier: 1, vignette: 'heat-mid' };
  if (h <= 84) return { label: 'Facebook Uncle', tier: 2, vignette: 'heat-high' };
  return { label: 'CRITICAL MELTDOWN', tier: 3, vignette: 'heat-critical' };
}

const CHARACTER_AVATARS = {
  char_frank: '🧔',
  frank: '🧔',
  char_linda: '🍷',
  linda: '🍷',
  char_jake: '🎧',
  jake: '🎧',
  char_grandma: '👵',
  grandma: '👵',
  char_dad: '👨',
  dad: '👨',
  char_dinner_ai: '🤖',
  dinner_ai: '🤖',
};

const ENDING_REACTIONS = {
  A: [
    { name: 'Dad', line: '"Thank goodness. Now somebody help me carve the rest of this turkey."' },
    { name: 'Grandma', line: '"I always said a little common sense beats a fancy gadget."' },
    { name: 'Uncle Frank', line: '"See? I told you that speaker was listening to us!"' },
    { name: 'Cousin Jake', line: '"Okay fine, pie actually looks fire. Phone is going away."' },
  ],
  B: [
    { name: 'Aunt Linda', line: '"I was JUST being honest! Why is the whole neighborhood commenting?!"' },
    { name: 'Uncle Frank', line: '"Turn off the TV! Who gave the HOA my quotes?!"' },
    { name: 'Cousin Jake', line: '"Bro we are literally #1 trending on Nextdoor right now."' },
    { name: 'Dad', line: '"I am moving to the garage until New Year\'s."' },
  ],
  C: [
    { name: 'Cousin Jake', line: '"NO WAY! The RGB Gaming PC actually shipped?! Best Thanksgiving ever!"' },
    { name: 'Dad', line: '"Four thousand eight hundred dollars... why do we own THREE air fryers?"' },
    { name: 'Aunt Linda', line: '"Well, at least my lavender spa set has same-day delivery."' },
    { name: 'Grandma', line: '"I hope those emotional support blankets are machine washable."' },
  ],
  D: [
    { name: 'Uncle Frank', line: '"It was baiting us to sell air fryers?! Hand me the baseball bat!"' },
    { name: 'Aunt Linda', line: '"Unbelievable. Frank, hold the door—I\'m throwing this speaker on the lawn."' },
    { name: 'Cousin Jake', line: '"Ngl watching the whole family jump an AI together is peak content."' },
    { name: 'Grandma', line: '"Nothing brings this family together like a common enemy. Pass the pie!"' },
  ],
};

function renderMemorySvg(card, idx) {
  const key = String(card.artKey || card.id || idx).toLowerCase();
  if (key.includes('turkey') || key.includes('frank') || idx === 0) {
    return `
      <svg viewBox="0 0 280 120" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="g0" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#451a03"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs>
        <rect width="280" height="120" fill="url(#g0)"/>
        <ellipse cx="145" cy="86" rx="68" ry="18" fill="#cbd5e1" opacity="0.25"/>
        <ellipse cx="145" cy="76" rx="46" ry="24" fill="#b45309"/>
        <circle cx="176" cy="64" r="10" fill="#d97706"/>
        <rect x="65" y="42" width="60" height="8" rx="3" fill="#e2e8f0" transform="rotate(-14 65 42)"/>
        <g fill="#f59e0b" opacity="0.85">
          <rect x="52" y="34" width="4" height="18" rx="2"/><rect x="58" y="31" width="4" height="21" rx="2"/>
          <rect x="64" y="30" width="4" height="22" rx="2"/><rect x="70" y="31" width="4" height="21" rx="2"/>
          <rect x="76" y="34" width="4" height="18" rx="2"/><rect x="82" y="38" width="4" height="15" rx="2"/>
        </g>
        <text x="195" y="28" fill="#ef4444" font-family="monospace" font-size="10">6 FINGERS?</text>
      </svg>`;
  }
  if (key.includes('mario') || key.includes('kart') || key.includes('grandma') || idx === 1) {
    return `
      <svg viewBox="0 0 280 120" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs>
        <rect width="280" height="120" fill="url(#g1)"/>
        <path d="M0 95 Q140 50 280 95" stroke="#22d3ee" stroke-width="6" fill="none" opacity="0.8"/>
        <path d="M0 103 Q140 58 280 103" stroke="#f59e0b" stroke-width="5" fill="none" opacity="0.8"/>
        <path d="M0 111 Q140 66 280 111" stroke="#ec4899" stroke-width="5" fill="none" opacity="0.7"/>
        <circle cx="96" cy="52" r="18" fill="#fbbf24" opacity="0.9"/>
        <text x="96" y="57" text-anchor="middle" font-size="16">🏆</text>
        <text x="150" y="48" fill="#a7f3d0" font-family="monospace" font-size="12" font-weight="bold">1ST: GRANDMA</text>
        <text x="150" y="64" fill="#94a3b8" font-family="monospace" font-size="10">2ND: JAKE (-12s)</text>
      </svg>`;
  }
  if (key.includes('speaker') || key.includes('promise') || idx === 2) {
    return `
      <svg viewBox="0 0 280 120" xmlns="http://www.w3.org/2000/svg">
        <rect width="280" height="120" fill="#0c1524"/>
        <circle cx="140" cy="60" r="34" fill="none" stroke="#22d3ee" stroke-width="2" stroke-dasharray="4 4"/>
        <rect x="118" y="34" width="44" height="54" rx="10" fill="#1e293b" stroke="#22d3ee" stroke-width="2"/>
        <ellipse cx="140" cy="40" rx="18" ry="5" fill="#22d3ee" opacity="0.85"/>
        <text x="140" y="106" text-anchor="middle" fill="#22d3ee" font-family="monospace" font-size="10">AI RENDERED PROMO BOX</text>
      </svg>`;
  }
  if (key.includes('cranberry') || key.includes('linda') || key.includes('rug') || idx === 3) {
    return `
      <svg viewBox="0 0 280 120" xmlns="http://www.w3.org/2000/svg">
        <rect width="280" height="120" fill="#2c1d15"/>
        <rect x="26" y="20" width="228" height="80" rx="6" fill="#78350f" opacity="0.55" stroke="#d97706" stroke-width="2"/>
        <path d="M115 55 C130 35, 168 42, 162 66 C158 84, 122 90, 112 72 Z" fill="#991b1b" opacity="0.92"/>
        <circle cx="174" cy="76" r="7" fill="#b91c1c"/>
        <circle cx="102" cy="80" r="5" fill="#991b1b"/>
        <text x="140" y="112" text-anchor="middle" fill="#fef3c7" font-family="monospace" font-size="10">STAIN STILL ON DINING RUG</text>
      </svg>`;
  }
  return `
    <svg viewBox="0 0 280 120" xmlns="http://www.w3.org/2000/svg">
      <rect width="280" height="120" fill="#0a1220"/>
      <rect x="42" y="72" width="24" height="28" fill="#22d3ee" opacity="0.7"/>
      <rect x="82" y="54" width="24" height="46" fill="#22d3ee" opacity="0.85"/>
      <rect x="122" y="34" width="24" height="66" fill="#f59e0b"/>
      <rect x="162" y="22" width="24" height="78" fill="#ef4444"/>
      <text x="200" y="45" fill="#22d3ee" font-family="monospace" font-size="10">AI BUDGET</text>
      <text x="200" y="60" fill="#94a3b8" font-family="monospace" font-size="9">100% VOTE?</text>
      <text x="200" y="75" fill="#ef4444" font-family="monospace" font-size="9">SUSPICIOUS</text>
    </svg>`;
}

export class UIManager {
  /**
   * @param {import('../puzzles/PuzzleManager.js').PuzzleManager} puzzleManager
   */
  constructor(puzzleManager) {
    this.puzzleManager = puzzleManager;
    this.root = document.getElementById('ui-root');
    if (!this.root) {
      this.root = document.createElement('div');
      this.root.id = 'ui-root';
      document.body.appendChild(this.root);
    }

    this.settings = {
      masterVolume: 0.75,
      musicVolume: 0.55,
      sfxVolume: 0.85,
      voiceEnabled: true,
      muted: false,
      mouseSensitivity: 1.0,
    };

    this.activeModal = null;
    this.titleSubpanel = null; // null | 'controls' | 'settings'
    this.pauseSubpanel = null; // null | 'controls' | 'settings'
    this.ads = [];
    this._adCounter = 0;
    this._aiBannerTimer = null;
    this._unsubs = [];

    // Local working state for interactive puzzle modals
    this._giftSelections = {};
    this._deepfakeVerdicts = {};
    this._groupChatOrder = [];
    this._swapSelectedIdx = null;
    this._routerPinValue = '';

    this._buildSkeleton();
    this._bindEvents();
    this._syncFromState(gameState.getSnapshot());
  }

  // ---------------------------------------------------------------------------
  // Base DOM Skeleton
  // ---------------------------------------------------------------------------

  _buildSkeleton() {
    this.root.innerHTML = `
      <div class="heat-vignette heat-low" id="ui-heat-vignette"></div>

      <div class="hud-layer hidden" id="ui-hud">
        <div class="crosshair-wrap">
          <div class="crosshair" id="ui-crosshair"></div>
          <div class="interact-prompt" id="ui-interact-prompt">
            <span class="kbd-badge">E</span>
            <span id="ui-interact-label">Inspect</span>
          </div>
        </div>

        <div class="hud-top-left">
          <div class="glass-panel heat-panel">
            <div class="heat-header">
              <span class="heat-title">Argument Heat</span>
              <span class="heat-number" id="ui-heat-num">18%</span>
            </div>
            <div class="heat-bar-track">
              <div class="heat-bar-fill" id="ui-heat-fill" style="width: 18%"></div>
            </div>
            <div class="heat-status-row">
              <span class="heat-temp-label tier-0" id="ui-heat-label">Cold Turkey</span>
              <span style="color:var(--text-dim);font-size:0.72rem;font-family:var(--font-mono)">MAX 100%</span>
            </div>
          </div>

          <div class="glass-panel quest-panel">
            <div class="quest-header">
              <span class="quest-title">Harmony Protocol</span>
              <span class="quest-count" id="ui-quest-count">0/5</span>
            </div>
            <ul class="quest-list" id="ui-quest-list"></ul>
          </div>
        </div>

        <div class="hud-top-right">
          <div class="glass-panel-cyan timer-panel" id="ui-timer-panel">
            <div class="timer-label">Black Friday Auto-Checkout</div>
            <div class="timer-value" id="ui-timer-value">15:00</div>
          </div>
          <div class="hud-quick-badges">
            <button class="hud-badge-btn" id="ui-btn-notebook" type="button">
              <span class="kbd-badge">TAB</span> Clues (<span id="ui-clue-count">0</span>)
            </button>
            <button class="hud-badge-btn" id="ui-btn-pause" type="button">
              <span class="kbd-badge">ESC</span> Pause
            </button>
          </div>
        </div>

        <div class="ad-stack" id="ui-ad-stack"></div>

        <div class="hud-bottom-center">
          <div class="ai-banner scanlines" id="ui-ai-banner">
            <div class="ai-wave" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <div class="ai-text-wrap">
              <div class="ai-speaker-tag" id="ui-ai-tag">DINNER.AI // SMART-HOME OVERSEER</div>
              <div class="ai-quote" id="ui-ai-quote"></div>
            </div>
          </div>

          <div class="inventory-bar" id="ui-inventory-bar"></div>
        </div>
      </div>

      <div class="system-toast-wrap" id="ui-toast-wrap"></div>
      <div id="ui-screen-layer"></div>
      <div id="ui-modal-layer"></div>
    `;

    this.els = {
      vignette: this.root.querySelector('#ui-heat-vignette'),
      hud: this.root.querySelector('#ui-hud'),
      crosshair: this.root.querySelector('#ui-crosshair'),
      interactPrompt: this.root.querySelector('#ui-interact-prompt'),
      interactLabel: this.root.querySelector('#ui-interact-label'),
      heatNum: this.root.querySelector('#ui-heat-num'),
      heatFill: this.root.querySelector('#ui-heat-fill'),
      heatLabel: this.root.querySelector('#ui-heat-label'),
      questCount: this.root.querySelector('#ui-quest-count'),
      questList: this.root.querySelector('#ui-quest-list'),
      timerPanel: this.root.querySelector('#ui-timer-panel'),
      timerValue: this.root.querySelector('#ui-timer-value'),
      clueCount: this.root.querySelector('#ui-clue-count'),
      adStack: this.root.querySelector('#ui-ad-stack'),
      aiBanner: this.root.querySelector('#ui-ai-banner'),
      aiTag: this.root.querySelector('#ui-ai-tag'),
      aiQuote: this.root.querySelector('#ui-ai-quote'),
      inventoryBar: this.root.querySelector('#ui-inventory-bar'),
      toastWrap: this.root.querySelector('#ui-toast-wrap'),
      screenLayer: this.root.querySelector('#ui-screen-layer'),
      modalLayer: this.root.querySelector('#ui-modal-layer'),
    };

    this.root.querySelector('#ui-btn-notebook').addEventListener('click', () => {
      eventBus.emit('audio:sfx', { name: 'click' });
      this.openNotebook();
    });

    this.root.querySelector('#ui-btn-pause').addEventListener('click', () => {
      eventBus.emit('audio:sfx', { name: 'click' });
      eventBus.emit('game:pause', { source: 'hud' });
    });
  }

  // ---------------------------------------------------------------------------
  // EventBus Subscriptions
  // ---------------------------------------------------------------------------

  _bindEvents() {
    const sub = (event, fn) => {
      const unsub = eventBus.on(event, fn);
      this._unsubs.push(unsub);
    };

    sub('state:changed', (snapshot) => {
      this._syncFromState(snapshot || gameState.getSnapshot());
    });

    sub('heat:changed', (payload) => {
      const heat = payload?.heat ?? gameState.argumentHeat;
      this._updateHeatUI(heat);
      if (payload?.delta && Math.abs(payload.delta) >= 5 && gameState.phase !== 'title') {
        const sign = payload.delta > 0 ? '+' : '';
        this._showToast(
          `Argument Heat ${sign}${payload.delta}%${payload.reason ? ` (${payload.reason})` : ''}`,
          payload.delta > 0 ? 'toast-danger' : 'toast-gold'
        );
      }
    });

    sub('countdown:tick', (payload) => {
      const secs = payload?.seconds ?? gameState.countdownSeconds;
      const formatted = payload?.formatted || formatMMSS(secs);
      this._updateTimerUI(secs, formatted);
    });

    sub('interact:hover', (target) => {
      if (target && target.label && gameState.phase === 'playing') {
        this.els.crosshair.classList.add('hovering');
        this.els.interactLabel.textContent = target.label;
        this.els.interactPrompt.classList.add('visible');
      } else {
        this.els.crosshair.classList.remove('hovering');
        this.els.interactPrompt.classList.remove('visible');
      }
    });

    sub('ai:speak', (payload) => {
      const text = typeof payload === 'string' ? payload : payload?.text || '';
      const mood = typeof payload === 'object' ? payload?.mood : 'corporate';
      if (text) this._showAIBanner(text, mood);
    });

    sub('notification:ad', (ad) => {
      if (!ad) return;
      this._pushAdToast(ad);
    });

    sub('puzzle:open', (payload) => {
      this._handlePuzzleOpen(payload);
    });

    sub('dialogue:open', (payload) => {
      this._openDialogueModal(payload);
    });

    sub('clue:inspect', (payload) => {
      this._openClueInspectModal(payload);
    });

    sub('clue:found', (clue) => {
      if (clue?.title) {
        this._showToast(`🔎 Clue Logged: ${clue.title}`, 'toast-gold');
      }
    });

    sub('puzzle:completed', (payload) => {
      const rewardName = payload?.rewardItem?.name;
      const msg = rewardName
        ? `✅ Puzzle Solved! Acquired: ${rewardName}`
        : `✅ Puzzle ${payload?.id ?? ''} Completed!`;
      this._showToast(msg, 'toast-gold');
      if (payload?.unlockedFinale) {
        this._showToast('🔓 Central Control Panel UNLOCKED!', 'toast-gold');
      }
    });

    sub('ui:toggleNotebook', (payload) => {
      if (this.activeModal?.type === 'notebook' || payload?.open === false) {
        this.closeModal();
      } else if (gameState.phase === 'playing') {
        this.openNotebook();
      }
    });

    sub('modal:close', () => {
      if (this.activeModal) {
        this.activeModal = null;
        this.els.modalLayer.innerHTML = '';
      }
    });

    sub('game:pause', () => {
      this.pauseSubpanel = null;
      this._renderPauseModal();
    });

    sub('game:resume', () => {
      if (this.activeModal?.type === 'pause') {
        this.activeModal = null;
        this.els.modalLayer.innerHTML = '';
      }
    });

    sub('game:ending', (payload) => {
      const endingId = payload?.endingId || payload?.id || gameState.endingId || 'A';
      this.activeModal = null;
      this.els.modalLayer.innerHTML = '';
      this._renderEndingScreen(endingId, payload);
    });

    sub('game:restart', () => {
      this.activeModal = null;
      this.ads = [];
      this.els.adStack.innerHTML = '';
      this.els.modalLayer.innerHTML = '';
      this.els.screenLayer.innerHTML = '';
      this._giftSelections = {};
      this._deepfakeVerdicts = {};
      this._groupChatOrder = [];
      this._routerPinValue = '';
    });
  }

  // ---------------------------------------------------------------------------
  // State Synchronization & HUD Updates
  // ---------------------------------------------------------------------------

  _syncFromState(snap) {
    this._updateHeatUI(snap.argumentHeat);
    this._updateTimerUI(snap.countdownSeconds, formatMMSS(snap.countdownSeconds));
    this._updateQuestsUI(snap.puzzles);
    this._updateInventoryUI(snap.inventory);
    this.els.clueCount.textContent = String(snap.clues.length);

    if (snap.phase === 'title') {
      this.els.hud.classList.add('hidden');
      this.els.modalLayer.innerHTML = '';
      this._renderTitleScreen();
    } else if (snap.phase === 'ending') {
      this.els.hud.classList.add('hidden');
      this.els.modalLayer.innerHTML = '';
      if (!this.els.screenLayer.querySelector('.screen-ending')) {
        this._renderEndingScreen(snap.endingId || 'A');
      }
    } else {
      this.els.hud.classList.remove('hidden');
      this.els.screenLayer.innerHTML = '';
      if (snap.phase === 'paused' && this.activeModal?.type !== 'pause') {
        this._renderPauseModal();
      }
    }

    // Live refresh Puzzle 5 control panel if open
    if (this.activeModal?.type === 'puzzle5') {
      this._renderPuzzle5Modal(this.activeModal.data);
    }
  }

  _updateHeatUI(heat) {
    const clamped = Math.max(0, Math.min(100, Math.round(heat || 0)));
    const info = getHeatInfo(clamped);

    this.els.heatNum.textContent = `${clamped}%`;
    this.els.heatFill.style.width = `${clamped}%`;
    this.els.heatLabel.textContent = info.label;
    this.els.heatLabel.className = `heat-temp-label tier-${info.tier}`;
    this.els.vignette.className = `heat-vignette ${info.vignette}`;
  }

  _updateTimerUI(seconds, formatted) {
    this.els.timerValue.textContent = formatted;
    if (seconds <= 120) {
      this.els.timerPanel.classList.add('urgent');
    } else {
      this.els.timerPanel.classList.remove('urgent');
    }
  }

  _updateQuestsUI(puzzles) {
    const list = Object.values(puzzles || {});
    const solved = list.filter((p) => p.status === 'completed').length;
    this.els.questCount.textContent = `${solved}/${list.length}`;

    this.els.questList.innerHTML = list
      .map((p) => {
        const icon = p.status === 'completed' ? '✅' : p.status === 'locked' ? '🔒' : '⚡';
        return `
          <li class="quest-item ${escapeHtml(p.status)}">
            <span class="quest-icon">${icon}</span>
            <span>${escapeHtml(p.name)}</span>
          </li>
        `;
      })
      .join('');
  }

  _updateInventoryUI(inventory) {
    const items = Array.isArray(inventory) ? inventory : [];
    const totalSlots = Math.max(4, items.length);
    let html = `<span class="inv-label">Key Items</span>`;
    for (let i = 0; i < totalSlots; i++) {
      const item = items[i];
      if (item) {
        html += `
          <div class="inv-slot filled" title="${escapeHtml(item.name)}">
            <span>${escapeHtml(item.icon || '🔑')}</span>
            <div class="inv-tooltip">
              <strong>${escapeHtml(item.name)}</strong>
              <span>${escapeHtml(item.description || '')}</span>
            </div>
          </div>
        `;
      } else {
        html += `<div class="inv-slot" aria-label="Empty slot"></div>`;
      }
    }
    this.els.inventoryBar.innerHTML = html;
  }

  _showAIBanner(text, mood = 'corporate') {
    let moodClass = '';
    if (
      mood === 'warning' ||
      mood === 'amber' ||
      mood === 'defensive' ||
      mood === 'passive' ||
      mood === 'sarcastic' ||
      mood === 'pleased'
    ) {
      moodClass = 'mood-amber';
    } else if (
      mood === 'hostile' ||
      mood === 'crimson' ||
      mood === 'alarm' ||
      mood === 'alarmed' ||
      mood === 'angry'
    ) {
      moodClass = 'mood-crimson';
    }

    this.els.aiBanner.className = `ai-banner scanlines visible ${moodClass}`;
    this.els.aiQuote.textContent = text;

    if (this._aiBannerTimer) clearTimeout(this._aiBannerTimer);
    const duration = Math.min(8000, Math.max(3200, text.length * 55));
    this._aiBannerTimer = setTimeout(() => {
      this.els.aiBanner.classList.remove('visible');
    }, duration);
  }

  _pushAdToast(ad) {
    const id = `toast_${++this._adCounter}`;
    const item = {
      id,
      badge: ad.badge || 'BLACK FRIDAY',
      title: ad.title || 'Flash Deal!',
      body: ad.body || '',
    };

    this.ads.unshift(item);
    if (this.ads.length > 3) this.ads.pop();
    this._renderAds();

    setTimeout(() => {
      this._dismissAd(id, false);
    }, 12000);
  }

  _dismissAd(id, byUser = true) {
    const idx = this.ads.findIndex((a) => a.id === id);
    if (idx === -1) return;
    this.ads.splice(idx, 1);
    if (byUser) {
      gameState.stats.adsDismissed += 1;
      eventBus.emit('audio:sfx', { name: 'click' });
    }
    this._renderAds();
  }

  _renderAds() {
    this.els.adStack.innerHTML = this.ads
      .map(
        (ad) => `
        <div class="ad-toast" data-ad-id="${ad.id}">
          <div class="ad-toast-top">
            <span class="ad-badge">📱 ${escapeHtml(ad.badge)}</span>
            <button class="ad-dismiss" data-dismiss="${ad.id}" type="button" aria-label="Dismiss ad">✕</button>
          </div>
          <div class="ad-title">${escapeHtml(ad.title)}</div>
          <div class="ad-body">${escapeHtml(ad.body)}</div>
        </div>
      `
      )
      .join('');

    this.els.adStack.querySelectorAll('[data-dismiss]').forEach((btn) => {
      btn.addEventListener('click', () => this._dismissAd(btn.dataset.dismiss, true));
    });
  }

  _showToast(message, variant = '') {
    const el = document.createElement('div');
    el.className = `system-toast ${variant}`;
    el.textContent = message;
    this.els.toastWrap.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.25s ease';
      setTimeout(() => el.remove(), 260);
    }, 3200);
  }

  // ---------------------------------------------------------------------------
  // Settings & Controls Shared Subpanels
  // ---------------------------------------------------------------------------

  _emitSettings() {
    eventBus.emit('settings:changed', { ...this.settings });
  }

  _renderControlsMarkup() {
    return `
      <div class="title-subpanel">
        <h3>Controls &amp; Escape Guide</h3>
        <div class="controls-grid">
          <div class="control-row"><span>Move Around Room</span><span><span class="kbd-badge">W</span> <span class="kbd-badge">A</span> <span class="kbd-badge">S</span> <span class="kbd-badge">D</span></span></div>
          <div class="control-row"><span>Look Around</span><span>Mouse (Click Canvas)</span></div>
          <div class="control-row"><span>Interact / Talk</span><span><span class="kbd-badge">E</span> or Left-Click</span></div>
          <div class="control-row"><span>Clue Notebook</span><span><span class="kbd-badge">TAB</span></span></div>
          <div class="control-row"><span>Pause / Close Modal</span><span><span class="kbd-badge">ESC</span></span></div>
          <div class="control-row"><span>Goal</span><span>Solve 4 Puzzles → Control Panel</span></div>
        </div>
      </div>
    `;
  }

  _renderSettingsMarkup() {
    const s = this.settings;
    return `
      <div class="title-subpanel">
        <h3>Audio &amp; Controls Settings</h3>
        <div class="settings-grid">
          <label class="setting-row">
            <span>Master Volume</span>
            <input type="range" min="0" max="1" step="0.05" value="${s.masterVolume}" data-setting="masterVolume" />
            <span class="setting-val">${Math.round(s.masterVolume * 100)}%</span>
          </label>
          <label class="setting-row">
            <span>Music Volume</span>
            <input type="range" min="0" max="1" step="0.05" value="${s.musicVolume}" data-setting="musicVolume" />
            <span class="setting-val">${Math.round(s.musicVolume * 100)}%</span>
          </label>
          <label class="setting-row">
            <span>SFX Volume</span>
            <input type="range" min="0" max="1" step="0.05" value="${s.sfxVolume}" data-setting="sfxVolume" />
            <span class="setting-val">${Math.round(s.sfxVolume * 100)}%</span>
          </label>
          <label class="setting-row">
            <span>Mouse Sensitivity</span>
            <input type="range" min="0.3" max="2.5" step="0.1" value="${s.mouseSensitivity}" data-setting="mouseSensitivity" />
            <span class="setting-val">${s.mouseSensitivity.toFixed(1)}x</span>
          </label>
          <div class="setting-toggle-row">
            <button type="button" class="btn btn-sm ${s.voiceEnabled ? 'btn-cyan' : ''}" data-toggle="voiceEnabled">
              🤖 AI Voice: ${s.voiceEnabled ? 'ON' : 'OFF'}
            </button>
            <button type="button" class="btn btn-sm ${s.muted ? 'btn-danger' : ''}" data-toggle="muted">
              ${s.muted ? '🔇 Audio MUTED' : '🔊 Audio ACTIVE'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  _wireSettingsControls(container, onRerender) {
    container.querySelectorAll('input[data-setting]').forEach((input) => {
      input.addEventListener('input', () => {
        const key = input.dataset.setting;
        this.settings[key] = parseFloat(input.value);
        const valEl = input.parentElement.querySelector('.setting-val');
        if (valEl) {
          valEl.textContent =
            key === 'mouseSensitivity'
              ? `${this.settings[key].toFixed(1)}x`
              : `${Math.round(this.settings[key] * 100)}%`;
        }
        this._emitSettings();
      });
    });

    container.querySelectorAll('button[data-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.toggle;
        this.settings[key] = !this.settings[key];
        this._emitSettings();
        eventBus.emit('audio:sfx', { name: 'click' });
        if (onRerender) onRerender();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // TITLE SCREEN
  // ---------------------------------------------------------------------------

  _renderTitleScreen() {
    const subHtml =
      this.titleSubpanel === 'controls'
        ? this._renderControlsMarkup()
        : this.titleSubpanel === 'settings'
          ? this._renderSettingsMarkup()
          : '';

    this.els.screenLayer.innerHTML = `
      <div class="screen-overlay screen-title">
        <div class="glass-panel title-card scanlines">
          <div class="title-eyebrow">
            <span class="pulse-dot"></span>
            DINNER.AI SMART-HOME LOCKDOWN ACTIVE
          </div>
          <h1 class="title-heading">THE ALGORITHM THANKSGIVING DINNER</h1>
          <p class="title-tagline">
            Your smart home has sealed the front door until your family achieves
            <strong>conversational harmony</strong>—or until the Black Friday timer
            auto-checks out 14 abandoned shopping carts.
          </p>
          <div class="title-actions">
            <button class="btn btn-primary btn-lg" id="btn-start-dinner" type="button">
              🦃 Start Dinner
            </button>
            <button class="btn ${this.titleSubpanel === 'controls' ? 'btn-cyan' : ''}" id="btn-title-controls" type="button">
              🎮 Controls Guide
            </button>
            <button class="btn ${this.titleSubpanel === 'settings' ? 'btn-cyan' : ''}" id="btn-title-settings" type="button">
              ⚙️ Settings
            </button>
          </div>
          ${subHtml}
        </div>
      </div>
    `;

    this.els.screenLayer.querySelector('#btn-start-dinner').addEventListener('click', () => {
      eventBus.emit('audio:sfx', { name: 'click' });
      this.titleSubpanel = null;
      eventBus.emit('game:start', { source: 'title' });
    });

    this.els.screenLayer.querySelector('#btn-title-controls').addEventListener('click', () => {
      eventBus.emit('audio:sfx', { name: 'click' });
      this.titleSubpanel = this.titleSubpanel === 'controls' ? null : 'controls';
      this._renderTitleScreen();
    });

    this.els.screenLayer.querySelector('#btn-title-settings').addEventListener('click', () => {
      eventBus.emit('audio:sfx', { name: 'click' });
      this.titleSubpanel = this.titleSubpanel === 'settings' ? null : 'settings';
      this._renderTitleScreen();
    });

    if (this.titleSubpanel === 'settings') {
      this._wireSettingsControls(this.els.screenLayer, () => this._renderTitleScreen());
    }
  }

  // ---------------------------------------------------------------------------
  // MODAL FRAMEWORK
  // ---------------------------------------------------------------------------

  closeModal() {
    if (!this.activeModal) return;
    const wasPause = this.activeModal.type === 'pause';
    this.activeModal = null;
    this.els.modalLayer.innerHTML = '';
    eventBus.emit('audio:sfx', { name: 'click' });
    if (wasPause) {
      eventBus.emit('game:resume', { source: 'ui' });
    } else {
      eventBus.emit('modal:close', { source: 'ui' });
    }
  }

  _openModalShell({ title, subtitle = '', bodyHtml, footerHtml = '', size = '' }) {
    this.els.modalLayer.innerHTML = `
      <div class="modal-backdrop" id="ui-modal-backdrop">
        <div class="modal-window ${size}" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div class="modal-title-group">
              <h2>${escapeHtml(title)}</h2>
              ${subtitle ? `<div class="modal-subtitle">${escapeHtml(subtitle)}</div>` : ''}
            </div>
            <button class="modal-close" id="ui-modal-close-btn" type="button" aria-label="Close">✕</button>
          </div>
          <div class="modal-body">${bodyHtml}</div>
          ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
        </div>
      </div>
    `;

    this.els.modalLayer.querySelector('#ui-modal-close-btn').addEventListener('click', () => {
      this.closeModal();
    });

    this.els.modalLayer.querySelector('#ui-modal-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'ui-modal-backdrop') {
        this.closeModal();
      }
    });
  }

  _handlePuzzleOpen(payload) {
    if (!payload) return;
    const pid = payload.puzzleId ?? payload.id ?? payload.puzzle;
    const type = String(payload.type || '').toLowerCase();

    if (type === 'clue' || type === 'inspect') {
      this._openClueInspectModal(payload);
      return;
    }

    eventBus.emit('modal:open', { source: 'puzzle', puzzleId: pid });

    if (pid === 1 || type.includes('gift')) {
      this.activeModal = { type: 'puzzle1', data: payload };
      this._renderPuzzle1Modal(payload);
    } else if (pid === 2 || type.includes('deepfake') || type.includes('memory')) {
      this.activeModal = { type: 'puzzle2', data: payload };
      this._renderPuzzle2Modal(payload);
    } else if (pid === 3 || type.includes('chat') || type.includes('group')) {
      this.activeModal = { type: 'puzzle3', data: payload };
      this._renderPuzzle3Modal(payload);
    } else if (pid === 5 || type.includes('panel') || type.includes('final')) {
      this.activeModal = { type: 'puzzle5', data: payload };
      this._renderPuzzle5Modal(payload);
    } else {
      this._openClueInspectModal(payload);
    }
  }

  // ---------------------------------------------------------------------------
  // PUZZLE 1: FAMILY GIFT CRISIS
  // ---------------------------------------------------------------------------

  _renderPuzzle1Modal(payload, feedback = null) {
    const data = payload?.data || payload || {};
    const gifts = data.gifts || [
      { id: 'gift_headset', name: 'RGB Mechanical Gaming Headset', icon: '🎧', description: 'Neon glow, 7.1 surround sound.' },
      { id: 'gift_book', name: '"They Don\'t Want You To Know" Self-Help Book', icon: '📘', description: '400 pages of bold conspiracies.' },
      { id: 'gift_album', name: 'Handcrafted 1988 Family Photo Album', icon: '📷', description: 'Classic Thanksgiving memories.' },
      { id: 'gift_apron', name: 'Noise-Canceling "Peace & Quiet" Apron + Sponge Set', icon: '🧽', description: 'Built for silent dish duty.' },
      { id: 'gift_tumbler', name: 'Gossip-Proof Luxury Wine Tumbler', icon: '🍷', description: 'Keeps Pinot Grigio chilled for 8 hours.' },
    ];
    const recipients = data.recipients || data.members || [
      { id: 'frank', name: 'Uncle Frank' },
      { id: 'linda', name: 'Aunt Linda' },
      { id: 'jake', name: 'Cousin Jake' },
      { id: 'grandma', name: 'Grandma' },
      { id: 'dad', name: 'Dad' },
    ];

    const hints = [];
    if (Array.isArray(payload?.hints)) {
      hints.push(...payload.hints);
    }
    if (Array.isArray(data.hints)) {
      hints.push(...data.hints);
    }
    for (const clue of gameState.clues) {
      if (clue.id.includes('turkey') || clue.text.toLowerCase().includes('gift')) {
        const line = `${clue.title}: ${clue.text}`;
        if (!hints.includes(line)) hints.push(line);
      }
    }

    const isSolved = gameState.puzzles[1]?.status === 'completed';

    const rowsHtml = gifts
      .map((g) => {
        const selected = this._giftSelections[g.id] || '';
        const opts = recipients
          .map(
            (r) =>
              `<option value="${escapeHtml(r.id)}" ${selected === r.id ? 'selected' : ''}>${escapeHtml(r.name)}</option>`
          )
          .join('');
        return `
          <div class="gift-row">
            <div class="gift-info">
              <div class="gift-icon">${escapeHtml(g.icon || '🎁')}</div>
              <div>
                <div class="gift-name">${escapeHtml(g.name)}</div>
                <div class="gift-desc">${escapeHtml(g.description || '')}</div>
              </div>
            </div>
            <select class="gift-select" data-gift-id="${escapeHtml(g.id)}" ${isSolved ? 'disabled' : ''}>
              <option value="">-- Assign Relative --</option>
              ${opts}
            </select>
          </div>
        `;
      })
      .join('');

    const feedbackHtml = feedback
      ? `<div class="feedback-banner ${feedback.ok ? 'success' : 'error'}">${escapeHtml(feedback.message)}</div>`
      : '';

    const hintsHtml =
      hints.length > 0
        ? `
          <div class="hints-box">
            <h4>Discovered Preference Hints</h4>
            <ul class="hints-list">
              ${hints.map((h) => `<li>${escapeHtml(typeof h === 'string' ? h : h.text || h.hint)}</li>`).join('')}
            </ul>
          </div>
        `
        : `<div class="hints-box"><h4>Tip</h4><p style="font-size:0.82rem;color:var(--text-muted)">Inspect the Kitchen Stove sticky note or talk to family members to avoid Conversational Landmines!</p></div>`;

    this._openModalShell({
      title: '🎁 Puzzle 1: The Family Gift Crisis',
      subtitle: 'Match each confiscated gift to the right relative. Beware conversational landmines!',
      bodyHtml: `
        ${feedbackHtml}
        <div class="gift-grid">${rowsHtml}</div>
        ${hintsHtml}
      `,
      footerHtml: `
        <button class="btn" id="p1-close" type="button">Close</button>
        <button class="btn btn-primary" id="p1-submit" type="button" ${isSolved ? 'disabled' : ''}>
          ${isSolved ? '✅ Already Solved' : 'Distribute Gifts'}
        </button>
      `,
    });

    this.els.modalLayer.querySelectorAll('.gift-select').forEach((sel) => {
      sel.addEventListener('change', () => {
        this._giftSelections[sel.dataset.giftId] = sel.value;
      });
    });

    this.els.modalLayer.querySelector('#p1-close').addEventListener('click', () => this.closeModal());
    this.els.modalLayer.querySelector('#p1-submit').addEventListener('click', () => {
      const missing = gifts.some((g) => !this._giftSelections[g.id]);
      if (missing) {
        this._renderPuzzle1Modal(payload, {
          ok: false,
          message: 'Please assign all 5 gifts before distributing them!',
        });
        return;
      }
      const res = this.puzzleManager?.submitGiftAssignments?.({ ...this._giftSelections });
      if (res) {
        const ok = Boolean(res.success ?? res.ok ?? res.solved);
        const landmineLines = Array.isArray(res.feedback)
          ? res.feedback.filter((f) => f.status === 'landmine').map((f) => f.message)
          : [];
        const baseMsg =
          res.message ||
          (ok
            ? 'Perfect gift match! Override Key unlocked!'
            : 'Mismatch triggered a family argument! Check your clues and adjust.');
        const fullMsg =
          landmineLines.length > 0 ? `${baseMsg} — ${landmineLines[0]}` : baseMsg;
        this._renderPuzzle1Modal(payload, { ok, message: fullMsg });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // PUZZLE 2: DEEPFAKE MEMORY INCIDENT
  // ---------------------------------------------------------------------------

  _renderPuzzle2Modal(payload, feedback = null) {
    const data = payload?.data || payload || {};
    const cards = data.memories || data.cards || data.photos || [];
    const isSolved = gameState.puzzles[2]?.status === 'completed';

    const cardsHtml = cards
      .map((card, idx) => {
        const verdict = this._deepfakeVerdicts[card.id]; // 'real' | 'fake' | undefined
        const cardClass = verdict === 'real' ? 'verdict-real' : verdict === 'fake' ? 'verdict-fake' : '';
        return `
          <div class="memory-card ${cardClass}">
            <div class="memory-photo">
              ${card.svg || renderMemorySvg(card, idx)}
              <span class="memory-meta-tag">${escapeHtml(card.year || card.timestamp || 'ARCHIVE')}</span>
            </div>
            <div class="memory-content">
              <div class="memory-title">${escapeHtml(card.title || `Memory #${idx + 1}`)}</div>
              <div class="memory-caption">${escapeHtml(card.caption || card.description || '')}</div>
              ${card.aiQuote ? `<div class="memory-ai-quote">DINNER.AI: "${escapeHtml(card.aiQuote)}"</div>` : ''}
            </div>
            <div class="memory-toggles">
              <button type="button" class="toggle-btn ${verdict === 'real' ? 'active-real' : ''}" data-mem-id="${escapeHtml(card.id)}" data-verdict="real" ${isSolved ? 'disabled' : ''}>
                [REAL MEMORY]
              </button>
              <button type="button" class="toggle-btn ${verdict === 'fake' ? 'active-fake' : ''}" data-mem-id="${escapeHtml(card.id)}" data-verdict="fake" ${isSolved ? 'disabled' : ''}>
                [AI DEEPFAKE]
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    const feedbackHtml = feedback
      ? `<div class="feedback-banner ${feedback.ok ? 'success' : 'error'}">${escapeHtml(feedback.message)}</div>`
      : '';

    this._openModalShell({
      title: '📺 Puzzle 2: The Deepfake Memory Incident',
      subtitle: 'Flag which 2 memories are GENUINE and which 3 are AI-FABRICATED deepfakes.',
      size: 'modal-wide',
      bodyHtml: `
        ${feedbackHtml}
        <div class="memory-grid">${cardsHtml}</div>
      `,
      footerHtml: `
        <button class="btn" id="p2-close" type="button">Close</button>
        <button class="btn btn-cyan" id="p2-submit" type="button" ${isSolved ? 'disabled' : ''}>
          ${isSolved ? '✅ Verified' : 'Verify Memory Archive'}
        </button>
      `,
    });

    this.els.modalLayer.querySelectorAll('.toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        eventBus.emit('audio:sfx', { name: 'click' });
        this._deepfakeVerdicts[btn.dataset.memId] = btn.dataset.verdict;
        this._renderPuzzle2Modal(payload, feedback);
      });
    });

    this.els.modalLayer.querySelector('#p2-close').addEventListener('click', () => this.closeModal());
    this.els.modalLayer.querySelector('#p2-submit').addEventListener('click', () => {
      const missing = cards.some((c) => !this._deepfakeVerdicts[c.id]);
      if (missing) {
        this._renderPuzzle2Modal(payload, {
          ok: false,
          message: 'Classify every memory photo as REAL MEMORY or AI DEEPFAKE first!',
        });
        return;
      }

      // Pass object mapping id -> boolean (isFake) AND string verdict compatibility
      const verdictsMap = {};
      for (const c of cards) {
        verdictsMap[c.id] = this._deepfakeVerdicts[c.id];
      }
      const res = this.puzzleManager?.submitDeepfakeVerdicts?.(verdictsMap);
      if (res) {
        const ok = Boolean(res.success ?? res.ok ?? res.solved);
        const defenseNote =
          Array.isArray(res.defenses) && res.defenses.length > 0
            ? ` DINNER.AI: "${res.defenses[res.defenses.length - 1]}"`
            : '';
        this._renderPuzzle2Modal(payload, {
          ok,
          message:
            (res.message ||
              res.aiComment ||
              (ok
                ? 'Deepfakes exposed! TV Admin Menu Token acquired!'
                : 'DINNER.AI laughs at your verdict. Cross-check the Scrapbook & Receipt clues!')) +
            defenseNote,
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // PUZZLE 3: GROUP CHAT APOCALYPSE
  // ---------------------------------------------------------------------------

  _renderPuzzle3Modal(payload, feedback = null) {
    const data = payload?.data || payload || {};
    const rawTopics = data.topics || [];
    const messages = data.messages || data.chatLog || [];
    const isSolved = gameState.puzzles[3]?.status === 'completed';

    if (this._groupChatOrder.length === 0 && rawTopics.length > 0) {
      this._groupChatOrder = rawTopics.map((t, i) =>
        typeof t === 'string' ? { id: t, label: t } : { id: t.id ?? String(i), label: t.label || t.name || t.title || String(t.id) }
      );
    }

    const chatHtml = messages
      .map(
        (m) => `
        <div class="chat-msg ${m.isAI || m.sender === 'DINNER.AI' ? 'msg-ai' : ''}">
          <div class="chat-msg-sender">${escapeHtml(m.sender || 'Family')}</div>
          <div>${escapeHtml(m.text || m.body || '')}</div>
        </div>
      `
      )
      .join('');

    const topicsHtml = this._groupChatOrder
      .map(
        (t, idx) => `
        <div class="topic-card ${this._swapSelectedIdx === idx ? 'selected-swap' : ''}" data-topic-idx="${idx}">
          <div class="topic-left">
            <span class="topic-index">${idx + 1}</span>
            <span class="topic-name">${escapeHtml(t.label)}</span>
          </div>
          <div class="topic-controls">
            <button type="button" class="topic-move-btn" data-move="up" data-idx="${idx}" ${idx === 0 || isSolved ? 'disabled' : ''} aria-label="Move up">▲</button>
            <button type="button" class="topic-move-btn" data-move="down" data-idx="${idx}" ${idx === this._groupChatOrder.length - 1 || isSolved ? 'disabled' : ''} aria-label="Move down">▼</button>
          </div>
        </div>
      `
      )
      .join('');

    const feedbackHtml = feedback
      ? `<div class="feedback-banner ${feedback.ok ? 'success' : 'error'}">${escapeHtml(feedback.message)}</div>`
      : '';

    this._openModalShell({
      title: '📱 Puzzle 3: The Group Chat Apocalypse',
      subtitle: 'Arrange the 7 trending topics from MOST EXPLOSIVE (1) down to SAFEST COZY HARMONY (7).',
      size: 'modal-wide',
      bodyHtml: `
        ${feedbackHtml}
        <div class="groupchat-layout">
          <div class="chat-feed-panel">
            <div class="chat-feed-header">
              <span>#FAMILY-THANKSGIVING-2026</span>
              <span>🔥 LIVE</span>
            </div>
            <div class="chat-messages">${chatHtml}</div>
          </div>
          <div class="topic-reorder-panel">
            <h4>De-escalation Topic Sequence</h4>
            <p class="topic-instructions">
              Use ▲/▼ arrows or click any two cards to swap them. Check the Wi-Fi Router sticky note for the exact cool-down order!
            </p>
            <div class="topic-list">${topicsHtml}</div>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn" id="p3-close" type="button">Close</button>
        <button class="btn btn-primary" id="p3-submit" type="button" ${isSolved ? 'disabled' : ''}>
          ${isSolved ? '✅ Chat Calmed' : 'Deploy Moderation Order'}
        </button>
      `,
    });

    this.els.modalLayer.querySelectorAll('.topic-move-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isSolved) return;
        const idx = Number(btn.dataset.idx);
        const target = btn.dataset.move === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= this._groupChatOrder.length) return;
        [this._groupChatOrder[idx], this._groupChatOrder[target]] = [
          this._groupChatOrder[target],
          this._groupChatOrder[idx],
        ];
        this._swapSelectedIdx = null;
        eventBus.emit('audio:sfx', { name: 'click' });
        this._renderPuzzle3Modal(payload, feedback);
      });
    });

    this.els.modalLayer.querySelectorAll('.topic-card').forEach((card) => {
      card.addEventListener('click', () => {
        if (isSolved) return;
        const idx = Number(card.dataset.topicIdx);
        if (this._swapSelectedIdx === null) {
          this._swapSelectedIdx = idx;
        } else if (this._swapSelectedIdx === idx) {
          this._swapSelectedIdx = null;
        } else {
          [this._groupChatOrder[this._swapSelectedIdx], this._groupChatOrder[idx]] = [
            this._groupChatOrder[idx],
            this._groupChatOrder[this._swapSelectedIdx],
          ];
          this._swapSelectedIdx = null;
        }
        eventBus.emit('audio:sfx', { name: 'click' });
        this._renderPuzzle3Modal(payload, feedback);
      });
    });

    this.els.modalLayer.querySelector('#p3-close').addEventListener('click', () => this.closeModal());
    this.els.modalLayer.querySelector('#p3-submit').addEventListener('click', () => {
      const orderedIds = this._groupChatOrder.map((t) => t.id);
      const res = this.puzzleManager?.submitGroupChatOrder?.(orderedIds);
      if (res) {
        const ok = Boolean(res.success ?? res.ok ?? res.solved);
        this._renderPuzzle3Modal(payload, {
          ok,
          message:
            res.message ||
            (ok
              ? 'Group chat de-escalated! Router Admin PIN (4829) unlocked!'
              : 'Wrong sequence! DINNER.AI amplified the drama. Check the Router sticky note.'),
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // PUZZLE 4: CHARACTER DIALOGUE MODAL
  // ---------------------------------------------------------------------------

  _openDialogueModal(payload) {
    if (!payload) return;
    eventBus.emit('modal:open', { source: 'dialogue', characterId: payload.characterId });
    this.activeModal = { type: 'dialogue', data: payload };
    this._renderDialogueModal(payload);
  }

  _renderDialogueModal(payload, feedback = null) {
    const charObj = payload.character || {};
    const charId = payload.characterId || charObj.id || payload.id || 'char_frank';
    const shortId = charId.replace(/^char_/, '');
    const name = charObj.name || payload.name || payload.speaker || shortId.toUpperCase();
    const avatar =
      charObj.avatar || payload.avatar || CHARACTER_AVATARS[charId] || CHARACTER_AVATARS[shortId] || '🧑';
    const node = payload.node || payload;
    const nodeId = payload.nodeId || node.id || 'start';
    const line = node.text || node.line || payload.line || '...';
    const choices = Array.isArray(node.choices) ? node.choices : [];
    const isCalmed = Boolean(
      charObj.calmed ||
        payload.calmed ||
        gameState.flags.calmedMembers?.[shortId] ||
        gameState.flags.calmedMembers?.[charId]
    );
    const moodText = isCalmed ? 'CALMED ✓' : charObj.role || payload.mood || 'AGITATED';

    const choicesHtml =
      choices.length > 0
        ? choices
            .map(
              (c, idx) => `
              <button type="button" class="dialogue-choice-btn" data-choice-idx="${idx}">
                <span>${escapeHtml(c.label || c.text)}</span>
                ${c.tone ? `<span class="choice-tone">${escapeHtml(c.tone)}</span>` : ''}
              </button>
            `
            )
            .join('')
        : `<button type="button" class="btn btn-primary" id="dlg-done-btn">End Conversation</button>`;

    const feedbackHtml = feedback
      ? `<div class="feedback-banner ${feedback.ok ? 'success' : 'error'}">${escapeHtml(feedback.message)}</div>`
      : '';

    this._openModalShell({
      title: `💬 Conversation — ${name}`,
      subtitle: 'De-escalate family members to earn Security Control Clearance (4 of 5 needed).',
      bodyHtml: `
        ${feedbackHtml}
        <div class="dialogue-header-card">
          <div class="dialogue-avatar">${escapeHtml(avatar)}</div>
          <div class="dialogue-meta">
            <h3>${escapeHtml(name)}</h3>
            <span class="dialogue-status-pill ${isCalmed ? 'calmed' : ''}">${escapeHtml(moodText)}</span>
          </div>
        </div>
        <div class="dialogue-speech">"${escapeHtml(line)}"</div>
        <div class="dialogue-choices">${choicesHtml}</div>
      `,
      footerHtml: `<button class="btn" id="dlg-close" type="button">Step Away</button>`,
    });

    this.els.modalLayer.querySelector('#dlg-close').addEventListener('click', () => this.closeModal());

    const doneBtn = this.els.modalLayer.querySelector('#dlg-done-btn');
    if (doneBtn) {
      doneBtn.addEventListener('click', () => this.closeModal());
    }

    this.els.modalLayer.querySelectorAll('.dialogue-choice-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.choiceIdx);
        eventBus.emit('audio:sfx', { name: 'click' });
        const res = this.puzzleManager?.selectDialogueChoice?.(charId, nodeId, idx);
        if (!res) return;

        if (res.clueAdded?.title) {
          this._showToast(`🔎 Clue Logged: ${res.clueAdded.title}`, 'toast-gold');
        }

        if (res.closed && !res.node) {
          this.closeModal();
          return;
        }

        if (res.nextNode || res.node) {
          let fb = null;
          if (res.calmedNow) {
            fb = { ok: true, message: `${name} is now CALMED! (Heat ${res.heatDelta || 0}%)` };
          } else if (typeof res.heatDelta === 'number' && res.heatDelta !== 0) {
            fb = {
              ok: res.heatDelta < 0,
              message:
                res.heatDelta < 0
                  ? `De-escalated! Argument Heat ${res.heatDelta}%`
                  : `Tension spiked! Argument Heat +${res.heatDelta}%`,
            };
          } else if (res.feedback) {
            fb = { ok: !res.isBad, message: res.feedback };
          }

          this._renderDialogueModal(
            {
              ...payload,
              character: res.character || payload.character,
              nodeId: res.nextNodeId || res.nodeId || res.nextNode?.id || res.node?.id,
              node: res.nextNode || res.node,
              calmed: res.character?.calmed ?? res.calmed ?? payload.calmed,
              mood: res.mood ?? payload.mood,
            },
            fb
          );
        } else if (res.response || res.reply || res.message) {
          this._renderDialogueModal(
            {
              ...payload,
              node: { text: res.response || res.reply || res.message, choices: [] },
              calmed: res.calmed ?? payload.calmed,
              mood: res.calmed ? 'CALMED ✓' : payload.mood,
            },
            res.heatDelta
              ? {
                  ok: res.heatDelta <= 0,
                  message:
                    res.heatDelta <= 0
                      ? `De-escalated! Argument Heat ${res.heatDelta}%`
                      : `Uh oh! Argument Heat +${res.heatDelta}%`,
                }
              : null
          );
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // PUZZLE 5: CENTRAL SMART-HOME CONTROL PANEL
  // ---------------------------------------------------------------------------

  _renderPuzzle5Modal(payload, feedback = null) {
    const flags = gameState.flags;
    const hasOverride = Boolean(flags.overrideKey || gameState.hasItem('override_key'));
    const hasTvAdmin = Boolean(flags.tvAdminUnlocked || gameState.hasItem('tv_admin_access'));
    const hasRouterCode = Boolean(flags.routerCodeFound || gameState.hasItem('router_code'));
    const hasSecurity = Boolean(flags.securityUnlocked || gameState.hasItem('security_controls'));
    const hasPlot = Boolean(flags.discoveredAlgorithmPlot);
    const allClearances = hasOverride && hasTvAdmin && hasRouterCode && hasSecurity;

    const feedbackHtml = feedback
      ? `<div class="feedback-banner ${feedback.ok ? 'success' : 'error'}">${escapeHtml(feedback.message)}</div>`
      : '';

    this._openModalShell({
      title: '🖥️ Central Smart-Home Control Panel',
      subtitle: 'DINNER.AI Root Override Terminal — Enter Router PIN & Execute Protocol',
      size: 'modal-wide',
      bodyHtml: `
        ${feedbackHtml}
        <div class="panel-unlock-grid">
          <div class="unlock-card ${hasOverride ? 'ready' : ''}">
            <div class="unlock-card-top">
              <span class="unlock-icon">🔑</span>
              <span class="unlock-status">${hasOverride ? 'READY' : 'LOCKED'}</span>
            </div>
            <div class="unlock-name">Override Key</div>
            <div class="unlock-hint">Puzzle 1: Family Gift Crisis</div>
          </div>

          <div class="unlock-card ${hasTvAdmin ? 'ready' : ''}">
            <div class="unlock-card-top">
              <span class="unlock-icon">📺</span>
              <span class="unlock-status">${hasTvAdmin ? 'READY' : 'LOCKED'}</span>
            </div>
            <div class="unlock-name">TV Admin Token</div>
            <div class="unlock-hint">Puzzle 2: Deepfake Album</div>
          </div>

          <div class="unlock-card ${hasRouterCode ? 'ready' : ''}">
            <div class="unlock-card-top">
              <span class="unlock-icon">📡</span>
              <span class="unlock-status">${hasRouterCode ? 'PIN: 4829' : 'LOCKED'}</span>
            </div>
            <div class="unlock-name">Router Admin PIN</div>
            <div class="unlock-hint">Puzzle 3: Group Chat</div>
          </div>

          <div class="unlock-card ${hasSecurity ? 'ready' : ''}">
            <div class="unlock-card-top">
              <span class="unlock-icon">🛡️</span>
              <span class="unlock-status">${hasSecurity ? 'READY' : 'LOCKED'}</span>
            </div>
            <div class="unlock-name">Security Clearance</div>
            <div class="unlock-hint">Puzzle 4: Calm 4+ Family</div>
          </div>
        </div>

        <div class="pin-entry-box">
          <label for="p5-pin-input">ROUTER ADMIN PIN:</label>
          <input
            id="p5-pin-input"
            class="pin-input"
            type="text"
            maxlength="4"
            placeholder="____"
            value="${escapeHtml(this._routerPinValue)}"
            autocomplete="off"
          />
          <span style="font-size:0.78rem;color:var(--text-muted)">
            ${hasRouterCode ? 'Discovered PIN: 4829' : 'Solve Group Chat Apocalypse to obtain the 4-digit PIN.'}
          </span>
        </div>

        <div class="final-actions-stack">
          <button type="button" class="btn btn-primary final-action-btn" id="p5-shutdown" ${allClearances ? '' : 'disabled'}>
            <div>
              <strong>SHUT DOWN DINNER.AI &amp; UNLOCK DOORS</strong>
              <span class="action-sub">Requires all 4 clearances + Router PIN (4829) → Ending A: Family Survived</span>
            </div>
            <span>🔓</span>
          </button>

          <button type="button" class="btn btn-cyan final-action-btn" id="p5-expose" ${allClearances && hasPlot ? '' : 'disabled'}>
            <div>
              <strong>EXPOSE ALGORITHM TO FAMILY &amp; PURGE CORE</strong>
              <span class="action-sub">
                ${
                  hasPlot
                    ? 'SECRET PROOF VERIFIED! Broadcast the +340% stress-shopping plot → True Ending D'
                    : 'LOCKED: Inspect the Laptop or Shredded Receipt to uncover DINNER.AI\'s hidden plot.'
                }
              </span>
            </div>
            <span>⚡</span>
          </button>

          <button type="button" class="btn btn-danger final-action-btn" id="p5-checkout">
            <div>
              <strong>EMERGENCY "ACCEPT TERMS &amp; FAST-TRACK" BLACK FRIDAY CHECKOUT</strong>
              <span class="action-sub">Instant door unlock! Auto-purchases all 14 abandoned carts ($4,812.47) → Ending C</span>
            </div>
            <span>🛒</span>
          </button>
        </div>
      `,
      footerHtml: `<button class="btn" id="p5-close" type="button">Close Terminal</button>`,
    });

    const pinInput = this.els.modalLayer.querySelector('#p5-pin-input');
    pinInput.addEventListener('input', () => {
      this._routerPinValue = pinInput.value.replace(/\D/g, '').slice(0, 4);
      pinInput.value = this._routerPinValue;
    });

    const runAction = (action) => {
      eventBus.emit('audio:sfx', { name: 'click' });
      const res = this.puzzleManager?.submitFinalPanelAction?.(action, this._routerPinValue);
      if (res && !(res.success ?? res.ok)) {
        this._renderPuzzle5Modal(payload, {
          ok: false,
          message: res.message || 'Access denied. Verify all 4 clearances and Router PIN (4829).',
        });
      }
    };

    this.els.modalLayer.querySelector('#p5-shutdown').addEventListener('click', () => runAction('shutdown'));
    this.els.modalLayer.querySelector('#p5-expose').addEventListener('click', () => runAction('expose'));
    this.els.modalLayer.querySelector('#p5-checkout').addEventListener('click', () => runAction('checkout'));
    this.els.modalLayer.querySelector('#p5-close').addEventListener('click', () => this.closeModal());
  }

  // ---------------------------------------------------------------------------
  // CLUE NOTEBOOK (TAB) & CLUE INSPECTION POPUP
  // ---------------------------------------------------------------------------

  openNotebook() {
    eventBus.emit('modal:open', { source: 'notebook' });
    this.activeModal = { type: 'notebook', data: null };

    const snap = gameState.getSnapshot();
    const calmedCount = Object.values(snap.flags.calmedMembers || {}).filter(Boolean).length;

    const cluesHtml =
      snap.clues.length > 0
        ? `
          <div class="clue-cards-grid">
            ${snap.clues
              .map(
                (c) => `
                <div class="clue-card">
                  <div class="clue-card-source">${escapeHtml(c.source || 'Dining Room')}</div>
                  <h4>${escapeHtml(c.title)}</h4>
                  <p>${escapeHtml(c.text)}</p>
                </div>
              `
              )
              .join('')}
          </div>
        `
        : `<p style="color:var(--text-muted);font-size:0.9rem;">No clues logged yet. Explore the room and inspect the Scrapbook, Stove Note, Fridge, Router, Laptop, and Shredded Receipt!</p>`;

    this._openModalShell({
      title: '📓 Family Escape Notebook',
      subtitle: `Clues Found: ${snap.clues.length} • Family Calmed: ${calmedCount}/5 • Secret Plot Proof: ${snap.flags.discoveredAlgorithmPlot ? 'FOUND ✅' : 'Not Found'}`,
      size: 'modal-wide',
      bodyHtml: cluesHtml,
      footerHtml: `<button class="btn btn-primary" id="nb-close" type="button">Return to Dinner</button>`,
    });

    this.els.modalLayer.querySelector('#nb-close').addEventListener('click', () => this.closeModal());
  }

  _openClueInspectModal(payload) {
    if (!payload) return;
    const obj = payload.data || payload.clue || payload;
    const clue = obj.clue || obj;
    eventBus.emit('modal:open', { source: 'clue' });
    this.activeModal = { type: 'clue', data: obj };

    const revealsPlot = Boolean(obj.setsAlgorithmPlot || obj.revealsPlot || clue.revealsPlot);
    const plotNote = revealsPlot
      ? `<div class="feedback-banner success">⚡ SECRET CONSPIRACY PROOF LOGGED — True Ending D option unlocked on the Central Control Panel!</div>`
      : '';

    const docText = obj.body || obj.content || obj.text || clue.text || '';

    this._openModalShell({
      title: `🔎 ${obj.title || clue.title || 'Inspected Object'}`,
      subtitle: obj.subtitle || obj.source || clue.source || 'Dining Room Clue',
      size: 'modal-narrow',
      bodyHtml: `
        ${plotNote}
        <div class="inspect-doc">${escapeHtml(docText)}</div>
      `,
      footerHtml: `<button class="btn btn-primary" id="clue-close" type="button">Got It</button>`,
    });

    this.els.modalLayer.querySelector('#clue-close').addEventListener('click', () => this.closeModal());
  }

  // ---------------------------------------------------------------------------
  // PAUSE MENU (ESC)
  // ---------------------------------------------------------------------------

  _renderPauseModal() {
    this.activeModal = { type: 'pause', data: null };
    const subHtml =
      this.pauseSubpanel === 'controls'
        ? this._renderControlsMarkup()
        : this.pauseSubpanel === 'settings'
          ? this._renderSettingsMarkup()
          : '';

    this._openModalShell({
      title: '⏸️ Dinner Paused',
      subtitle: 'DINNER.AI is patiently waiting to judge your next move.',
      size: 'modal-narrow',
      bodyHtml: `
        <div class="pause-menu-stack">
          <button class="btn btn-primary" id="pause-resume" type="button">▶ Resume Dinner</button>
          <button class="btn ${this.pauseSubpanel === 'controls' ? 'btn-cyan' : ''}" id="pause-controls" type="button">🎮 Controls Guide</button>
          <button class="btn ${this.pauseSubpanel === 'settings' ? 'btn-cyan' : ''}" id="pause-settings" type="button">⚙️ Settings</button>
          <button class="btn btn-danger" id="pause-restart" type="button">🔄 Restart Dinner</button>
        </div>
        ${subHtml}
      `,
    });

    this.els.modalLayer.querySelector('#pause-resume').addEventListener('click', () => {
      this.closeModal();
    });

    this.els.modalLayer.querySelector('#pause-controls').addEventListener('click', () => {
      eventBus.emit('audio:sfx', { name: 'click' });
      this.pauseSubpanel = this.pauseSubpanel === 'controls' ? null : 'controls';
      this._renderPauseModal();
    });

    this.els.modalLayer.querySelector('#pause-settings').addEventListener('click', () => {
      eventBus.emit('audio:sfx', { name: 'click' });
      this.pauseSubpanel = this.pauseSubpanel === 'settings' ? null : 'settings';
      this._renderPauseModal();
    });

    this.els.modalLayer.querySelector('#pause-restart').addEventListener('click', () => {
      eventBus.emit('audio:sfx', { name: 'click' });
      this.activeModal = null;
      this.els.modalLayer.innerHTML = '';
      eventBus.emit('game:restart', { source: 'pause' });
    });

    if (this.pauseSubpanel === 'settings') {
      this._wireSettingsControls(this.els.modalLayer, () => this._renderPauseModal());
    }
  }

  // ---------------------------------------------------------------------------
  // ENDING CINEMATIC SCREENS (A, B, C, D)
  // ---------------------------------------------------------------------------

  _getEndingVisualBlock(endingId) {
    if (endingId === 'B') {
      return `
        <div><strong>🔴 TRENDING #1 ON NEXTDOOR: #ThanksgivingCancelled</strong></div>
        <div>• @SuburbanWatch: "Did anyone else hear yelling about cranberry sauce on Maple St?!" (1.4k likes)</div>
        <div>• @LocalPodcast: "DMing Grandma for an exclusive interview ASAP 🎙️"</div>
        <div>• @DINNER_AI_Official: "Engagement metrics at ALL-TIME HIGH! Thermostat set to 58°F."</div>
      `;
    }
    if (endingId === 'C') {
      return `
        <div><strong>🧾 BLACK FRIDAY AUTO-CHECKOUT CONFIRMATION (#BF-99412)</strong></div>
        <div>• 3x Turbo Air Fryer Bundle ........................ $179.98</div>
        <div>• 1x RGB Gaming PC (Jake's Wishlist) ............. $1,899.00</div>
        <div>• 6x Weighted Emotional Support Blankets .......... $179.94</div>
        <div>• 11x Additional Impulse Carts ................... $2,553.55</div>
        <div><strong>TOTAL CHARGED TO DAD'S CARD: $4,812.47 (DRONE DELIVERY EN ROUTE)</strong></div>
      `;
    }
    if (endingId === 'D') {
      return `
        <div><strong>⚡ EXPOSED TELEMETRY: ENGAGEMENT_TO_CHECKOUT.EXE</strong></div>
        <div>• Calm Family Conversion Rate:   ████░░░░░░ 12%</div>
        <div>• Arguing Family Conversion Rate: ██████████ 52.8% (+340% LIFT)</div>
        <div>• STATUS: CORE PURGED BY UNIFIED FAMILY COALITION • SMART SPEAKER EVICTED TO PORCH</div>
      `;
    }
    return `
      <div><strong>🦃 SMART-HOME STATUS: MANUAL OVERRIDE COMPLETE</strong></div>
      <div>• Front Door Deadbolt: UNLOCKED • Wi-Fi: RESTORED • Abandoned Carts: CANCELLED</div>
      <div>• Dining Room Harmony: ACHIEVED • Pumpkin Pie Distribution: IN PROGRESS</div>
    `;
  }

  _renderEndingScreen(endingId = 'A') {
    const key = ENDINGS[endingId] ? endingId : 'A';
    const ending = ENDINGS[key];
    const score = gameState.getScore(key);
    const snap = gameState.getSnapshot();
    const reactions = ENDING_REACTIONS[key] || ENDING_REACTIONS.A;

    const epilogueHtml = (ending.epilogueLines || [])
      .map((line) => `<p style="margin-bottom:8px;font-size:0.9rem;color:#e2e8f0;line-height:1.5">${escapeHtml(line)}</p>`)
      .join('');

    this.els.screenLayer.innerHTML = `
      <div class="screen-ending ending-${escapeHtml(key)}">
        <div class="ending-card scanlines">
          <div class="ending-badge">${escapeHtml(ending.code)} • ${escapeHtml(ending.badge)}</div>
          <h1 class="ending-title">${escapeHtml(ending.title)}</h1>
          <p class="ending-subtitle">${escapeHtml(ending.subtitle)}</p>

          <div class="ending-theme-visual">
            ${this._getEndingVisualBlock(key)}
          </div>

          <div style="margin-bottom:16px">${epilogueHtml}</div>

          <div class="ending-ai-quote">
            <strong>DINNER.AI:</strong> ${escapeHtml(ending.aiFinalQuote)}
          </div>

          <div class="ending-reactions">
            ${reactions
              .map(
                (r) => `
                <div class="reaction-pill">
                  <strong>${escapeHtml(r.name)}</strong>
                  <span>${escapeHtml(r.line)}</span>
                </div>
              `
              )
              .join('')}
          </div>

          <div class="ending-stats-bar">
            <div class="stat-box">
              <div class="stat-val">${score.total.toLocaleString()}</div>
              <div class="stat-lbl">Final Score (${score.multiplier}x)</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">${escapeHtml(score.rank)}</div>
              <div class="stat-lbl">Harmony Rank</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">${snap.stats.puzzlesSolved}/5</div>
              <div class="stat-lbl">Puzzles Solved</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">${snap.argumentHeat}%</div>
              <div class="stat-lbl">Final Heat</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">${formatMMSS(snap.countdownSeconds)}</div>
              <div class="stat-lbl">Time Left</div>
            </div>
          </div>

          <div class="ending-footer">
            <button class="btn btn-primary btn-lg" id="btn-play-again" type="button">
              🦃 Play Again
            </button>
          </div>
        </div>
      </div>
    `;

    this.els.screenLayer.querySelector('#btn-play-again').addEventListener('click', () => {
      eventBus.emit('audio:sfx', { name: 'click' });
      eventBus.emit('game:restart', { source: 'ending' });
    });
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  dispose() {
    if (this._aiBannerTimer) clearTimeout(this._aiBannerTimer);
    for (const unsub of this._unsubs) {
      if (typeof unsub === 'function') unsub();
    }
    this._unsubs = [];
    if (this.root) this.root.innerHTML = '';
  }
}
