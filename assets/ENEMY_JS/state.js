export const states = {
  STANDING: 0,
  RELOADING: 1,
  RUNNING: 2,
  JUMPING: 3,
};

class State {
  constructor(state) {
    this.state = state;
  }
}

export class Standing extends State {
  constructor(player) {
    super("STANDING");
    this.player = player;
  }

  enter() {
    this.player.frameX = 0;
    this.player.frameY = 0;
    this.player.speed = 0;
    this.player.maxFrames = 6;
  }

  handleInput(input) {
    if (input === "PRESS right") {
      this.player.flip = false;
      this.player.setState(states.RUNNING);
    } else if (input === "PRESS left") {
      this.player.flip = true;
      this.player.setState(states.RUNNING);
    } else if (input === "PRESS down") {
      this.player.setState(states.RELOADING);
    } else if (input === "PRESS up" && this.player.onGround()) {
      this.player.previousState = states.STANDING; // Store current state
      this.player.setState(states.JUMPING);
    }
  }
}

export class Reloading extends State {
  constructor(player) {
    super("RELOADING");
    this.player = player;
  }

  enter() {
    this.player.frameX = 0;
    this.player.frameY = 3;
    this.player.speed = 0;
    this.player.maxFrames = 12;
  }

  handleInput(input) {
    if (input === "PRESS up" && this.player.onGround()) {
      this.player.previousState = states.RELOADING; // Store current state
      this.player.setState(states.JUMPING);
    }
    if (this.player.frameX >= this.player.maxFrames) {
      if (this.player.previousState !== undefined) {
        this.player.setState(this.player.previousState);
      } else if (input === "RELEASE right" && !this.player.flip) {
        this.player.setState(states.STANDING);
      } else if (input === "RELEASE left" && this.player.flip) {
        this.player.setState(states.STANDING);
      } else if (input === "RELEASE down") {
        this.player.setState(states.STANDING);
      } else {
        // Fallback to standing if no previous state was stored
        this.player.setState(states.STANDING);
      }
    }
  }
}

export class Running extends State {
  constructor(player) {
    super("RUNNING");
    this.player = player;
  }

  enter() {
    this.player.frameX = 0;
    this.player.frameY = 2;
    this.player.maxFrames = 7;
    this.player.speed = this.player.flip
      ? -this.player.maxSpeed
      : this.player.maxSpeed;
  }

  handleInput(input) {
    if (input === "PRESS right") {
      this.player.flip = false;
      this.player.speed = this.player.maxSpeed;
    } else if (input === "PRESS left") {
      this.player.flip = true;
      this.player.speed = -this.player.maxSpeed;
    } else if (input === "PRESS down") {
      this.player.setState(states.RELOADING);
    } else if (input === "PRESS up" && this.player.onGround()) {
      this.player.previousState = states.RUNNING; // Store current state
      this.player.setState(states.JUMPING);
    } else if (input === "RELEASE right" && !this.player.flip) {
      this.player.setState(states.STANDING);
    } else if (input === "RELEASE left" && this.player.flip) {
      this.player.setState(states.STANDING);
    }
  }
}

export class Jumping extends State {
  constructor(player) {
    super("JUMPING");
    this.player = player;
  }

  enter() {
    this.player.frameX = 0;
    if (this.player.onGround()) {
      this.player.vy = -10;
    }
    // Keep the same speed as before jumping
    // Don't change the speed, just preserve it
  }

  handleInput(input) {
    // Allow air control
    if (input === "PRESS right") {
      this.player.flip = false;
      this.player.setState(states.RUNNING);
    } else if (input === "PRESS left") { 
      this.player.flip = true;
      this.player.setState(states.RUNNING);
    }
    // When landing, go back to previous state (running, standing, or reloading)
    if (this.player.onGround()) {
      // Return to the state we were in before jumping
      if (this.player.previousState !== undefined) {
        this.player.setState(this.player.previousState);
      } else if (input === "RELEASE right" && !this.player.flip) {
        this.player.setState(states.STANDING);
      } else if (input === "RELEASE left" && this.player.flip) {
        this.player.setState(states.STANDING);
      } else if (input === "RELEASE down") {
        this.player.setState(states.STANDING);
      } 
      else if (input === "RELEASE up") {
        this.player.setState(states.STANDING);
      }
      else {
        // Fallback to standing if no previous state was stored
        this.player.setState(states.STANDING);
      }
    }
  }
}
