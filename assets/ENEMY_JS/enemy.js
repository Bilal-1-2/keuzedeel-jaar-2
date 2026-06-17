export const enemyStates = {
  IDLE: 0,
  WALK: 1,
  TURN: 2,
  ANTICIPATION: 3,
  CHARGE: 4,
  IMPACT: 5,
  GET_HIT: 6,
  DEATH: 7,
};

class EnemyState {
  constructor(state, enemy) {
    this.state = state;
    this.enemy = enemy;
  }

  enter() {}

  handleInput() {}
}

class EnemyIdle extends EnemyState {
  constructor(enemy) {
    super(enemyStates.IDLE, enemy);
  }

  enter() {
    this.enemy.speedX = 0;
    this.enemy.frameX = 0;
    this.enemy.frameY = 0;
    this.enemy.maxFrame = 7;
  }

  handleInput() {
    const target = this.enemy.targetPlayer;
    if (!target) return;

    const dx = target.x - this.enemy.x;

    // If player is within 500px, start walking toward him.
    // if (Math.abs(dx) <= 500) {
    //   this.enemy.direction = dx >= 0 ? 1 : -1;
    //   this.enemy.setState(enemyStates.WALK);
    // }
  }
}

class EnemyWalking extends EnemyState {
  constructor(enemy) {
    super(enemyStates.WALK, enemy);
  }

  enter() {
    // Basic walk.
    this.enemy.speedX = this.enemy.direction * this.enemy.baseSpeedX;
    this.enemy.frameX = 0;
    this.enemy.frameY = 1;
    this.enemy.maxFrame = 7;
  }

  handleInput() {
    const target = this.enemy.targetPlayer;

    if (!target) return;
  }
}

class EnemyTurn extends EnemyState {
  constructor(enemy) {
    super(enemyStates.TURN, enemy);
  }

  enter() {
    this.enemy.speedX = 0;
    this.enemy.frameX = 0;
    this.enemy.frameY = 2;
    this.enemy.maxFrame = 10;
  }
  handleInput() {
    const target = this.enemy.targetPlayer;
    if (!target) return;
  }
}

class EnemyAnticipation extends EnemyState {
  constructor(enemy) {
    super(enemyStates.ANTICIPATION, enemy);
  }

  enter() {
    this.enemy.speedX = 0;
    this.enemy.frameX = 0;
    this.enemy.frameY = 3;
    this.enemy.maxFrame = 7;
    // TODO: set correct maxFrame/fps/row for ANTICIPATION.
  }
  handleInput() {
    const target = this.enemy.targetPlayer;
    if (this.enemy.frameX >= this.enemy.maxFrame) {
      this.enemy.setState(enemyStates.CHARGE);
    }
    if (!target) return;
  }
}

class EnemyCharge extends EnemyState {
  constructor(enemy) {
    super(enemyStates.CHARGE, enemy);
  }

  enter() {
    this.enemy.speedX = this.enemy.direction * this.enemy.baseSpeedX;
    this.enemy.frameX = 0;
    this.enemy.frameY = 4;
    this.enemy.maxFrame = 6;
   
  }
  handleInput() {
    const target = this.enemy.targetPlayer;
     if (this.enemy.x === this.targetPlayer.x) {
      this.setState(enemyStates.IMPACT);
    }
    if (!target) return;
  }
}

class EnemyImpact extends EnemyState {
  constructor(enemy) {
    super(enemyStates.IMPACT, enemy);
  }

  enter() {
    this.enemy.speedX = 0;
    this.enemy.frameX = 0;
    this.enemy.frameY = 5;
    this.enemy.maxFrame = 5;
    // TODO: set correct maxFrame/fps/row for IMPACT.
  }
  handleInput() {
    const target = this.enemy.targetPlayer;
    if (!target) return;
  }
}

class EnemyGetHit extends EnemyState {
  constructor(enemy) {
    super(enemyStates.GET_HIT, enemy);
  }

  enter() {
    this.enemy.speedX = 0;
    this.enemy.frameX = 0;
    this.enemy.frameY = 6;
    this.enemy.maxFrame = 5;
    // TODO: set correct maxFrame/fps/row for GET_HIT.
  }
  handleInput() {
    const target = this.enemy.targetPlayer;
    if (!target) return;
  }
}

class EnemyDead extends EnemyState {
  constructor(enemy) {
    super(enemyStates.DEAD, enemy);
  }

  enter() {
    this.enemy.speedX = 0;
    this.enemy.isDead = true;
    this.enemy.isAlive = false;
    // If you have a dedicated death row/frame, update these.
    this.enemy.frameX = 0;
    this.enemy.frameY = 7;
    this.enemy.maxFrame = 15;
  }

  handleInput() {
    // Dead is final.
    this.enemy.speedX = 0;
  }
  handleInput() {
    const target = this.enemy.targetPlayer;
    if (!target) return;
  }
}

export class Enemy {
  constructor() {
    this.frameX = 0;
    this.frameY = 0;

    // sprite animation
    // Enemyd animation fps (independent from the player)
    this.fps = 5;
    this.frameTimer = 0;
    this.frameInterval = 1000 / this.fps;

    // movement/position
    this.x = 0;
    this.y = 0;
    this.speedX = 0;

    // hitbox / rendering defaults (override in subclasses)
    this.width = 0;
    this.height = 0;

    // animation frames
    this.maxFrame = 0;

    // stats
    this.health = 1;
    this.isDead = false;
    this.isAlive = true;

    this.direction = 1; // 1 => right, -1 => left
    this.baseSpeedX = 0;

    // optional death frame overrides
    this.deathFrameX = 0;
    this.deathFrameY = 0;

    // state machine
    this.states = [];
    this.currentState = null;
    this.previousState = null;
    this.targetPlayer = null;
    this.aggroRangeFront = 300;
    this.aggroRangeBack = 100;
  }

  setState(stateEnum) {
    this.previousState = this.currentState?.state;
    this.currentState = this.states[stateEnum];
    this.currentState.enter();
  }

  checkPlayerDistance() {
    if (!this.targetPlayer || this.isDead) return;

    const dx = this.targetPlayer.x - this.x;

    // Is the player in front of, or behind, the direction the enemy is facing?
    // this.direction is 1 (facing right) or -1 (facing left)
    const isInFront =
      (dx > 0 && this.direction === 1) || (dx < 0 && this.direction === -1);

    const distance = Math.abs(dx);
    const range = isInFront ? this.aggroRangeFront : this.aggroRangeBack;

    if (distance <= range) {
      // Player detected - face them and walk over
      this.direction = dx > 0 ? 1 : -1;
      if (
        this.currentState?.state == enemyStates.IDLE
      ) {
        this.setState(enemyStates.ANTICIPATION);
      }
    } else if (this.currentState?.state !== enemyStates.IDLE) {
      this.setState(enemyStates.IDLE);
    }
  }

  update(deltaTime) {
    if (!this.currentState) return;

    // Let current state decide transitions (distance checks etc.).
    // Some states may use targetPlayer/x in their logic.
    this.checkPlayerDistance();
    this.currentState.handleInput();

    this.x += this.speedX;

    // simple frame advance if maxFrame is set
    if (this.frameTimer > this.frameInterval) {
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = 0;
      this.frameTimer = 0;
    } else {
      this.frameTimer += deltaTime;
    }
  }

  draw(ctx, deltaTime) {
    // Advance animation timer
    if (this.frameTimer > this.frameInterval) {
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = 0;
      this.frameTimer = 0;
    } else {
      this.frameTimer += deltaTime;
    }

    if (!ctx || !this.image) return;

    // Basic sprite sheet draw (assumes row-based frames)
    // Mirror like Player.js does when facing left.
    const shouldFlip = this.direction < 0;

    if (shouldFlip) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(
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
      ctx.restore();
    } else {
      ctx.drawImage(
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
}

export class icebull extends Enemy {
  constructor() {
    super();

    // Render sprite size (full frame)
    this.width = 162.4;
    this.height = 106;

    this.x = 1000;
    this.y = 0;

    this.maxFrame = 5;

    // movement tuning
    this.direction = -1;
    this.baseSpeedX = 4;

    this.image = document.getElementById("icebull");

    // enemy stats
    this.health = 3;

    // set up enemy states
    this.states = [
      new EnemyIdle(this), // IDLE
      new EnemyWalking(this), // WALK
      new EnemyTurn(this), // TURN
      new EnemyAnticipation(this), // ANTICIPATION
      new EnemyCharge(this), // CHARGE
      new EnemyImpact(this), // IMPACT
      new EnemyGetHit(this), // GET_HIT
      new EnemyDead(this), // DEATH
    ];

    this.setState(enemyStates.IDLE);
  }

  // optional: external damage hook
  takeDamage(amount = 1) {
    if (this.isDead) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.setState(enemyStates.DEAD);
    }
  }
}
