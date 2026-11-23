import { eventBus } from './EventBus.js';
import { ENDINGS } from '../data/narrative.js';

const INITIAL_HEAT = 18;
const INITIAL_COUNTDOWN = 900; // 15:00 Black Friday auto-checkout timer

function createInitialPuzzles() {
  return {
    1: {
      id: 1,
      name: 'The Algorithm Gift Swap',
      status: 'active',
      rewardId: 'override_key',
    },
    2: {
      id: 2,
      name: 'The Deepfake Family Album',
      status: 'active',
      rewardId: 'tv_admin_access',
    },
    3: {
      id: 3,
      name: 'The Group Chat Apocalypse',
      status: 'active',
      rewardId: 'router_code',
    },
    4: {
      id: 4,
      name: 'The Argument Thermostat',
      status: 'active',
      rewardId: 'security_controls',
    },
    5: {
      id: 5,
      name: 'The Black Friday Countdown',
      status: 'locked',
      rewardId: 'system_shutdown',
    },
  };
}

function createInitialFlags() {
  return {
    overrideKey: false,
    tvAdminUnlocked: false,
    routerCodeFound: false,
    securityUnlocked: false,
    discoveredAlgorithmPlot: false,
    calmedMembers: {},
  };
}

function createInitialStats() {
  return {
    mistakes: 0,
    landminesTriggered: 0,
    puzzlesSolved: 0,
    adsDismissed: 0,
    elapsedSeconds: 0,
  };
}

/**
 * Central reactive game state for THE ALGORITHM THANKSGIVING DINNER.
 * Emits `state:changed`, `heat:changed`, and `puzzle:completed` on `eventBus`.
 */
export class GameState {
  constructor() {
    this.phase = 'title';
    this.argumentHeat = INITIAL_HEAT;
    this.countdownSeconds = INITIAL_COUNTDOWN;
    this.puzzles = createInitialPuzzles();
    this.inventory = [];
    this.clues = [];
    this.flags = createInitialFlags();
    this.stats = createInitialStats();
    this.endingId = null;
  }

  /**
   * Reset all state to initial values for a fresh run.
   */
  reset() {
    this.phase = 'title';
    this.argumentHeat = INITIAL_HEAT;
    this.countdownSeconds = INITIAL_COUNTDOWN;
    this.puzzles = createInitialPuzzles();
    this.inventory = [];
    this.clues = [];
    this.flags = createInitialFlags();
    this.stats = createInitialStats();
    this.endingId = null;

    eventBus.emit('heat:changed', {
      heat: this.argumentHeat,
      previous: INITIAL_HEAT,
      delta: 0,
      reason: 'reset',
    });
    eventBus.emit('state:changed', this.getSnapshot());
  }

  /**
   * Adjust argument heat by a delta (clamped 0..100).
   * @param {number} delta
   * @param {string} [reason='']
   * @returns {number} New heat value
   */
  addHeat(delta, reason = '') {
    return this.setHeat(this.argumentHeat + delta, reason);
  }

  /**
   * Set argument heat to an absolute value (clamped 0..100).
   * @param {number} val
   * @param {string} [reason='']
   * @returns {number} New heat value
   */
  setHeat(val, reason = '') {
    const previous = this.argumentHeat;
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    this.argumentHeat = clamped;
    const delta = clamped - previous;

    eventBus.emit('heat:changed', {
      heat: this.argumentHeat,
      previous,
      delta,
      reason,
    });
    eventBus.emit('state:changed', this.getSnapshot());
    return this.argumentHeat;
  }

  /**
   * Add an item to the player's inventory if not already owned.
   * @param {{ id: string, name: string, icon?: string, description?: string }} item
   * @returns {boolean} True if added, false if already present
   */
  addItem(item) {
    if (!item || !item.id) return false;
    if (this.hasItem(item.id)) return false;

    const normalized = {
      id: item.id,
      name: item.name || item.id,
      icon: item.icon || '🔑',
      description: item.description || '',
    };
    this.inventory.push(normalized);

    // Keep convenience flags in sync with key puzzle rewards
    if (normalized.id === 'override_key') this.flags.overrideKey = true;
    if (normalized.id === 'tv_admin_access') this.flags.tvAdminUnlocked = true;
    if (normalized.id === 'router_code') this.flags.routerCodeFound = true;
    if (normalized.id === 'security_controls') this.flags.securityUnlocked = true;

    eventBus.emit('state:changed', this.getSnapshot());
    return true;
  }

  /**
   * Check whether an item is in inventory.
   * @param {string} id
   * @returns {boolean}
   */
  hasItem(id) {
    return this.inventory.some((item) => item.id === id);
  }

  /**
   * Add a clue to the player's journal if not already recorded.
   * @param {{ id: string, title: string, text: string, source?: string }} clue
   * @returns {boolean} True if newly added
   */
  addClue(clue) {
    if (!clue || !clue.id) return false;
    if (this.hasClue(clue.id)) return false;

    this.clues.push({
      id: clue.id,
      title: clue.title || 'Clue',
      text: clue.text || '',
      source: clue.source || 'Dining Room',
    });
    eventBus.emit('state:changed', this.getSnapshot());
    return true;
  }

  /**
   * Check whether a clue has already been discovered.
   * @param {string} id
   * @returns {boolean}
   */
  hasClue(id) {
    return this.clues.some((c) => c.id === id);
  }

  /**
   * Mark a puzzle (1..5) as completed, award its item, and unlock Puzzle 5 once 1..4 are done.
   * @param {number} id
   * @param {{ id: string, name: string, icon?: string, description?: string }|null} [rewardItem]
   * @returns {boolean} True if puzzle transitioned to completed
   */
  completePuzzle(id, rewardItem = null) {
    const puzzle = this.puzzles[id];
    if (!puzzle || puzzle.status === 'completed') return false;

    puzzle.status = 'completed';
    this.stats.puzzlesSolved = Object.values(this.puzzles).filter(
      (p) => p.status === 'completed'
    ).length;

    // Sync puzzle-specific flags
    if (id === 1) this.flags.overrideKey = true;
    if (id === 2) this.flags.tvAdminUnlocked = true;
    if (id === 3) this.flags.routerCodeFound = true;
    if (id === 4) this.flags.securityUnlocked = true;

    if (rewardItem) {
      this.addItem(rewardItem);
    }

    // Unlock Puzzle 5 once Puzzles 1-4 are all completed
    const allCoreSolved = [1, 2, 3, 4].every(
      (pid) => this.puzzles[pid]?.status === 'completed'
    );
    let unlockedFinale = false;
    if (allCoreSolved && this.puzzles[5] && this.puzzles[5].status === 'locked') {
      this.puzzles[5].status = 'active';
      unlockedFinale = true;
    }

    eventBus.emit('puzzle:completed', {
      id,
      puzzle: { ...puzzle },
      rewardItem,
      unlockedFinale,
    });
    eventBus.emit('state:changed', this.getSnapshot());
    return true;
  }

  /**
   * Set a boolean or nested flag value.
   * @param {string} key
   * @param {*} value
   */
  setFlag(key, value) {
    this.flags[key] = value;
    eventBus.emit('state:changed', this.getSnapshot());
  }

  /**
   * Transition game phase ('title'|'playing'|'paused'|'modal'|'ending').
   * @param {'title'|'playing'|'paused'|'modal'|'ending'} phase
   */
  setPhase(phase) {
    if (this.phase === phase) return;
    this.phase = phase;
    eventBus.emit('state:changed', this.getSnapshot());
  }

  /**
   * Calculate final score and grade breakdown.
   * @param {string} [endingKey] Optional ending key ('A'|'B'|'C'|'D')
   */
  getScore(endingKey = this.endingId) {
    const ending = endingKey && ENDINGS[endingKey] ? ENDINGS[endingKey] : null;
    const multiplier = ending ? ending.scoreMultiplier : 1.0;

    const puzzleBonus = this.stats.puzzlesSolved * 500;
    const heatBonus = Math.max(0, Math.round((100 - this.argumentHeat) * 12));
    const timeBonus = Math.max(0, Math.round(this.countdownSeconds * 2));
    const clueBonus = this.clues.length * 100;
    const penalty =
      this.stats.mistakes * 120 + this.stats.landminesTriggered * 150;

    const raw = Math.max(
      0,
      puzzleBonus + heatBonus + timeBonus + clueBonus - penalty
    );
    const total = Math.round(raw * multiplier);

    let rank = 'C';
    if (total >= 4500) rank = 'S+';
    else if (total >= 3500) rank = 'S';
    else if (total >= 2600) rank = 'A';
    else if (total >= 1600) rank = 'B';
    else if (total < 800) rank = 'D';

    return {
      total,
      rank,
      multiplier,
      breakdown: {
        puzzleBonus,
        heatBonus,
        timeBonus,
        clueBonus,
        penalty,
      },
    };
  }

  /**
   * Return an immutable-style snapshot of current game state.
   */
  getSnapshot() {
    const puzzlesCopy = {};
    for (const [k, v] of Object.entries(this.puzzles)) {
      puzzlesCopy[k] = { ...v };
    }
    return {
      phase: this.phase,
      argumentHeat: this.argumentHeat,
      countdownSeconds: this.countdownSeconds,
      puzzles: puzzlesCopy,
      inventory: this.inventory.map((i) => ({ ...i })),
      clues: this.clues.map((c) => ({ ...c })),
      flags: {
        ...this.flags,
        calmedMembers: { ...this.flags.calmedMembers },
      },
      stats: { ...this.stats },
      endingId: this.endingId,
    };
  }
}

export const gameState = new GameState();
