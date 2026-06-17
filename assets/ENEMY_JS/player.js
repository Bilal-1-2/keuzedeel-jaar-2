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
    ];
    this.currentState = this.states[0];
    // this.previousState = states.STANDING;
    this.image = document.getElementById("soldier") ;

    // Render sprite size (full frame)
    this.width = 128;
    this.height = 128;

    // Real hitbox / position box (actual character size)
    this.playerheight = 68;
    this.playerwidth = 22;

    // Start so the hitbox is centered horizontally, and sits slightly above the bottom.
    // (Note: script.js will override x/y, but this keeps Player defaults correct.)
    this.x = this.playerwidth / 2 ;

    // How far above the ground the player should rest (in px)
    this.floorOffset = 12;
    this.y = this.gameHeight - this.playerheight - this.floorOffset;

    // These are kept for drawing sprite frames (full sprite size). Do not change.
    this.width = 128;
    this.height = 128;
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
    this.isDead = false;
    this.isAlive = true;
    this.grenades = 5;

    // Base animation fps
    this.fps = 40;
    // Shooting animation fps target (60)
    this.shootingFps = 60;

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
    // Hitbox debug (actual character size)
    context.strokeStyle = "red";
    // Place hitbox on the bottom of the sprite (not centered vertically)
    context.strokeRect(
      this.flip
        ? this.x + (this.width - this.playerwidth + 20) / 2 
        : this.x + (this.width - this.playerwidth - 20) / 2 ,
      // Lift the CHARACTER (position box) + hitbox upward by paddingBottom
      this.y + (this.height - this.playerheight - (this.paddingBottom || 0)),
      this.playerwidth,
      this.playerheight,
    );

    // Use faster animation speed while shooting
    const interval =
      this.currentState.state === "SHOOTING"
        ? (1000 / this.shootingFps) * 4
        : this.frameInterval;

    if (this.frameTimer > interval) {
      if (this.frameX < this.maxFrames) {
        this.frameX++;
      } else {
        if (
          this.currentState.state !== "SHOOTING" &&
          this.currentState.state !== "DEAD"
        ) {
          this.frameX = 0;
        } else if (this.currentState.state === "SHOOTING") {
          this.hasShot = false;
          this.frameX = 1;
          this.animationComplete = true;
        } else if (this.currentState.state === "DEAD") {
          // Clamp to last death frame and stop advancing
          this.frameX = this.maxFrames;
          console.log("Dead anim: 2");
        }
      }
      this.frameTimer = 0;
    } else {
      this.frameTimer += deltaTime;
    }

    // Rest of draw method remains the same...
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

  // In player.js, update the update() method:
  update(input) {
    this.currentState.handleInput(input);
    this.x += this.speed;

    // CHANGE THIS: Use worldWidth instead of gameWidth
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

    if (this.health <= 0 && !this.isDead) {
      console.log("Dead anim 4");
      this.setState(states.DEAD);
    }
  }

  setState(state) {
    this.currentState = this.states[state];
    this.currentState.enter();
  }

  onGround() {
    const groundY = this.gameHeight - this.height - this.floorOffset;
    return this.y >= groundY;
  }
}
