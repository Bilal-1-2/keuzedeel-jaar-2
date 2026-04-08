import {
  StandingLeft,
  StandingRight,
  ReloadingLeft,
  ReloadingRight,
  RunningLeft,
  RunningRight,
  JumpingLeft,
  JumpingRight,
} from "./state.js";

export default class Player {
  constructor(gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.states = [
      new StandingLeft(this),
      new StandingRight(this),
      new ReloadingLeft(this),
      new ReloadingRight(this),
      new RunningLeft(this),
      new RunningRight(this),
      new JumpingLeft(this),
      new JumpingRight(this),
    ];
    this.currentState = this.states[1];
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
    this.fps = 30;
    this.frameTimer = 0;
    this.frameInterval = 1000 / this.fps;
  }

  draw(context, deltaTime) {
    if (this.frameTimer > this.frameInterval) {
      if (this.frameX < this.maxFrames) this.frameX++;
      else this.frameX = 0;
      this.frameTimer = 0;
    }else{
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
    // horizantall movement
    if (this.x <= 0) this.x = 0;
    else if (this.x >= this.gameWidth - this.width)
      this.x = this.gameWidth - this.width;
    // vertical movement
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
