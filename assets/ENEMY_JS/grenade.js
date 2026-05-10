export default class Grenade {
  constructor(x, y, facingRight, gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.x = x;
    this.y = y;
    this.facingRight = facingRight;
    this.vh = facingRight ? 10 : -10; // horizontal velocity - constant thrust
    this.vy = -5; // initial upward velocity
    this.width = 128;
    this.height = 128;
    this.image = document.getElementById("grenade");
    this.frameX = 0;
    this.frameY = 0;
    this.maxFrame = 6;
    this.fps = 20;
    this.frameTimer = 0;
    this.frameInterval = 1000 / this.fps;
    this.gravity = 0.25; // acceleration downward
    this.lifetime = 3000; // ms before self-destruct
    this.exists = true;
    this.flip = !facingRight;
    this.startTime = Date.now();
  }

  update(deltaTime) {
    if (!this.exists) return;

    // Horizontal movement - constant speed
    this.x += this.vh;

    // Vertical physics - gravity arc (thrown trajectory)

    this.y += this.vy;
    if (this.GrenadeonGround()) {
      this.y = this.gameHeight - this.height;
      this.vy = 0;
    } else {
      this.vy += this.gravity;
    }
    if (this.y >= this.gameHeight - this.height)
      this.y  = this.gameHeight - this.height;

    // Animation advance
    this.frameTimer += deltaTime;
    if (this.frameTimer > this.frameInterval && this.GrenadeonGround()) {
      this.frameX = (this.frameX + 1) % this.maxFrame;
      this.frameTimer = 0;
    }

    // Destroy conditions
    const age = Date.now() - this.startTime;
    if (age > this.lifetime || this.y > this.gameHeight) {
      this.exists = false;
      return;
    }

    // Optional: screen bounds (grenade can fly offscreen naturally)
    // if (this.x < -this.width) this.exists = false;
    // if (this.x > this.gameWidth) this.exists = false;
  }

  draw(ctx, deltaTime) {
    if (!this.exists || !this.image) return;

    const sx = this.frameX * this.width;
    const sy = this.frameY * this.height;

    if (this.flip) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(
        this.image,
        sx,
        sy,
        this.width,
        this.height,
        -this.x - this.width,
        this.y,
        this.width,
        this.height,
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        this.image,
        sx,
        sy,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height,
      );
    }
  }

  GrenadeonGround() {
    return this.y >= this.gameHeight - this.height;
  }
}
