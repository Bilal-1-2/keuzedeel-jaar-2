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
    this.fps = 5;
    this.frameTimer = 0;
    this.frameInterval = 1000 / this.fps;
    this.gravity = 0.4; // acceleration downward
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

    // Stop grenade slightly above the floor (same “not glued to bottom” feel as the player)
    const groundY = this.gameHeight - this.height - (this.floorOffset || 0);

    if (this.GrenadeonGround()) {
      this.y = groundY;
      this.vy = 0;
      this.vh = 0.01;
    } else {
      this.vy += this.gravity;
    }

    if (this.y >= groundY) this.y = groundY;
    // Destroy conditions
    const age = Date.now() - this.startTime;
    if (this.frameX >= this.maxFrame || age > this.lifetime) {
      this.exists = false;
      return;
    }
    // Animation advance
    this.frameTimer += deltaTime;
    if (
      (this.frameTimer > this.frameInterval && this.GrenadeonGround()) ||
      age >= 2000
    ) {
      this.frameX = this.frameX + 1;
      this.frameTimer = 0;
    }

    // Optional: screen bounds (grenade can fly offscreen naturally)
    // if (this.x >= this.gameWidth -this.width) this.exists = false;
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
    const groundY = this.gameHeight - this.height - (this.floorOffset || 0);
    return this.y >= groundY;
  }

}
