/**
 * Lightweight pub/sub EventBus for decoupled communication between
 * Three.js scene systems, PuzzleManager, AudioManager, and UIManager.
 */
export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   * @param {string} event
   * @param {Function} fn
   * @returns {() => void}
   */
  on(event, fn) {
    if (typeof fn !== 'function') return () => {};
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  /**
   * Unsubscribe a listener from an event.
   * @param {string} event
   * @param {Function} fn
   */
  off(event, fn) {
    const set = this._listeners.get(event);
    if (!set) return;
    set.delete(fn);
    if (set.size === 0) {
      this._listeners.delete(event);
    }
  }

  /**
   * Emit an event with an optional payload to all registered listeners.
   * @param {string} event
   * @param {*} payload
   */
  emit(event, payload) {
    const set = this._listeners.get(event);
    if (!set || set.size === 0) return;
    // Snapshot to allow listeners to unsubscribe safely during dispatch
    const snapshot = Array.from(set);
    for (const fn of snapshot) {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[EventBus] Error in listener for "${event}":`, err);
      }
    }
  }

  /**
   * Remove all listeners across all events.
   */
  clear() {
    this._listeners.clear();
  }
}

export const eventBus = new EventBus();
