// Central game state container. Keeps a single source of truth for
// the currently-controlled soldier and other global state.
export const GameState = {
  currentSoldier: window.currentSoldier || null,
  soldierCount: window.soldierCount || 0,
  AnimationManager: window.AnimationManager || null,
  setCurrentSoldier(soldier) {
    this.currentSoldier = soldier;
    window.currentSoldier = soldier;
  },
};

// Backwards compatibility for non-module code
window.GameState = window.GameState || GameState;
