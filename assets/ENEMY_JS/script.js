import Player from "./player.js";
import Grenade from "./grenade.js";
import InputHandler from "./input.js";
import { drawStatusText } from "./utils.js";
let grenades = [];

window.addEventListener("load", function () {
  const laoding = document.getElementById("laoding");
  laoding.style.display = "none";
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = this.window.innerHeight;
  const spawnGrenade = (spawnX, spawnY, facingRight) => {
    grenades.push(new Grenade(spawnX, spawnY, facingRight));
  };
  const player = new Player(canvas.width, canvas.height, spawnGrenade);

  const input = new InputHandler();
  let lastTime = 0;
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // console.log(input.lastKey);
    // Update existing grenades
    // Update all
    grenades.forEach((grenade) => grenade.update(deltaTime));

    // Filter dead (reassign shorter array - efficient for few items)
    grenades = grenades.filter((grenade) => grenade.exists);

    // Draw surviving
    grenades.forEach((grenade) => grenade.draw(ctx, deltaTime));

    // Draw grenades
    grenades.forEach((grenade) => grenade.draw(ctx, deltaTime));

    player.update(input);
    player.draw(ctx, deltaTime);
    drawStatusText(ctx, input, player, deltaTime, grenades);
    requestAnimationFrame(animate);
  }
  animate(0);
});
