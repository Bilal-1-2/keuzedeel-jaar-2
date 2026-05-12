import Player from "./player.js";
import Grenade from "./grenade.js";
import Bullet from "./bullets.js";
import InputHandler from "./input.js";
import { drawStatusText, attachHealthButton } from "./utils.js";
let grenades = [];
let bullets = [];

window.addEventListener("load", function () {
  const laoding = document.getElementById("laoding");
  laoding.style.display = "none";
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = this.window.innerHeight;
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

  attachHealthButton(player);

  const input = new InputHandler();
  let lastTime = 0;
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update all
    grenades.forEach((grenade) => grenade.update(deltaTime));

    // Filter dead (reassign shorter array - efficient for few items)
    grenades = grenades.filter((grenade) => grenade.exists);

    // Draw grenades
    grenades.forEach((grenade) => grenade.draw(ctx, deltaTime));

    // Update all
    bullets.forEach((bullet) => bullet.update(deltaTime));

    // Filter dead (reassign shorter array - efficient for few items)
    bullets = bullets.filter((bullet) => bullet.exists);

    // Draw bullets
    bullets.forEach((bullet) => bullet.draw(ctx, deltaTime));

    player.update(input);
    player.draw(ctx, deltaTime);
    drawStatusText(ctx, input, player, deltaTime, grenades, bullets);
    requestAnimationFrame(animate);
  }
  animate(0);
});
