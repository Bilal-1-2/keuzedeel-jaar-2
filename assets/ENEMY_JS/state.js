import { SoundManager } from "./sounds.js";

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
  GETHIT: 9,
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
    this.player.playerwidth = 22;
    this.player.playerheight = 67;
  }

  handleInput(input) {
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
    } else if (input.lastKey === "PRESS reload" && this.player.magazine < 30) {
      this.player.setState(states.RELOADING);
    } else if (input.lastKey === "PRESS G" && this.player.grenades > 0) {
      this.player.frameX = 0;
      this.player.setState(states.THROWINGGRENADE);
    } else if (input.lastKey === "PRESS CLICK") {
      this.player.previousState = states.STANDING;
      this.player.setState(states.SHOOTING);
    }
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
    this.player.playerwidth = 22;
    this.player.playerheight = 67;
    SoundManager.play("reload");
  }

  handleInput(input) {
    if (this.player.magazine >= 30) {
      this.player.magazine = 30;
      this.player.speed = 0;
      this.player.frameX = 1;

      if (input.keys.right || input.keys.left) {
        this.player.setState(states.RUNNING);
      } else if (input.keys.down) {
        this.player.setState(states.RELOADING);
      } else {
        this.player.setState(states.STANDING);
      }
      return;
    } else {
      this.player.speed = 0;

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
      } else if (input.lastKey === "PRESS E") {
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
    this.player.playerwidth = 32;
    this.player.playerheight = 60;
  }

  handleInput(input) {
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
    } else if (input.lastKey === "PRESS G" && this.player.grenades > 0) {
      this.player.speed = 0;
      this.player.frameX = 0;
      this.player.setState(states.THROWINGGRENADE);
      return;
    } else if (input.lastKey === "PRESS E") {
      this.player.previousState = states.RUNNING;
      this.player.setState(states.MELEE);
      return;
    }

    if (input.toggles.walkMode) {
      this.player.setState(states.WALKING);
      return;
    }

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
      this.player.vy = -10.3;
      SoundManager.play("jump");
    }
  }

  handleInput(input) {
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
    this.player.playerwidth = 22;
    this.player.playerheight = 67;
  }

  handleInput(input) {
    if (this.player.health <= 0 && this.player.previousState !== states.DEAD) {
      this.player.setState(states.DEAD);
      console.log("Dead anim: 6");
    }

    if (input.lastKey === "PRESS reload" && this.player.magazine < 30) {
      this.player.setState(states.RELOADING);
      return;
    } else if (input.lastKey === "PRESS G" && this.player.grenades > 0) {
      this.player.speed = 0;
      this.player.frameX = 0;
      this.player.setState(states.THROWINGGRENADE);
      return;
    } else if (input.lastKey === "PRESS CLICK") {
      this.player.speed = 0;
      this.player.previousState = states.WALKING;
      this.player.setState(states.SHOOTING);
      return;
    } else if (input.lastKey === "PRESS up" && this.player.onGround()) {
      this.player.previousState = states.WALKING;
      this.player.setState(states.JUMPING);
      return;
    } else if (input.lastKey === "PRESS E") {
      this.player.previousState = states.WALKING;
      this.player.setState(states.MELEE);
      return;
    }

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
    if (input.keys.right) {
      this.player.flip = false;
      this.player.speed = 2;
    } else if (input.keys.left) {
      this.player.flip = true;
      this.player.speed = -2;
    } else {
      this.player.speed = 0;
    }

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
      this.player.grenades = this.player.grenades - 1;
      SoundManager.play("grenade_throw");
    }

    if (this.player.health <= 0 && this.player.previousState !== states.DEAD) {
      this.player.setState(states.DEAD);
      console.log("Dead anim: 7");
    }

    if (input.lastKey === "PRESS up" && this.player.onGround()) {
      this.player.previousState = states.STANDING;
      this.player.setState(states.JUMPING);
      return;
    }

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
    this.player.playerwidth = 24;
    this.player.playerheight = 67;
  }

  handleInput(input) {
    this.player.speed = 0;

    if (this.player.health <= 0 && this.player.previousState !== states.DEAD) {
      this.player.setState(states.DEAD);
      console.log("Dead anim: 8");
    }

    if (input.keys.right) {
      this.player.flip = false;
      this.player.speed = 1;
    } else if (input.keys.left) {
      this.player.flip = true;
      this.player.speed = -1;
    }

    if (
      this.player.spawnBullet &&
      !this.player.hasShot &&
      this.player.frameX === 2
    ) {
      this.player.spawnBullet(
        this.player.x + (this.player.flip ? 35 : 90),
        this.player.y + 76,
        !this.player.flip,
      );
      this.player.hasShot = true;
      this.player.magazine = this.player.magazine - 1;
      SoundManager.play("shoot");
    }

    if (input.keys.click === false) {
      this.player.setState(this.player.previousState || states.STANDING);
      return;
    }

    if (this.player.magazine <= 0) {
      if (this.player.magazine < 30) {
        this.player.setState(states.RELOADING);
      }
    }

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
    // Slow down melee animation only.
    this.player.frameX = 0;
    this.player.frameY = 8;
    this.player.maxFrames = 2;
    this.player.playerwidth = 32;
    this.player.playerheight = 67;

    // Reset hit-tracking for this swing. The damaging frame is set
    // below in handleInput() once frameX reaches the "strike" frame.
    this.player._meleeHitActive = false;
    this.player._meleeHitApplied = false;
    SoundManager.play("melee");
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

    // Activate the damage hitbox on the swing's "strike" frame.
    // With maxFrames = 2, frame 1 is the midpoint of the swing - the
    // moment the weapon would actually connect.
    if (this.player.frameX === 1) {
      this.player._meleeHitActive = true;
    } else {
      this.player._meleeHitActive = false;
    }

    if (this.player.frameX >= this.player.maxFrames) {
      this.player._meleeHitActive = false;
      if (input.keys.click === true) {
        this.player.setState(states.SHOOTING);
      } else {
        this.player.setState(this.player.previousState || states.STANDING);
        return;
      }
    }
  }
}

export class Gethit extends State {
  constructor(player) {
    super("GETHIT");
    this.player = player;
    this._returnState = states.STANDING;
  }

  enter() {
    this.player.frameX = 0;
    this.player.frameY = 9;
    this.player.maxFrames = 2;
    this.player.speed = 0;
    this.player.vy = 0;
    SoundManager.play("player_hit");
  }

  handleInput(input) {
    this.player.speed = 0;
    this.player.vy = 0;

    if (this.player.health <= 0) {
      this.player.setState(states.DEAD);
      return;
    }

    if (this.player.frameX >= this.player.maxFrames) {

      const returnTo = this.player.previousState;
      const safeReturn =
        typeof returnTo === "number" &&
        returnTo !== states.DEAD &&
        returnTo !== states.GETHIT
          ? returnTo
          : states.STANDING;
      this.player.setState(safeReturn);
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
    SoundManager.play("player_death");

    // Let the death animation actually play before kicking the player
    // back to the level-select menu. ~1.2s is generous for a few
    // frames at this state's animation speed; tweak if your death
    // sprite is longer/shorter.
    const returnDelayMs = 1200;
    setTimeout(() => {
      if (typeof window.returnToMenu === "function") {
        window.returnToMenu();
      } else {
        console.warn(
          "[state.js] window.returnToMenu is not defined - is script.js loaded?",
        );
      }
    }, returnDelayMs);
  }

  handleInput(input) {
    this.player.speed = 0;
    this.player.vy = 0;
    return;
  }
}
