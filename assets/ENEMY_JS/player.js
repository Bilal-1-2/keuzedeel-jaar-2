import {
  Standing,
  Reloading,
  Running,
  Jumping,
  Walking,
  ThrowingGrenade,
  Shooting,
  states,
} from "./state.js";

export default class Player {
  constructor(gameWidth, gameHeight, spawnGrenade, spawnBullet) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.states = [
      new Standing(this),
      new Reloading(this),
      new Running(this),
      new Jumping(this),
      new Walking(this),
      new ThrowingGrenade(this),
      new Shooting(this),
    ];
    this.currentState = this.states[0];
    // this.previousState = states.STANDING;
    this.image = document.getElementById("soldier");
    this.width = 128;
    this.height = 128;
    this.x = this.gameWidth / 2 - this.width / 2;
    this.y = this.gameHeight / 2 - this.height;
    this.vy = 0;
    this.weight = 0.5;
    this.frameX = 0;
    this.frameY = 0;
    this.maxFrames = 6;
    this.speed = 0;
    this.maxSpeed = 10;
    this.flip = false;
    this.magazine = 30;

    // Base animation fps
    this.fps = 20;
    // Shooting animation fps target (60)
    this.shootingFps = 40;

    this.frameTimer = 0;
    this.previousState = states.STANDING; // Store previous state

    // Default interval for most states
    this.frameInterval = (1000 / this.fps) * 4;

    this.animationComplete = false;
    this.spawnGrenade = spawnGrenade || null; // Optional callback
    this.spawnBullet = spawnBullet || null;
    this.hasThrown = false; // Prevent spam-spawn per throw
    this.hasShot = false; // Prevent spam-spawn per throw
  }

  draw(context, deltaTime) {
    // Use faster animation speed while shooting
    const interval =
      this.currentState.state === "SHOOTING"
        ? (1000 / this.shootingFps) * 4
        : this.frameInterval;

    if (this.frameTimer > interval) {
      if (this.frameX < this.maxFrames) {
        this.frameX++;
      } else {
        // Only reset to 0 if NOT in throwing grenade state
        if (this.currentState.state !== "SHOOTING") {
          this.frameX = 0;
        } else {
          // this.fps = 60
          this.hasShot = false;
          this.frameX = 1;

          this.animationComplete = true;
        }
      }
      this.frameTimer = 0;
    } else {
      this.frameTimer += deltaTime;
    }

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
  }

  update(input) {
    this.currentState.handleInput(input);
    this.x += this.speed;

    if (this.x <= 0) this.x = 0;
    else if (this.x >= this.gameWidth - this.width)
      this.x = this.gameWidth - this.width;

    this.y += this.vy;
    if (!this.onGround()) {
      this.vy += this.weight;
    } else {
      this.vy = 0;
    }
    if (this.y >= this.gameHeight - this.height)
      this.y = this.gameHeight - this.height;
  }

  setState(state) {
    this.currentState = this.states[state];
    this.currentState.enter();
  }

  onGround() {
    return this.y >= this.gameHeight - this.height;
  }
}
