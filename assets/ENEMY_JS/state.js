export const states = {
  STANDING: 0,
  RELOADING: 1,
  RUNNING: 2,
  JUMPING: 3,
  WALKING: 4,
  THROWINGGRENADE: 5,
  SHOOTING: 6,
  MELEE: 7,
  DEAD: 8,
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
    // PRESS events (one-time)
    if (this.player.health <= 0 && this.player.previousState !== states.DEAD) {
      console.log("Dead anim: 2");
      this.player.setState(states.DEAD);
    }

    if (input.lastKey === "PRESS up" && this.player.onGround()) {
      this.player.previousState = states.STANDING;
      this.player.setState(states.JUMPING);
    } else if (input.lastKey === "PRESS E") {
      this.player.previousState = states.STANDING;
      this.player.setState(states.MELEE);
    }

    // else if (input.lastKey === "PRESS right") {
    //   this.player.flip = false;
    //   this.player.setState(states.WALKING);
    // } else if (input.lastKey === "PRESS left") {
    //   this.player.flip = true;
    //   this.player.setState(states.WALKING);
    // }
    else if (input.lastKey === "PRESS reload" && this.player.magazine < 30) {
      this.player.setState(states.RELOADING);
    } else if (input.lastKey === "PRESS G") {
      this.player.frameX = 0;
      this.player.setState(states.THROWINGGRENADE);
    } else if (input.lastKey === "PRESS CLICK") {
      this.player.previousState = states.STANDING;
      this.player.setState(states.SHOOTING);
    }
    // HELD state transitions (every frame)
    if (input.keys.right || input.keys.left) {
      this.player.setState(states.WALKING);
    } else if (input.keys.down) {
      if (this.player.magazine < 30) {
        this.player.setState(states.RELOADING);
      }
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
    if (this.player.magazine >= 30) {
      this.player.magazine = 30;
      // stop reload state immediately
      this.player.speed = 0;
      this.player.frameX = 1;
      this.player.setState(this.player.previousState || states.STANDING);
      return;
    } else {
      this.player.speed = 0;
      // Animation complete

      // Movement during reload

      if (input.keys.right) {
        this.player.flip = false;
        this.player.speed = 2;
      } else if (input.keys.left) {
        this.player.flip = true;
        this.player.speed = -2;
      }
      if (
        this.player.health <= 0 &&
        this.player.previousState !== states.DEAD
      ) {
        console.log("Dead anim: 3");
        this.player.setState(states.DEAD);
      }

      if (input.lastKey === "PRESS up" && this.player.onGround()) {

        this.player.setState(states.JUMPING);
      }
      // else if (
      //   input.keys.click === true &&
      //   this.player.frameX >= this.player.maxFrames
      // ) {
      //   this.player.previousState = states.STANDING;
      //   this.player.setState(states.SHOOTING);
      // }
      else if (input.lastKey === "PRESS E") {
        this.player.setState(states.MELEE);
      }
      if (this.player.frameX >= this.player.maxFrames) {
        this.player.magazine = 30;
        this.player.frameX = 1;
        if (input.keys.click === true) {
          this.player.setState(states.SHOOTING);
        } else {
          this.player.setState(this.player.previousState || states.STANDING);
        }
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
    this.player.frameX = 1;
    this.player.frameY = 2;
    this.player.maxFrames = 7;
    this.player.speed = this.player.flip
      ? -this.player.maxSpeed
      : this.player.maxSpeed;
  }

  handleInput(input) {
    // PRESS events - check these FIRST
    if (this.player.health <= 0 && this.player.previousState !== states.DEAD) {
      this.player.setState(states.DEAD);
      console.log("Dead anim: 4");
    }

    if (input.lastKey === "PRESS reload" && !this.player.magazine >= 30) {
      this.player.setState(states.RELOADING);
      return;
    } else if (input.lastKey === "PRESS CLICK") {
      this.player.speed = 0;
      this.player.previousState = states.RUNNING;
      this.player.setState(states.SHOOTING);
      return;
    } else if (input.lastKey === "PRESS up" && this.player.onGround()) {
      this.player.previousState = states.RUNNING;
      this.player.setState(states.JUMPING);
      return;
    } else if (input.lastKey === "PRESS G") {
      this.player.speed = 0;
      this.player.frameX = 0;
      this.player.setState(states.THROWINGGRENADE);
      return;
    } else if (input.lastKey === "PRESS E") {
      this.player.setState(states.MELEE);
    }

    // Walk mode toggle
    if (input.toggles.walkMode) {
      this.player.setState(states.WALKING);
      return;
    }

    // HELD logic (only if no PRESS action was taken)
    if (input.keys.right) {
      this.player.flip = false;
      this.player.speed = this.player.maxSpeed;
    } else if (input.keys.left) {
      this.player.flip = true;
      this.player.speed = -this.player.maxSpeed;
    } else if (input.keys.down) {
      if (this.player.magazine < 30) {
        this.player.setState(states.RELOADING);
      }
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
    if (this.player.onGround()) {
      this.player.vy = -10;
    }
  }

  handleInput(input) {
    // Air control
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
      this.player.speed *= 0.9;
    }

    // Landing
    if (this.player.health <= 0 && this.player.previousState !== states.DEAD) {
      this.player.setState(states.DEAD);
      console.log("Dead anim: 5");
    }

    if (this.player.onGround()) {
      if (input.keys.right || input.keys.left) {
        this.player.setState(states.RUNNING);
      } else if (input.lastKey === "PRESS CLICK") {
        this.player.previousState = states.STANDING;
        this.player.setState(states.SHOOTING);
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
    this.player.frameX = 1;
    this.player.frameY = 1;
    this.player.maxFrames = 6;
    this.player.speed = this.player.flip
      ? -this.player.maxSpeed * 0.5
      : this.player.maxSpeed * 0.5;
  }

  handleInput(input) {
    // PRESS events - check these FIRST
    if (this.player.health <= 0 && this.player.previousState !== states.DEAD) {
      this.player.setState(states.DEAD);
      console.log("Dead anim: 6");
    }

    if (input.lastKey === "PRESS reload" && this.player.magazine < 30) {
      this.player.setState(states.RELOADING);
      return;
    } else if (input.lastKey === "PRESS G") {
      this.player.speed = 0;
      this.player.frameX = 0;
      this.player.setState(states.THROWINGGRENADE);
      return; // Stop here, don't process movement
    } else if (input.lastKey === "PRESS CLICK") {
      this.player.speed = 0;
      this.player.previousState = states.WALKING;
      this.player.setState(states.SHOOTING);
      return; // Stop here, don't process movement
    } else if (input.lastKey === "PRESS up" && this.player.onGround()) {
      this.player.previousState = states.WALKING;
      this.player.setState(states.JUMPING);
      return;
    }

    // Toggle between RUNNING and WALKING
    if (!input.toggles.walkMode) {
      this.player.setState(states.RUNNING);
      return;
    }

    // HELD logic (only if no PRESS action was taken)
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
    this.player.frameX = 1;
    this.player.hasThrown = false;
    this.player.frameY = 4;
    this.player.maxFrames = 8;
    this.player.speed = 0;
  }

  handleInput(input) {
    // Movement during throw - ALLOW movement without breaking animation
    if (input.keys.right) {
      this.player.flip = false;
      this.player.speed = 2;
    } else if (input.keys.left) {
      this.player.flip = true;
      this.player.speed = -2;
    } else {
      this.player.speed = 0;
    }

    // Spawn grenade at correct frame
    if (
      this.player.spawnGrenade &&
      !this.player.hasThrown &&
      this.player.frameX === 7
    ) {
      this.player.spawnGrenade(
        this.player.x + (this.player.flip ? -20 : 20),
        this.player.y - 80,
        !this.player.flip,
      );
      this.player.hasThrown = true;
    }

    // ONLY jump can break/cancel the throw animation
    if (this.player.health <= 0 && this.player.previousState !== states.DEAD) {
      this.player.setState(states.DEAD);
      console.log("Dead anim: 7");
    }

    if (input.lastKey === "PRESS up" && this.player.onGround()) {
      this.player.previousState = states.STANDING;
      this.player.setState(states.JUMPING);
      return;
    }

    // Animation complete - exit normally
    if (this.player.frameX >= this.player.maxFrames) {
      this.player.frameX = 1;
      this.player.setState(this.player.previousState || states.STANDING);
    }
  }
}

export class Shooting extends State {
  constructor(player) {
    super("SHOOTING");
    this.player = player;
  }

  enter() {
    this.player.hasShot = false;
    this.player.frameX = 0;
    this.player.frameY = 7;
    this.player.maxFrames = 3;
  }

  handleInput(input) {
    this.player.speed = 0;

    if (this.player.health <= 0 && this.player.previousState !== states.DEAD) {
      this.player.setState(states.DEAD);
      console.log("Dead anim: 8");
    }

    // Movement during shooting
    if (input.keys.right) {
      this.player.flip = false;
      this.player.speed = 1;
    } else if (input.keys.left) {
      this.player.flip = true;
      this.player.speed = -1;
    }

    // Spawn bullet at correct frame
    if (
      this.player.spawnBullet &&
      !this.player.hasShot &&
      this.player.frameX === 3
    ) {
      this.player.spawnBullet(
        this.player.x + (this.player.flip ? 35 : 90),
        this.player.y + 76,
        !this.player.flip,
      );
      this.player.hasShot = true;
      this.player.magazine = this.player.magazine - 1;
    }

    // Stop shooting when click released
    if (input.keys.click === false) {
      this.player.setState(this.player.previousState || states.STANDING);
      return;
    }

    // Out of ammo
    if (this.player.magazine <= 0) {
      if (this.player.magazine < 30) {
        this.player.setState(states.RELOADING);
      }
    }

    // PRESS events
    if (input.lastKey === "PRESS up" && this.player.onGround()) {
      this.player.setState(states.JUMPING);
      return;
    }

    if (input.lastKey === "PRESS reload" && this.player.magazine < 30) {
      this.player.setState(states.RELOADING);
      return;
    }

    if (input.lastKey === "PRESS E") {
      this.player.setState(states.MELEE);
      return;
    }
  }
}

export class Melee extends State {
  constructor(player) {
    super("MELEE");
    this.player = player;
  }
  enter() {
    this.player.frameX = 0;
    this.player.frameY = 8;
    this.player.maxFrames = 2;
  }
  handleInput(input) {
    this.player.speed = 0;

    if (this.player.health <= 0 && this.player.previousState !== states.DEAD) {
      this.player.setState(states.DEAD);
      console.log("Dead anim: 9");
    }

    // Movement during melee
    if (input.keys.right) {
      this.player.flip = false;
      this.player.speed = 1;
    } else if (input.keys.left) {
      this.player.flip = true;
      this.player.speed = -1;
    }

    if (this.player.frameX >= this.player.maxFrames) {
      if (input.keys.click === true) {
        this.player.setState(states.SHOOTING);
      } else {
        this.player.setState(this.player.previousState || states.STANDING);
        return;
      }
    }
  }
}

export class Dead extends State {
  constructor(player) {
    super("DEAD");
    this.player = player;
    this.deathTimer = 0;

    console.log("dead");
  }

  enter() {
    this.player.previousState = states.DEAD;
    this.player.frameX = 0;
    this.player.frameY = 10;
    this.player.maxFrames = 3;
    this.player.isDead = true;
    this.player.isAlive = false;
    this.player.speed = 0;
    this.player.vy = 0;
    this.deathTimer = 0;
  }

  handleInput(input) {
    // Dead is final - lock movement only.
    this.player.speed = 0;
    this.player.vy = 0;
    return;
  }
}
