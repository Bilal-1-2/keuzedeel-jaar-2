import Player from "./player.js";
import Grenade from "./grenade.js";
import Bullet from "./bullets.js";
import InputHandler from "./input.js";
import { drawStatusText, attachHealthButton } from "./utils.js";
import { states } from "./state.js";
import { Background } from "./background.js";
import { getLevel } from "./levels.js";
import { Enemy, icebull, iceSkeleton } from "./enemy.js";

let grenades = [];
let bullets = [];
let background;

// CAMERA SYSTEM
let cameraX = 0;
let cameraY = 0;

// WORLD BOUNDARIES
const currentLevelKey = "winter2";
const currentLevel = getLevel(currentLevelKey);

window.worldWidth = currentLevel.worldWidth;

// SCREEN EDGE THRESHOLDS (20% from edges)
const edgeThreshold = 0.5;
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
    const g = new Grenade(
      spawnX,
      spawnY,
      facingRight,
      canvas.width,
      canvas.height,
    );
    // Match the player's “lifted from bottom” feel
    g.floorOffset = player.floorOffset;
    grenades.push(g);
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

  // Start player: hitbox centered, and sits on the bottom of the screen
  // (player.nx/y are used for both sprite drawing and hitbox debug)
  player.x = (player.width - player.playerwidth) / 2;
  player.y = canvas.height - player.playerheight - player.floorOffset;

  attachHealthButton(player);

  const input = new InputHandler();

  // Spawn enemies
  const enemies = [];

  // Maps a level's enemySpawns "type" string to an actual constructor.
  const enemySpawners = {
    icebull: () => new icebull(),
    iceSkeleton: () => new iceSkeleton(),
  };

  // Actually spawn the enemies listed in the current level's config.
  currentLevel.enemySpawns.forEach((spawn) => {
    const spawnFn = enemySpawners[spawn.type];
    if (!spawnFn) {
      console.warn(
        `[script.js] Unknown enemy type "${spawn.type}" in level config.`,
      );
      return;
    }
    const enemy = spawnFn();
    enemy.x = spawn.x;
    enemy.y = canvas.height - enemy.height - (player.floorOffset || 12);
    enemy.targetPlayer = player;
    enemy.gameWidth = window.worldWidth;
    enemy.gameHeight = canvas.height;
    enemies.push(enemy);
  });

  // Initialize background
  background = new Background(currentLevel.background);

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
  function checkBulletEnemyCollisions(bullets, enemies) {
    bullets.forEach((bullet) => {
      if (!bullet.exists) return; // already dead/hit this frame

      const bulletBox = bullet.getHitbox();

      for (const enemy of enemies) {
        if (enemy.isDead) continue;

        const enemyBox = enemy.getHitbox();

        if (bullet.hitboxesOverlap(bulletBox, enemyBox)) {
          enemy.takeDamage(1); // or however much a bullet should do
          bullet.exists = false; // consume the bullet
          break; // this bullet is spent, stop checking other enemies
        }
      }
    });
  }

  function checkBulletPlayerCollisions(bullets, player) {
    bullets.forEach((bullet) => {
      if (!bullet.exists) return;
      const bulletBox = bullet.getHitbox();
      const pBox = player.getHitbox?.();
      if (pBox && bullet.hitboxesOverlap(bulletBox, pBox)) {
        // Check if player can be damaged (not invincible)
        if (player.health > 0 && !player.isDead && !player.isInvincible()) {
          player.health -= 25;
          if (player.health < 0) player.health = 0;
          // Set the flag to trigger the hit animation
          player._pendingGetHitAnim = true;
          console.log("Player hit by bullet! Health:", player.health);

          if (player.health <= 0) {
            console.log("Player should die");
          }
        }
        bullet.exists = false;
      }
    });
  }

  function checkGrenadeEnemyCollisions(grenades, enemies) {
    grenades.forEach((grenade) => {
      if (!grenade.hasExploded || grenade._damageApplied) return;

      enemies.forEach((enemy) => {
        if (enemy.isDead) return;
        const enemyBox = enemy.getHitbox();
        if (grenade.isInBlastRadius(enemyBox)) {
          enemy.takeDamage(grenade.damage ?? 50);
        }
      });

      grenade._damageApplied = true; // only damage once, the frame it explodes
    });
  }
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    checkBulletPlayerCollisions(bullets, player);
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
    checkGrenadeEnemyCollisions(grenades, enemies);
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

    // Bullet -> player hit detection (using bullet hitbox)
    const playerBox = player.getHitbox?.();
    if (playerBox) {
      bullets.forEach((bullet) => bullet.update(deltaTime));
      checkBulletEnemyCollisions(bullets, enemies); // <-- new line
      bullets = bullets.filter((bullet) => bullet.exists);
      bullets.forEach((bullet) => {
        ctx.save();
        ctx.translate(-cameraX, -cameraY);
        bullet.draw(ctx, deltaTime);
        ctx.restore();
      });
      bullets = bullets.filter((bullet) => bullet.exists);
    }

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

    // UPDATE AND DRAW ENEMIES
    enemies.forEach((enemy) => {
      enemy.update(deltaTime);

      ctx.save();
      ctx.translate(-cameraX, -cameraY);
      enemy.draw(ctx, deltaTime);
      ctx.restore();
    });

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
