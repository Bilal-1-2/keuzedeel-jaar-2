import Grenade from "./grenade.js";

export function attachHealthButton(player) {
  const btn = document.getElementById("healthDamageBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (player && !player.isDead) {
      player.health = Math.max(0, (player.health || 0) - 25);
      if (player.health <= 0) {
        player.setState(8);
      }
    }
  });
}

// Fixed HUD health bar, drawn in screen space (no camera translate),
// so it stays put in the corner and is always readable - unlike the
// small bar that floats above the player's head in player.js, this
// one never scrolls offscreen or gets covered by enemies/sprites.
export function drawHealthHUD(context, player) {
  if (!player || typeof player.health !== "number") return;

  const maxHealth =
    typeof player.maxHealth === "number" && player.maxHealth > 0
      ? player.maxHealth
      : 100;

  const barWidth = 220;
  const barHeight = 22;
  const x = context.canvas.width - barWidth - 16;
  const y = 16;
  const pct = Math.max(0, Math.min(1, player.health / maxHealth));

  context.save();

  // Background / empty portion
  context.fillStyle = "rgba(0,0,0,0.55)";
  context.fillRect(x, y, barWidth, barHeight);

  // Filled portion - color shifts as health drops
  context.fillStyle = pct > 0.5 ? "#4caf50" : pct > 0.2 ? "#ffb300" : "#e53935";
  context.fillRect(x, y, barWidth * pct, barHeight);

  // Border
  context.strokeStyle = "#0a0e14";
  context.lineWidth = 2;
  context.strokeRect(x, y, barWidth, barHeight);

  // Label - current / max health
  context.font = "bold 13px Arial";
  context.fillStyle = "white";
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.fillText(
    `${Math.max(0, Math.round(player.health))} / ${maxHealth}`,
    x + barWidth / 2,
    y + barHeight / 2 + 1,
  );

  // Ammo label (under the health bar, top-right)
  const ammo = typeof player.magazine === "number" ? player.magazine : 0;
  const ammoText = `AMMO: ${ammo} / 30`;
  context.font = "bold 12px Arial";
  context.fillStyle = "#d7e3ff";
  context.textBaseline = "top";
  context.textAlign = "center";
  context.fillText(ammoText, x + barWidth / 2, y + barHeight + 4);

  context.restore();
}

export function drawStatusText(context, input, player, deltaTime, grenades) {
  // Default to disabled (hidden) until user toggles.
  drawStatusText.debugOn ??= false;

  // Toggle debug with the 'd' key
  if (input.lastKey === "PRESS d") {
    drawStatusText.debugOn = !drawStatusText.debugOn;
  }

  // Also toggle debug overlays with the "e" key
  // (user request: show debug/hitboxes when pressing a button/key)
  if (input.lastKey === "PRESS e") {
    drawStatusText.debugOn = !drawStatusText.debugOn;
  }

  if (!drawStatusText.debugOn) return;

  // Grenade array default if not provided
  grenades = grenades || [];

  // Semi-transparent background - expand height for grenade debug
  context.fillStyle = "rgba(255, 255, 255, 0.8)";
  context.fillRect(5, 5, 300, 460);

  context.font = "14px Arial";
  context.fillStyle = "black";
  let y = 25;

  // Input
  context.fillText(`Last input: ${input.lastKey}`, 10, y);
  y += 20;

  // Position/Velocity
  context.fillText(`X: ${Math.round(player.x)}`, 10, y);
  y += 15;
  context.fillText(`Y: ${Math.round(player.y)}`, 10, y);
  y += 15;
  context.fillText(`Vy: ${player.vy.toFixed(1)}`, 10, y);
  y += 15;
  context.fillText(`Speed: ${player.speed.toFixed(1)}`, 10, y);
  y += 15;
  context.fillText(`Flip: ${player.flip}`, 10, y);
  y += 15;

  // Animation
  context.fillText(`FrameX/Y: ${player.frameX}/${player.frameY}`, 10, y);
  y += 15;
  context.fillText(`MaxFrames: ${player.maxFrames}`, 10, y);
  y += 15;
  context.fillText(`FPS: ${player.fps}`, 10, y);
  y += 15;

  // State
  context.fillText(`State: ${player.currentState.state}`, 10, y);
  y += 15;
  context.fillText(`Prev State: ${player.previousState}`, 10, y);
  y += 15;
  context.fillText(`left: ${input.keys.left}`, 10, y);
  y += 15;
  context.fillText(`right: ${input.keys.right}`, 10, y);
  y += 15;
  context.fillText(`up: ${input.keys.up}`, 10, y);
  y += 15;
  context.fillText(`down: ${input.keys.down}`, 10, y);
  y += 15;
  context.fillText(`ctrl: ${input.keys.ctrl}`, 10, y);
  y += 15;
  context.fillText(`magazine: ${player.magazine}`, 10, y);
  y += 15;
  context.fillText(`health: ${player.health}`, 10, y);
  y += 15;

  // Ground
  context.fillStyle = player.onGround() ? "#00ff00" : "#ff0000";
  context.fillText(`OnGround: ${player.onGround()}`, 10, y);
  y += 15;
  context.fillStyle = "black";

  // Game dims
  context.fillText(`GameW/H: ${player.gameWidth}/${player.gameHeight}`, 10, y);
  y += 15;
  context.fillText(`GRENADES : ${player.grenades}`, 10, y);
  // Grenade Debug Section
  y += 25;
  context.fillStyle = "rgba(0,0,0,0.6)";
  context.fillRect(8, y - 12, 284, 18);
  context.fillStyle = "white";
  context.fillText(`GRENADES (${grenades.length})`, 10, y);

  y += 18;
  context.fillStyle = "black";

  grenades.forEach((g, i) => {
    context.fillText(
      `#${i + 1} X:${Math.round(g.x)} Y:${Math.round(g.y)}`,
      10,
      y,
    );
    y += 15;
    context.fillText(
      `    Vh:${g.vh.toFixed(1)} Vy:${g.vy.toFixed(1)} Ex:${g.exists}`,
      10,
      y,
    );
    y += 15;
    context.fillText(
      `    F:${g.frameX}/${g.maxFrame} Age:${Date.now() - g.startTime}ms`,
      10,
      y,
    );
    y += 15;
  });
  // Extra grenade summary (right side)

  if (grenades.length === 0) {
    context.fillStyle = "#888";
    context.fillText("No active grenades", 10, y);
    context.fillStyle = "black";
  }
}
