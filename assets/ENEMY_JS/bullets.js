export default class Bullet {
  constructor(x, y, facingRight, gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.x = x;
    this.y = y;
    this.facingRight = facingRight;
    this.vh = facingRight ? 10 : -10; // horizontal velocity - constant thrust
    this.width = 6;
    this.height = 2;

    // this.image = document.getElementById("grenade");
    // this.frameX = 0;
    // this.frameY = 0;
    // this.maxFrame = 6;
    this.fps = 60;
    this.frameTimer = 0;
    this.frameInterval = 1000 / this.fps;
    // this.gravity = 0.4; // acceleration downward
    // this.lifetime = 3000; // ms before self-destruct
    this.exists = true;
    this.flip = !facingRight;
    this.startTime = Date.now();
  }
  update(deltaTime) {
    if (!this.exists) return;
    // this.x = this.vh;
    this.frameTimer += deltaTime;
    if (this.frameTimer > this.frameInterval) {
      this.x += this.facingRight ? 20 : -20;
      this.frameTimer = 0;
    }
    if (this.x > window.worldWidth + 500) this.exists = false;
    if (this.x < -500) this.exists = false;

    // Also remove if too high or too low
    if (this.y > this.gameHeight + 200) this.exists = false;
    if (this.y < -200) this.exists = false;
  }

  draw(ctx, deltaTime) {
    if (!this.exists) return;
    ctx.fillStyle = "#fa9a0b";
    ctx.fillRect(this.x, this.y, this.width, this.height);

    return;
  }
}
