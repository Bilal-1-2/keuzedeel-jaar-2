export default class Bullet {
  constructor(x, y, facingRight, gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;

    this.x = x;
    this.y = y;
    this.facingRight = facingRight;

    this.vh = facingRight ? 10 : -10; // horizontal velocity - constant thrust

    // Bullet size (also used for hitbox)
    this.width = 6;
    this.height = 2;

    this.fps = 60;
    this.frameTimer = 0;
    this.frameInterval = 1000 / this.fps;

    this.exists = true;
    this.flip = !facingRight;
    this.startTime = Date.now();
  }

  update(deltaTime) {
    if (!this.exists) return;

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

  getHitbox() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height,
    };
  }

  hitboxesOverlap(boxA, boxB) {
    return (
      boxA.left < boxB.right &&
      boxA.right > boxB.left &&
      boxA.top < boxB.bottom &&
      boxA.bottom > boxB.top
    );
  }

  draw(ctx, deltaTime) {
    if (!this.exists) return;

    ctx.fillStyle = "#fa9a0b";
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Debug: draw bullet hitbox
    const b = this.getHitbox();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.strokeRect(b.left, b.top, b.right - b.left, b.bottom - b.top);
  }
}
