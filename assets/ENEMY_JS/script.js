import Player from "./player.js";
import Grenade from "./grenade.js";
import Bullet from "./bullets.js";
import InputHandler from "./input.js";
import { drawStatusText, attachHealthButton } from "./utils.js";
import { Background } from "./background.js";

let grenades = [];
let bullets = [];
let background;

// CAMERA SYSTEM
let cameraX = 0;
let cameraY = 0;

// WORLD BOUNDARIES
window.worldWidth = 5000; // Make available to player.js
const worldHeight = 786;

// SCREEN EDGE THRESHOLDS (20% from edges)
const edgeThreshold = 0.2;
const leftEdge = edgeThreshold;
const rightEdge = 1 - edgeThreshold;

// game object (kept for compatibility)
const game = { speed: 0 };

window.addEventListener("load", function () {
  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "none";

  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const spawnGrenade = (spawnX, spawnY, facingRight) => {
    grenades.push(
      new Grenade(spawnX, spawnY, facingRight, canvas.width, canvas.height),
    );
  };

  const spawnBullet = (spawnX, spawnY, facingRight) => {
    bullets.push(
      new Bullet(spawnX, spawnY, facingRight, canvas.width, canvas.height),
    );
  };

  const player = new Player(
    canvas.width,
    canvas.height,
    spawnGrenade,
    spawnBullet,
  );

  // Start player in the middle of the world
  player.x = window.worldWidth / 2 - player.width / 2;
  player.y = canvas.height - player.height;

  attachHealthButton(player);

  const input = new InputHandler();

  // Initialize background
  background = new Background(game);

  let lastTime = 0;

  function updateCamera() {
    // Calculate where the player appears on screen
    const playerScreenX = player.x - cameraX;

    // Define screen boundaries (20% from edges)
    const leftBoundary = canvas.width * leftEdge;
    const rightBoundary = canvas.width * rightEdge;

    // Move camera when player gets close to edges
    if (playerScreenX < leftBoundary) {
      cameraX = player.x - leftBoundary;
    } else if (playerScreenX > rightBoundary) {
      cameraX = player.x - rightBoundary;
    }

    // Keep camera within world boundaries
    cameraX = Math.max(0, Math.min(cameraX, window.worldWidth - canvas.width));
  }

  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // UPDATE PLAYER FIRST
    player.update(input);

    // UPDATE CAMERA BASED ON PLAYER POSITION
    updateCamera();

    // DRAW BACKGROUND (pass cameraX for parallax)
    if (background) {
      background.update(cameraX);
      background.draw(ctx);
    }

    // UPDATE AND DRAW GRENADES
    grenades.forEach((grenade) => grenade.update(deltaTime));
    grenades = grenades.filter((grenade) => grenade.exists);
    grenades.forEach((grenade) => {
      ctx.save();
      ctx.translate(-cameraX, -cameraY);
      grenade.draw(ctx, deltaTime);
      ctx.restore();
    });

    // UPDATE AND DRAW BULLETS
    bullets.forEach((bullet) => bullet.update(deltaTime));
    bullets = bullets.filter((bullet) => bullet.exists);
    bullets.forEach((bullet) => {
      ctx.save();
      ctx.translate(-cameraX, -cameraY);
      bullet.draw(ctx, deltaTime);
      ctx.restore();
    });

    // DRAW PLAYER
    ctx.save();
    ctx.translate(-cameraX, -cameraY);
    player.draw(ctx, deltaTime);
    ctx.restore();

    // DRAW DEBUG TEXT
    drawStatusText(ctx, input, player, deltaTime, grenades, bullets);

    // Draw world boundaries for debugging
    if (drawStatusText.debugOn) {
      ctx.save();
      ctx.translate(-cameraX, 0);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 10]);

      // Left boundary
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, canvas.height);
      ctx.stroke();

      // Right boundary
      ctx.beginPath();
      ctx.moveTo(window.worldWidth, 0);
      ctx.lineTo(window.worldWidth, canvas.height);
      ctx.stroke();

      ctx.restore();

      // // Camera info
      // ctx.fillStyle = "yellow";
      // ctx.fillText(`World Width: ${window.worldWidth}`, 10, 110);
      // ctx.fillText(`Camera X: ${Math.round(cameraX)}`, 10, 125);
      // ctx.fillText(`Player X: ${Math.round(player.x)}`, 10, 140);
    }

    requestAnimationFrame(animate);
  }

  animate(0);
});
