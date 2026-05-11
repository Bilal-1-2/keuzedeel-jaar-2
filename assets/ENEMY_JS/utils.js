import Grenade from "./grenade.js";

export function drawStatusText(context, input, player, deltaTime, grenades) {
  // Default to enabled
  drawStatusText.debugOn ??= true;
  // Toggle debug with 'd'
  if (input.lastKey === "PRESS d") {
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

  // Ground
  context.fillStyle = player.onGround() ? "#00ff00" : "#ff0000";
  context.fillText(`OnGround: ${player.onGround()}`, 10, y);
  y += 15;
  context.fillStyle = "black";

  // Game dims
  context.fillText(`GameW/H: ${player.gameWidth}/${player.gameHeight}`, 10, y);
  y += 15;

  // Grenade Debug Section
  y += 10;
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
