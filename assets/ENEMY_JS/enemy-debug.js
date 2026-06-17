import { icebull, enemyStates } from "./enemy.js";

// Very small helper for quick testing.
// It assumes you wire references manually (player, canvas, ctx, etc.).

// Example usage:
// spawnIcebullForDebug({ player, canvas, ctx, gameWidth, gameHeight, debugState: 'TURN' })
// spawnIcebullForDebug({ player, canvas, ctx, gameWidth, gameHeight, debugState: 2 })

export function spawnIcebullForDebug({
  player,
  canvas,
  ctx,
  gameWidth,
  gameHeight,
  debugState,
}) {
  const enemy = new icebull();
  enemy.x = 800;
  enemy.y = canvas.height - enemy.height - 12; // rough; adjust if needed

  // Force a specific enemy animation/state for debugging.
  // - If debugState is a number: treat it as the enum value.
  // - If debugState is a string: treat it as the key in enemyStates (e.g. 'TURN', 'CHARGE').
  if (debugState !== undefined) {
    const stateEnum =
      typeof debugState === "number" ? debugState : enemyStates[debugState];

    if (stateEnum !== undefined) {
      enemy.setState(stateEnum);
    } else {
      console.warn(
        `[spawnIcebullForDebug] Unknown debugState: ${debugState}. Keeping default state.`,
      );
    }
  }

  enemy.targetPlayer = player;
  enemy.gameWidth = gameWidth;
  enemy.gameHeight = gameHeight;

  return enemy;
}
