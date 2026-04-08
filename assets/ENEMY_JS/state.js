export const states = {
  STANDING_LEFT: 0,
  STANDING_RIGHT: 1,
  RELOADING_LEFT: 2,
  RELOADING_RIGHT: 3,
  RUNNING_LEFT: 4,
  RUNNING_RIGHT: 5,
  JUMPING_LEFT: 6,
  JUMPING_RIGHT: 7,
};

class State {
  constructor(state) {
    this.state = state;
  }
}
export class StandingLeft extends State {
  constructor(player) {
    super("STANDING LEFT");
    this.player = player;
  }
  enter() {
    this.player.frameY = 0;
    this.player.flip = true;
    this.player.speed = 0;
    this.player.maxFrames = 6
  }
  handleInput(input) {
    if (input === "PRESS right") this.player.setState(states.RUNNING_RIGHT);
    else if (input === "PRESS left") this.player.setState(states.RUNNING_LEFT);
    else if (input === "PRESS down") this.player.setState(states.RELOADING_LEFT);
    else if (input === "PRESS up") this.player.setState(states.JUMPING_LEFT);
  }
}

export class StandingRight extends State {
  constructor(player) {
    super("STANDING RIGHT");
    this.player = player;
  }
  enter() {
    this.player.flip = false;
    this.player.frameY = 0;
    this.player.speed = 0;
    this.player.maxFrames = 6
  }
  handleInput(input) {
    if (input === "PRESS left") this.player.setState(states.RUNNING_LEFT);
    else if (input === "PRESS right")
      this.player.setState(states.RUNNING_RIGHT);
    else if (input === "PRESS down") this.player.setState(states.RELOADING_RIGHT);
    else if (input === "PRESS up") this.player.setState(states.JUMPING_RIGHT);
  }
}

export class ReloadingLeft extends State {
  constructor(player) {
    super("RELOADING");
    this.player = player;
  }
  enter() {
    this.player.flip = true;
    this.player.frameY = 3;
    this.player.speed = 0;
    this.player.maxFrames = 12;
  }
  handleInput(input) {
    if (input === "PRESS right")
      //set state to RELOADINGLeft
      this.player.setState(states.RELOADING_RIGHT);
    else if (input === "PRESS up") this.player.setState(states.STANDING_LEFT);
    else if (input === "RELEASE down")
      this.player.setState(states.STANDING_LEFT);
  }
}
export class ReloadingRight extends State {
  constructor(player) {
    super("RELOADING RIGHT");
    this.player = player;
  }
  enter() {
    this.player.flip = false;
    this.player.frameY = 3;
    this.player.maxFrames = 12;
    this.player.speed = 0;
  }
  handleInput(input) {
    if (input === "PRESS left")
      //set state to RELOADINGLeft
      this.player.setState(states.RELOADING_LEFT);
    else if (input === "PRESS up") this.player.setState(states.STANDING_RIGHT);
    else if (input === "RELEASE down")
      this.player.setState(states.STANDING_RIGHT);
  }
}
//////////////////////////
export class RunningLeft extends State {
  constructor(player) {
    super("RUNNING LEFT");
    this.player = player;
  }
  enter() {
    this.player.frameY = 2;
    this.player.flip = true;
    this.player.speed = -this.player.maxSpeed;
    this.player.maxFrames = 7;
  }
  handleInput(input) {
    if (input === "PRESS right") this.player.setState(states.RUNNING_RIGHT);
    else if (input === "RELEASE left")
      this.player.setState(states.STANDING_LEFT);
    else if (input === "PRESS down") this.player.setState(states.RELOADING_LEFT);
    else if (input === "PRESS up") this.player.setState(states.JUMPING_LEFT);
  }
}

export class RunningRight extends State {
  constructor(player) {
    super("RUNNING RIGHT");
    this.player = player;
  }
  enter() {
    this.player.flip = false;
    this.player.frameY = 2;
    this.player.speed = this.player.maxSpeed;
    this.player.maxFrames = 7;
  }
  handleInput(input) {
    if (input === "PRESS left") this.player.setState(states.RUNNING_LEFT);
    else if (input === "RELEASE right")
      this.player.setState(states.STANDING_RIGHT);
    else if (input === "PRESS down") this.player.setState(states.RELOADING_RIGHT);
    else if (input === "PRESS up") this.player.setState(states.JUMPING_RIGHT);
  }
}

//////////////////////////
export class JumpingLeft extends State {
  constructor(player) {
    super("JUMPING LEFT");
    this.player = player;
  }
  enter() {
    this.player.flip = true;
    if (this.player.onGround()) this.player.vy -= 10;
    this.player.speed = -this.player.maxSpeed * 0.5;
  }
  handleInput(input) {
    if (input === "PRESS right") this.player.setState(states.JUMPING_RIGHT);
    else if (this.player.onGround()) this.player.setState(states.STANDING_LEFT);
  }
}

export class JumpingRight extends State {
  constructor(player) {
    super("JUMPING RIGHT");
    this.player = player;
  }
  enter() {
    this.player.flip = false;
    if (this.player.onGround()) this.player.vy -= 10;
    this.player.speed = this.player.maxSpeed * 0.5;
  }
  handleInput(input) {
    if (input === "PRESS left") this.player.setState(states.JUMPING_LEFT);
    else if (this.player.onGround())
      this.player.setState(states.STANDING_RIGHT);
  }
}
