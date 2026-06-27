import Player from "./player.js";
import Grenade from "./grenade.js";
import Bullet from "./bullets.js";
import InputHandler from "./input.js";
import { drawStatusText, attachHealthButton, drawHealthHUD } from "./utils.js";
import { states } from "./state.js";
import { Background } from "./background.js";
import { getLevel } from "./levels.js";
import { Enemy, icebull, iceSkeleton } from "./enemy.js";
import { SoundManager } from "./sounds.js";

let grenades = [];
let bullets = [];
let background;

// CAMERA SYSTEM
let cameraX = 0;
let cameraY = 0;


const edgeThreshold = 0.5;
const leftEdge = edgeThreshold;
const rightEdge = 1 - edgeThreshold;

// game object (kept for compatibility)
const game = { speed: 0 };

// Set once startGame() runs - everything below depends on a level
// having been chosen from the menu first.
let canvas, ctx, player, input, enemies, currentLevel;
let animationFrameId = null;

function setupGame(levelKey) {
  currentLevelKey = levelKey;
  currentLevel = getLevel(levelKey);
  window.worldWidth = currentLevel.worldWidth;

  canvas = document.getElementById("canvas1");
  ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  grenades = [];
  bullets = [];
  cameraX = 0;
  cameraY = 0;

  const spawnGrenade = (spawnX, spawnY, facingRight) => {
    const g = new Grenade(
      spawnX,
      spawnY,
      facingRight,
      canvas.width,
      canvas.height,
    );
    g.floorOffset = player.floorOffset;
    grenades.push(g);
  };

  const spawnBullet = (spawnX, spawnY, facingRight) => {
    bullets.push(
      new Bullet(spawnX, spawnY, facingRight, canvas.width, canvas.height),
    );
  };

  player = new Player(canvas.width, canvas.height, spawnGrenade, spawnBullet);

  player.x = (player.width - player.playerwidth) / 2;
  player.y = canvas.height - player.playerheight - player.floorOffset;

  attachHealthButton(player);

  input = new InputHandler();

  enemies = [];

  const enemySpawners = {
    icebull: () => new icebull(),
    iceSkeleton: () => new iceSkeleton(),
  };

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

  background = new Background(currentLevel.background);
}

function updateCamera() {
  const playerScreenX = player.x - cameraX;
  const leftBoundary = canvas.width * leftEdge;
  const rightBoundary = canvas.width * rightEdge;

  if (playerScreenX < leftBoundary) {
    cameraX = player.x - leftBoundary;
  } else if (playerScreenX > rightBoundary) {
    cameraX = player.x - rightBoundary;
  }

  cameraX = Math.max(0, Math.min(cameraX, window.worldWidth - canvas.width));
}

function checkBulletEnemyCollisions(bullets, enemies) {
  bullets.forEach((bullet) => {
    if (!bullet.exists) return;

    const bulletBox = bullet.getHitbox();

    for (const enemy of enemies) {
      if (enemy.isDead) continue;

      const enemyBox = enemy.getHitbox();

      if (bullet.hitboxesOverlap(bulletBox, enemyBox)) {
        enemy.takeDamage(3);
        bullet.exists = false;
        break;
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
      if (player.health > 0 && !player.isDead && !player.isInvincible()) {
        player.health -= 25;
        if (player.health < 0) player.health = 0;
        player._pendingGetHitAnim = true;

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

    SoundManager.play("explosion");

    enemies.forEach((enemy) => {
      if (enemy.isDead) return;
      const enemyBox = enemy.getHitbox();
      if (grenade.isInBlastRadius(enemyBox)) {
        enemy.takeDamage(grenade.damage ?? 50);
      }
    });

    grenade._damageApplied = true;
  });
}

// Melee -> enemy collision. The player's Melee state (state.js) sets
// `player._meleeHitActive = true` on its damaging frame; we build a
// small hitbox extending `meleeRange` px in front of the player and
// damage any enemy it overlaps, once per swing.
function checkMeleeEnemyCollisions(player, enemies) {
  if (!player._meleeHitActive || player._meleeHitApplied) return;

  const meleeRange = player.meleeRange ?? 20;
  const pBox = player.getHitbox();

  const meleeBox = player.flip
    ? {
        left: pBox.left - meleeRange,
        right: pBox.left,
        top: pBox.top,
        bottom: pBox.bottom,
      }
    : {
        left: pBox.right,
        right: pBox.right + meleeRange,
        top: pBox.top,
        bottom: pBox.bottom,
      };

  enemies.forEach((enemy) => {
    if (enemy.isDead) return;
    const enemyBox = enemy.getHitbox();
    if (player.hitboxesOverlap?.(meleeBox, enemyBox)) {
      enemy.takeDamage(player.meleeDamage ?? 20);
    }
  });

  player._meleeHitApplied = true;
}

function animate(timeStamp, lastTimeRef) {
  const deltaTime = timeStamp - lastTimeRef.value;
  lastTimeRef.value = timeStamp;

  checkBulletPlayerCollisions(bullets, player);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  player.update(input);
  checkMeleeEnemyCollisions(player, enemies);

  updateCamera();

  if (background) {
    background.update(cameraX);
    background.draw(ctx);
  }

  grenades.forEach((grenade) => grenade.update(deltaTime));
  checkGrenadeEnemyCollisions(grenades, enemies);
  grenades = grenades.filter((grenade) => grenade.exists);
  grenades.forEach((grenade) => {
    ctx.save();
    ctx.translate(-cameraX, -cameraY);
    grenade.draw(ctx, deltaTime);
    ctx.restore();
  });

  bullets.forEach((bullet) => bullet.update(deltaTime));
  bullets = bullets.filter((bullet) => bullet.exists);

  const playerBox = player.getHitbox?.();
  if (playerBox) {
    bullets.forEach((bullet) => bullet.update(deltaTime));
    checkBulletEnemyCollisions(bullets, enemies);
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

  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  player.draw(ctx, deltaTime);
  ctx.restore();

  enemies.forEach((enemy) => {
    enemy.update(deltaTime);

    ctx.save();
    ctx.translate(-cameraX, -cameraY);
    enemy.draw(ctx, deltaTime);
    ctx.restore();
  });

  drawHealthHUD(ctx, player);
  drawStatusText(ctx, input, player, deltaTime, grenades, bullets);

  // ── Victory check: all enemies dead/vanished → level complete ──
  // An enemy counts as "cleared" once isDead OR isVanished is true.
  if (!_victoryShown && enemies.length > 0) {
    const allCleared = enemies.every((e) => e.isDead || e.isVanished);
    if (allCleared) {
      console.log(`[Victory] All ${enemies.length} enemies cleared! Showing overlay in 1.2s.`);
      _victoryShown = true;
      setTimeout(showVictoryOverlay, 1200);
    }
  }

  if (drawStatusText.debugOn) {
    ctx.save();
    ctx.translate(-cameraX, 0);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(window.worldWidth, 0);
    ctx.lineTo(window.worldWidth, canvas.height);
    ctx.stroke();

    ctx.restore();
  }

  animationFrameId = requestAnimationFrame((t) => animate(t, lastTimeRef));
}

// Called by the level-select menu (see menu.js) once the player picks a
// level. Safe to call again later (e.g. "next level") - it tears down
// the previous loop and starts fresh.
export function startGame(levelKey) {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  SoundManager.init(); // unlock AudioContext on first user click
  hideVictoryOverlay();
  setupGame(levelKey);

  const lastTimeRef = { value: 0 };
  animate(0, lastTimeRef);
}

// Stops the game loop and brings the level-select menu back up. Called
// from state.js (with a short delay, so the death animation gets to
// play first) once the player has died.
export function returnToMenu() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  hideVictoryOverlay();

  if (typeof window.showMenu === "function") {
    window.showMenu("You died. Choose a level to try again.");
  } else {
    console.warn(
      "[script.js] window.showMenu is not defined - is menu.js loaded?",
    );
  }
}

// ── Victory overlay ──────────────────────────────────────────────────────────

let _victoryShown = false;

function showVictoryOverlay() {
  // _victoryShown is already true (set before the setTimeout that called us)
  // so we don't gate on it here - we just show the overlay.

  // Stop the game loop - nothing left to do
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  const overlay = document.getElementById("victoryOverlay");
  const nextBtn = document.getElementById("victoryNextBtn");
  const restartBtn = document.getElementById("victoryRestartBtn");
  const menuBtn = document.getElementById("victoryMenuBtn");
  const subtitle = document.getElementById("victorySubtitle");

  if (!overlay) return;

  // Show/hide "Next Level" based on whether a next level exists
  const nextLevelKey = currentLevel?.nextLevel ?? null;
  if (nextBtn) {
    if (nextLevelKey) {
      nextBtn.classList.remove("hidden");
      nextBtn.onclick = () => {
        window.startGame(nextLevelKey);
      };
    } else {
      nextBtn.classList.add("hidden");
    }
  }

  if (restartBtn) {
    restartBtn.onclick = () => {
      window.startGame(currentLevelKey);
    };
  }

  if (menuBtn) {
    menuBtn.onclick = () => {
      hideVictoryOverlay();
      if (typeof window.showMenu === "function") {
        window.showMenu("Choose where to drop in.");
      }
    };
  }

  if (subtitle) {
    subtitle.textContent =
      nextLevelKey ? "All enemies defeated. Ready for the next?" : "All enemies defeated. You finished the last level!";
  }

  SoundManager.play("victory");
  overlay.classList.remove("hidden");
}

function hideVictoryOverlay() {
  _victoryShown = false;
  const overlay = document.getElementById("victoryOverlay");
  if (overlay) overlay.classList.add("hidden");
}

// Track the current level key so Restart can reuse it
let currentLevelKey = null;

// Expose globally too, since the menu's button onclick is simplest as
// plain inline JS / non-module script, and state.js calls this without
// importing script.js as a module.
window.startGame = startGame;
window.returnToMenu = returnToMenu;
