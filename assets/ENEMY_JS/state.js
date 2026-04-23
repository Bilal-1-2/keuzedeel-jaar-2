export const states = {
  STANDING: 0,
  RELOADING: 1,
  RUNNING: 2,
  JUMPING: 3,
  WALKING: 4,
  THROWINGGRENADE: 5,
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
    this.player.frameY = 0;
    this.player.speed = 0;
    this.player.maxFrames = 6;
  }

  handleInput(input) {
    if (input.lastKey === "PRESS right") {
      this.player.flip = false;
      this.player.setState(states.RUNNING);
    } else if (input.lastKey === "PRESS left") {
      this.player.flip = true;
      this.player.setState(states.RUNNING);
    } else if (input.lastKey === "PRESS reload") {
      this.player.setState(states.RELOADING);
    } else if (input.lastKey === "PRESS G") {
      this.player.frameX = 0;
      this.player.setState(states.THROWINGGRENADE);
    } else if (input.lastKey === "PRESS up" && this.player.onGround()) {
      this.player.previousState = states.STANDING;
      this.player.setState(states.JUMPING);
    }
    // Held state transition
    if (input.keys.right || input.keys.left) {
      this.player.setState(states.RUNNING);
    } else if (input.keys.down) {
      this.player.setState(states.RELOADING);
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
    this.player.speed = 0;

    if (this.player)
      if (input.keys.right) {
        this.player.flip = false;
        this.player.speed = 2;
      } else if (input.keys.left) {
        this.player.flip = true;
        this.player.speed = -2;
      }
      else if (input.lastKey === "PRESS up") {
      this.player.setState(states.STANDING);
    } else if (
      input.lastKey === "RELEASE reload" &&
      this.player.frameX >= this.player.maxFrames
    ) {
      this.player.frameX = 1;
      this.player.setState(states.STANDING);
    } else if (input.lastKey === "PRESS up" && this.player.onGround()) {
      this.player.previousState = states.RELOADING;
      this.player.setState(states.JUMPING);
    }
  }
}

export class Running extends State {
  constructor(player) {
    super("RUNNING");
    this.player = player;
  }

  enter() {
    this.player.frameY = 2;
    this.player.maxFrames = 7;
    this.player.speed = this.player.flip
      ? -this.player.maxSpeed
      : this.player.maxSpeed;
  }

  handleInput(input) {
    if (input.lastKey === "PRESS reload") {
      this.player.setState(states.RELOADING);
    } else if (input.lastKey === "PRESS up" && this.player.onGround()) {
      this.player.previousState = states.RUNNING;
      this.player.setState(states.JUMPING);
    } else if (input.lastKey === "PRESS G") {
      this.player.speed = 0;
      this.player.frameX = 0;
      this.player.setState(states.THROWINGGRENADE);
    }
    if (input.toggles.walkMode) {
      this.player.setState(states.WALKING);
      return;
    }
    // Held logic
    if (this.player)
      if (input.keys.right) {
        this.player.flip = false;
        this.player.speed = this.player.maxSpeed;
      } else if (input.keys.left) {
        this.player.flip = true;
        this.player.speed = -this.player.maxSpeed;
      } else if (input.keys.down) {
        this.player.setState(states.RELOADING);
      } else {
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
    // this.player.frameY = 1;
    if (this.player.onGround()) {
      this.player.vy = -10;
    }
  }

  handleInput(input) {
    // Air control every frame
    if (input.keys.right) {
      this.player.flip = false;
      this.player.speed = Math.min(
        this.player.speed + 0.5,
        this.player.maxSpeed,
      );
    } else if (input.keys.left) {
      this.player.flip = true;
      this.player.speed = Math.max(
        this.player.speed - 0.5,
        -this.player.maxSpeed,
      );
    } else {
      // Friction in air
      this.player.speed *= 0.9;
    }

    // Landing
    if (this.player.onGround()) {
      if (input.keys.right || input.keys.left) {
        this.player.setState(states.RUNNING);
      } else if (input.keys.down) {
        this.player.setState(states.RELOADING);
      } else {
        this.player.setState(this.player.previousState || states.STANDING);
      }
    }
  }
}
export class Walking extends State {
  constructor(player) {
    super("WALKING");
    this.player = player;
  }

  enter() {
    this.player.frameY = 1;
    this.player.maxFrames = 6;
    this.player.speed = this.player.flip
      ? -this.player.maxSpeed * 0.5
      : this.player.maxSpeed * 0.5;
  }

  handleInput(input) {
    if (input.lastKey === "PRESS reload") {
      this.player.setState(states.RELOADING);
      return;
    } else if (input.lastKey === "PRESS up" && this.player.onGround()) {
      this.player.previousState = states.WALKING;
      this.player.setState(states.JUMPING);
    } else if (input.lastKey === "PRESS G") {
      this.player.speed = 0;
      this.player.frameX = 0;
      this.player.setState(states.THROWINGGRENADE);
    }
    // Toggle between RUNNING and WALKING with Ctrl
    if (!input.toggles.walkMode) {
      this.player.setState(states.RUNNING);
      return;
    }
    if (input.keys.right) {
      this.player.flip = false;
      this.player.speed = this.player.maxSpeed * 0.5;
    } else if (input.keys.left) {
      this.player.flip = true;
      this.player.speed = -this.player.maxSpeed * 0.5;
    } else if (input.keys.down) {
      this.player.setState(states.RELOADING);
      return;
    } else {
      // No movement keys pressed -> stop
      this.player.setState(states.STANDING);
      return;
    }
  }
}
export class ThrowingGrenade extends State {
  constructor(player) {
    super("THROWING GRANADE");
    this.player = player;
  }

  enter() {
    this.player.frameY = 4;
    this.player.maxFrames = 8;
    this.player.speed = 2;
  }

  handleInput(input) {
    this.player.speed = 0;

    if (this.player)
      if (input.keys.right) {
        this.player.flip = false;
        this.player.speed = 2;
      } else if (input.keys.left) {
        this.player.flip = true;
        this.player.speed = -2;
      }
    if (
      input.lastKey === "RELEASE G" &&
      this.player.frameX >= this.player.maxFrames
    ) {
      this.player.frameX = 1;
      this.player.setState(this.player.previousState || states.STANDING);
    } else if (input.lastKey === "PRESS up" && this.player.onGround()) {
      this.player.previousState = states.RELOADING;
      this.player.setState(states.JUMPING);
      if (input.keys.right || input.keys.left) {
        this.player.setState(states.RUNNING);
      } else if (input.keys.down) {
        this.player.setState(states.RELOADING);
      } else {
        this.player.setState(this.player.previousState || states.STANDING);
      }
    }
  }
}
