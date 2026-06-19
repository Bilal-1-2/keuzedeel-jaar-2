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

    // Visual/logic duration controls for debugging collision.
    // The explosion currently lasts 1 frame; extend how long it stays visible/active.
    this.explosionDurationMs = 1000; // normal explosion duration (1s)
    this.exists = true;
    this.flip = !facingRight;
    this.startTime = Date.now();

    // Explosion (separate from "exists" - the grenade keeps existing
    // for one frame while exploded so the blast can be drawn/checked,
    // then exists is set false right after).
    this.hasExploded = false;
    // Smaller circle radius for easier collision debugging
    this.blastRadius = 60; // px
    this.damage = 50; // damage dealt to anything caught in the blast
  }

  update(deltaTime) {
    if (!this.exists) return;
    if (this.hasExploded) {
      // Keep the explosion visible/active for a fixed duration.
      const elapsed = Date.now() - this.explosionStartMs;
      if (elapsed >= this.explosionDurationMs) {
        this.exists = false;
      }
      return;
    }

    // Horizontal movement - constant speed
    this.x += this.vh;

    // Vertical physics - gravity arc (thrown trajectory)
    this.y += this.vy;

    // Stop grenade slightly above the floor (same "not glued to bottom" feel as the player)
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
      this.explode();
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
  }

  // Call this once, whenever the grenade should detonate
  // (animation finished, lifetime expired, or it hit something directly).
  explode() {
    if (this.hasExploded) return;
    this.hasExploded = true;
    this.explosionStartMs = Date.now();
  }

  // Center point of the explosion, used for radius-based damage checks.
  getBlastCenter() {
    return {
      x: this.x + this.width / 2,
      // lower the blast center so the collision feels lower
      y: this.y + this.height * 1,
    };
  }

  // AABB hitbox for the grenade itself, while it's still flying
  // (e.g. for a direct hit before it would otherwise explode).
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

  // Distance-based check: is a given hitbox within the blast radius?
  // Uses the closest point on the box to the blast center, so it works
  // correctly even for large target boxes (not just point targets).
  isInBlastRadius(targetBox) {
    const center = this.getBlastCenter();

    const closestX = Math.max(
      targetBox.left,
      Math.min(center.x, targetBox.right),
    );
    const closestY = Math.max(
      targetBox.top,
      Math.min(center.y, targetBox.bottom),
    );

    const dx = center.x - closestX;
    const dy = center.y - closestY;
    const distSq = dx * dx + dy * dy;

    return distSq <= this.blastRadius * this.blastRadius;
  }

  draw(ctx, deltaTime) {
    if (!this.exists || !this.image) return;

    // if (this.hasExploded) {
    //   // Simple blast visual - swap for a sprite/animation .
    //   const center = this.getBlastCenter();
    //   ctx.save();
    //   ctx.fillStyle = "rgba(255, 140, 0, 0.5)";
    //   ctx.beginPath();
    //   ctx.arc(center.x, center.y, this.blastRadius, 0, Math.PI * 2);
    //   ctx.fill();
    //   ctx.restore();
    //   return;
    // }

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
