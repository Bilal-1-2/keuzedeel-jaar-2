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
    // TODO: set correct frame row/length for the sprite sheet.
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
    // TODO: increase speed for CHARGE if needed.
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
    this.enemy.frameX = this.enemy.deathFrameX ?? 0;
    this.enemy.frameY = this.enemy.deathFrameY ?? 0;
    this.enemy.maxFrame = 15;
  }

  handleInput() {
    // Dead is final.
    this.enemy.speedX = 0;
  }
}

export class Enemy {
  constructor() {
    this.frameX = 0;
    this.frameY = 0;

    // sprite animation
    this.fps = 20;
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
  }

  setState(stateEnum) {
    this.previousState = this.currentState?.state;
    this.currentState = this.states[stateEnum];
    this.currentState.enter();
  }

  update(deltaTime) {
    if (!this.currentState) return;

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

  draw() {}
}

export class icebull extends Enemy {
  constructor() {
    super();

    // Render sprite size (full frame)
    this.width = 162;
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
      new EnemyRunning(this), // WALK
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
