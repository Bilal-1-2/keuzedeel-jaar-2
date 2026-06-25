import {
  Standing,
  Reloading,
  Running,
  Jumping,
  Walking,
  ThrowingGrenade,
  Shooting,
  Melee,
  Gethit,
  Dead,
  states,
} from "./state.js";
import { SoundManager } from "./sounds.js";

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
    // this.previousState = states.STANDING;
    this.image = document.getElementById("soldier");

    // Render sprite size (full frame)
    this.width = 128;
    this.height = 128;

    // Real hitbox / position box (actual character size)
    this.playerheight = 68;
    this.playerwidth = 22;

    // Start so the hitbox is centered horizontally, and sits slightly above the bottom.
    // (Note: script.js will override x/y, but this keeps Player defaults correct.)
    this.x = this.playerwidth / 2;

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
    this.maxHealth = 100;
    this.isDead = false;
    this.isAlive = true;
    this.grenades = 5;

    // Melee
    this.meleeRange = 20; // px in front of the player the hit reaches
    this.meleeDamage = 20;
    this._meleeHitActive = false; // set true on the damaging frame
    this._meleeHitApplied = false; // prevents multiple hits per swing

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

  drawHealthBar(context) {
    if (typeof this.maxHealth !== "number" || this.maxHealth <= 0) return;

    const barMaxWidth = 60;
    const barHeight = 6;
    const pct = Math.max(0, this.health / this.maxHealth);

    // center over hitbox
    const cx = this.flip
      ? this.x + (this.width - this.playerwidth + 20) / 2 + this.playerwidth / 2
      : this.x +
        (this.width - this.playerwidth - 20) / 2 +
        this.playerwidth / 2;

    const cy = this.y + 40;

    context.fillStyle = "rgba(0,0,0,0.5)";
    context.fillRect(cx - barMaxWidth / 2, cy, barMaxWidth, barHeight);

    context.fillStyle =
      pct > 0.5 ? "#4caf50" : pct > 0.2 ? "#ffb300" : "#e53935";
    context.fillRect(cx - barMaxWidth / 2, cy, barMaxWidth * pct, barHeight);

    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.strokeRect(cx - barMaxWidth / 2, cy, barMaxWidth, barHeight);
  }

  draw(context, deltaTime) {
    // Health bar above player
    this.drawHealthBar(context);

    // Hitbox debug (actual character size)
    context.strokeStyle = "#ff000000";

    // Place hitbox on the bottom of the sprite (not centered vertically)
    context.strokeRect(
      this.flip
        ? this.x + (this.width - this.playerwidth + 20) / 2
        : this.x + (this.width - this.playerwidth - 20) / 2,
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
    const wasOnGround = this.onGround();
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

    // Land sound: was airborne, now on ground
    if (!wasOnGround && this.onGround()) {
      SoundManager.play("land");
    }

    // Footstep sounds: triggered on specific animation frames while moving
    const stateName = this.currentState.state;
    if (stateName === "RUNNING" && this.frameX % 2 === 0 && this._lastFootstepFrame !== this.frameX) {
      SoundManager.play("footstepRun");
      this._lastFootstepFrame = this.frameX;
    } else if (stateName === "WALKING" && this.frameX % 3 === 0 && this._lastFootstepFrame !== this.frameX) {
      SoundManager.play("footstepWalk");
      this._lastFootstepFrame = this.frameX;
    } else if (stateName !== "RUNNING" && stateName !== "WALKING") {
      this._lastFootstepFrame = -1;
    }

    if (this.health <= 0 && !this.isDead) {
      console.log("Dead anim 4");
      this.setState(states.DEAD);
    } else if (this._pendingGetHitAnim && !this.isDead) {
      this._pendingGetHitAnim = false;
      this.previousState = this.currentState.state !== "GETHIT"
        ? this.states.indexOf(this.currentState)
        : (this.previousState ?? states.STANDING);
      this.setState(states.GETHIT);
    }
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

  hitboxesOverlap(boxA, boxB) {
    return (
      boxA.left < boxB.right &&
      boxA.right > boxB.left &&
      boxA.top < boxB.bottom &&
      boxA.bottom > boxB.top
    );
  }

  isInvincible() {
    return this.currentState?.state === "GETHIT" || this.isDead;
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
