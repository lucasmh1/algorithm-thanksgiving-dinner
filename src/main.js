import { eventBus } from './core/EventBus.js';
import { gameState } from './core/GameState.js';
import { GameEngine } from './engine/GameEngine.js';
import { PuzzleManager } from './puzzles/PuzzleManager.js';
import { UIManager } from './ui/UIManager.js';
import { AudioManager } from './audio/AudioManager.js';

function bootstrap() {
  const audioManager = new AudioManager();
  const puzzleManager = new PuzzleManager();
  const uiManager = new UIManager(puzzleManager);
  const engine = new GameEngine('#canvas-container');

  // Global keyboard shortcuts: ESC (pause / close modal / resume) & TAB (Clue Notebook)
  const onGlobalKeyDown = (e) => {
    const isInput =
      e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');

    if (e.code === 'Escape') {
      if (gameState.phase === 'modal') {
        e.preventDefault();
        eventBus.emit('modal:close', { source: 'escape' });
      } else if (gameState.phase === 'playing') {
        e.preventDefault();
        eventBus.emit('game:pause', { source: 'escape' });
      } else if (gameState.phase === 'paused') {
        e.preventDefault();
        eventBus.emit('game:resume', { source: 'escape' });
      }
      return;
    }

    if (e.code === 'Tab' && !isInput) {
      if (gameState.phase === 'playing') {
        e.preventDefault();
        eventBus.emit('ui:toggleNotebook', { open: true });
      } else if (gameState.phase === 'modal') {
        e.preventDefault();
        eventBus.emit('ui:toggleNotebook', { open: false });
      }
    }
  };

  window.addEventListener('keydown', onGlobalKeyDown);

  // Clean teardown on page unload
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('keydown', onGlobalKeyDown);
    engine.dispose();
    audioManager?.dispose?.();
    uiManager?.dispose?.();
    puzzleManager?.dispose?.();
  });

  // Expose debug handle for QA and automated verification
  window.__GAME__ = {
    gameState,
    eventBus,
    engine,
    puzzleManager,
    uiManager,
    audioManager,
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
