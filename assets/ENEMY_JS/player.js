import {
  Standing,
  Reloading,
  Running,
  Jumping,
  Walking,
  ThrowingGrenade,
  Shooting,
  Melee,
  Dead,
  states,
  Gethit,
} from "./state.js";

export default class Player {
  constructor(gameWidth, gameHeight, spawnGrenade, spawnBullet) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.states = [
      new Standing(this), // 0
      new Reloading(this), // 1
      new Running(this), // 2
      new Jumping(this), // 3
      new Walking(this), // 4
      new ThrowingGrenade(this), // 5
      new Shooting(this), // 6
      new Melee(this), // 7
      new Dead(this), // 8
      new Gethit(this), // 9
    ];
    this.currentState = this.states[0];
    this.image = document.getElementById("soldier");

    // Render sprite size (full frame)
    this.width = 128;
    this.height = 128;

    // Real hitbox / position box (actual character size)
    this.playerheight = 68;
    this.playerwidth = 22;

    // Start so the hitbox is centered horizontally, and sits slightly above the bottom.
    this.x = this.playerwidth / 2;

    // How far above the ground the player should rest (in px)
    this.floorOffset = 12;
    this.y = this.gameHeight - this.playerheight - this.floorOffset;

    this.vy = 0;
    this.weight = 0.5;
    this.frameX = 0;
    this.frameY = 0;
    this.maxFrames = 6;
    this.speed = 0;
    this.maxSpeed = 10;
    this.flip = false;

    // player stats
    this.magazine = 30;
    this.health = 100;
    this.maxHealth = 100;
    this.isDead = false;
    this.isAlive = true;
    this.grenades = 5;

    // Hit cooldown (invincibility frames)
    this.hitCooldown = 0;
    this.hitCooldownDuration = 1000; // 1 second invincibility

    // Base animation fps
    this.fps = 40;
    this.shootingFps = 60;

    this.frameTimer = 0;
    this.previousState = states.STANDING;
    this._currentNumericState = states.STANDING;

    // Default interval for most states
    this.frameInterval = (1000 / this.fps) * 4;

    this.animationComplete = false;
    this.spawnGrenade = spawnGrenade || null;
    this.spawnBullet = spawnBullet || null;
    this.hasThrown = false;
    this.hasShot = false;
    this._pendingGetHitAnim = false;
  }

  drawHealthBar(context) {
    if (this.maxHealth <= 0) return;

    const barWidth = 200;
    const barHeight = 18;
    const x = 20;
    const y = 20;

    const pct = Math.max(0, this.health / this.maxHealth);

    // background
    context.fillStyle = "rgba(0,0,0,0.6)";
    context.fillRect(x, y, barWidth, barHeight);

    // fill
    context.fillStyle =
      pct > 0.5 ? "#4caf50" : pct > 0.2 ? "#ffb300" : "#e53935";
    context.fillRect(x, y, barWidth * pct, barHeight);

    // border
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.strokeRect(x, y, barWidth, barHeight);

    // label
    context.fillStyle = "white";
    context.font = "12px Arial";
    context.fillText(
      `${Math.max(0, Math.round(this.health))} / ${this.maxHealth}`,
      x + 6,
      y + barHeight - 5,
    );
  }

  draw(context, deltaTime) {
    // Hitbox debug (actual character size)
    context.strokeStyle = "red";
    context.strokeRect(
      this.flip
        ? this.x + (this.width - this.playerwidth + 20) / 2
        : this.x + (this.width - this.playerwidth - 20) / 2,
      this.y + (this.height - this.playerheight - (this.paddingBottom || 0)),
      this.playerwidth,
      this.playerheight,
    );

    // Use faster animation speed while shooting
    const interval =
      this.currentState.state === "SHOOTING"
        ? (1000 / this.shootingFps) * 4
        : this.frameInterval;

    // For GETHIT state, use a slower interval (slower animation than normal)
    const effectiveInterval =
      this.currentState.state === "GETHIT" ? (1000 / 15) * 3 : interval;

    if (this.frameTimer > effectiveInterval) {
      if (this.frameX < this.maxFrames) {
        this.frameX++;
      } else {
        if (
          this.currentState.state !== "GETHIT" &&
          this.currentState.state !== "DEAD" &&
          this.currentState.state !== "SHOOTING"
        ) {
          this.frameX = 0;
        } else if (this.currentState.state === "SHOOTING") {
          this.hasShot = false;
          this.frameX = 1;
          this.animationComplete = true;
        } else if (this.currentState.state === "DEAD") {
          this.frameX = this.maxFrames;
        }
        // For GETHIT, keep frameX at maxFrames
      }
      this.frameTimer = 0;
    } else {
      this.frameTimer += deltaTime;
    }

    // Visual feedback for invincibility (flashing)
    if (this.isInvincible() && this.currentState.state !== "DEAD") {
      const flash = Math.floor(Date.now() / 100) % 2 === 0;
      if (flash) {
        context.globalAlpha = 0.5;
      }
    }

    // Draw the player sprite
    if (this.flip) {
      context.save();
      context.scale(-1, 1);
      context.drawImage(
        this.image,
        this.width * this.frameX,
        this.height * this.frameY,
        this.width,
        this.height,
        -this.x - this.width,
        this.y,
        this.width,
        this.height,
      );
      context.restore();
    } else {
      context.drawImage(
        this.image,
        this.width * this.frameX,
        this.height * this.frameY,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height,
      );
    }

    // Reset alpha
    context.globalAlpha = 1.0;
  }

  update(input) {
    // Decrease cooldown
    if (this.hitCooldown > 0) {
      this.hitCooldown -= 16.67;
      if (this.hitCooldown < 0) this.hitCooldown = 0;
    }

    // Handle the get-hit animation - only if cooldown is ready
    if (
      this._pendingGetHitAnim &&
      this.health > 0 &&
      !this.isDead &&
      this.hitCooldown <= 0
    ) {
      this._pendingGetHitAnim = false;
      this.hitCooldown = this.hitCooldownDuration;
      this.setState(states.GETHIT);
      return;
    }

    // Now let the current state handle input
    this.currentState.handleInput(input);

    // Movement and physics (skip if in GETHIT state)
    if (this.currentState.state !== "GETHIT") {
      this.x += this.speed;

      if (this.x <= 0) this.x = 0;
      else if (this.x >= window.worldWidth - this.width)
        this.x = window.worldWidth - this.width;

      this.y += this.vy;
      if (!this.onGround()) {
        this.vy += this.weight;
      } else {
        this.vy = 0;
      }
      const groundY = this.gameHeight - this.height - this.floorOffset;
      if (this.y >= groundY) this.y = groundY;
    }

    // Check for death LAST
    if (this.health <= 0 && !this.isDead) {
      console.log("Dead anim from update");
      this.setState(states.DEAD);
    }
  }

  isInvincible() {
    return this.hitCooldown > 0;
  }

  getHitbox() {
    const left = this.flip
      ? this.x + (this.width - this.playerwidth + 20) / 2
      : this.x + (this.width - this.playerwidth - 20) / 2;
    const top =
      this.y + (this.height - this.playerheight - (this.paddingBottom || 0));

    return {
      left,
      right: left + this.playerwidth,
      top,
      bottom: top + this.playerheight,
    };
  }

  setState(state) {
    // Store the current numeric state as previous BEFORE changing
    if (this._currentNumericState !== states.GETHIT) {
      this.previousState = this._currentNumericState ?? states.STANDING;
    }
    this._currentNumericState = state;
    this.currentState = this.states[state];
    this.currentState.enter();
  }

  onGround() {
    const groundY = this.gameHeight - this.height - this.floorOffset;
    return this.y >= groundY;
  }
}
