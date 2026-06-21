export const enemyStates = {
  IDLE: 0,
  WALK: 1,
  TURN: 2,
  ANTICIPATION: 3,
  CHARGE: 4,
  IMPACT: 5,
  GET_HIT: 6,
  DEATH: 7,

  // Ice skeleton specific (independent from generic Enemy WALK)
  ICE_SKELETON_IDLE: 8,
  ICE_SKELETON_WALK: 9,
  ICE_SKELETON_DEATH: 10,
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
    // checkPlayerDistance() (on Enemy) handles all transitions out of IDLE.
  }
}

class EnemyWalking extends EnemyState {
  constructor(enemy) {
    super(enemyStates.WALK, enemy);
  }

  enter() {
    this.enemy.speedX = this.enemy.direction * this.enemy.baseSpeedX;
    this.enemy.frameX = 0;
    this.enemy.frameY = 1;
    this.enemy.maxFrame = 7;
    // pick a random patrol duration before turning around
    this.enemy._walkTimer = 0;
    this.enemy._walkDuration = 2000 + Math.random() * 1250;
  }

  handleInput(deltaTime) {
    // Loop the walk animation.
    if (this.enemy.frameX >= this.enemy.maxFrame) {
      this.enemy.frameX = 0;
    }

    // Patrol: turn around after a while, or at world edges.
    this.enemy._walkTimer += deltaTime ?? this.enemy.frameInterval;
    const hitLeftEdge = this.enemy.x <= 0;
    const hitRightEdge =
      this.enemy.x >= (window.worldWidth ?? Infinity) - this.enemy.width;

    if (
      this.enemy._walkTimer >= this.enemy._walkDuration ||
      hitLeftEdge ||
      hitRightEdge
    ) {
      // Patrol turn: no pendingDirection, EnemyTurn will know to resume WALK.
      this.enemy.pendingDirection = this.enemy.direction * -1;
      this.enemy.resumeState = enemyStates.WALK; // FIX: was ICE_SKELETON_WALK
      this.enemy.setState(enemyStates.TURN);
    }
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
    if (this.enemy.frameX >= this.enemy.maxFrame) {
      // Flip direction only now, once the animation has finished.
      if (this.enemy.pendingDirection !== undefined) {
        this.enemy.direction = this.enemy.pendingDirection;
        this.enemy.pendingDirection = undefined;
      } else {
        this.enemy.direction *= -1;
      }

      // Resume whatever caused the turn: WALK (patrol), ANTICIPATION
      // (freshly spotted the player), or CHARGE (mid-charge correction).
      const resume = this.enemy.resumeState ?? enemyStates.WALK;
      this.enemy.resumeState = undefined;
      this.enemy.setState(resume);
    }
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
    // No extra waiting here; charge immediately when ANTICIPATION ends.
    if (this.enemy.frameX >= this.enemy.maxFrame) {
      this.enemy.setState(enemyStates.CHARGE);
    }
  }
}

class EnemyCharge extends EnemyState {
  constructor(enemy) {
    super(enemyStates.CHARGE, enemy);
  }

  enter() {
    this.enemy.speedX = this.enemy.direction * this.enemy.baseSpeedX * 1.4;
    this.enemy.frameX = 0;
    this.enemy.frameY = 4;
    this.enemy.maxFrame = 6;
    // Reset the "last seen" clock whenever we (re)start a charge.
    this.enemy._lastSeenPlayerAt = performance.now();
  }

  handleInput() {
    const target = this.enemy.targetPlayer;
    if (!target) return;

    const dx = target.x - this.enemy.x;
    const distance = Math.abs(dx);

    // Hit check: real hitbox overlap, not raw x distance.
    const enemyBox = this.enemy.getHitbox();
    const playerBox = target.getHitbox?.();

    if (playerBox && this.enemy.hitboxesOverlap(enemyBox, playerBox)) {
      this.enemy.setState(enemyStates.IMPACT);
      return;
    }

    // While charging, the player is "tracked" as long as they're in
    // front of us and within the front aggro range (used here as the
    // chase leash). If they slip outside that for too long, give up.
    const isInFront =
      (dx > 0 && this.enemy.direction === 1) ||
      (dx < 0 && this.enemy.direction === -1);
    const stillTracked = isInFront && distance <= this.enemy.aggroRangeFront;

    if (stillTracked) {
      this.enemy._lastSeenPlayerAt = performance.now();
    } else {
      const timeSinceLastSeen =
        performance.now() - (this.enemy._lastSeenPlayerAt ?? 0);
      const giveUpDelayMs = this.enemy.loseTrackDelayMs ?? 2000;

      if (timeSinceLastSeen >= giveUpDelayMs) {
        // Lost the player for long enough - give up and go back to patrol.
        this.enemy.setState(enemyStates.WALK);
        return;
      }
    }

    // Player slipped behind/beside us mid-charge - turn to keep following.
    const desiredDirection = dx > 0 ? 1 : -1;
    if (desiredDirection !== this.enemy.direction) {
      this.enemy.pendingDirection = desiredDirection;
      this.enemy.resumeState = enemyStates.CHARGE;
      this.enemy.setState(enemyStates.TURN);
    }
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

    // Apply damage once when IMPACT starts.
    const target = this.enemy.targetPlayer;
    if (
      target &&
      typeof target.health === "number" &&
      target.health > 0 &&
      !target.isInvincible?.()
    ) {
      target.health -= 25;
      if (target.health < 0) target.health = 0;
      target._pendingGetHitAnim = true;

      if (target.health <= 0) {
        console.log("Player should die from enemy impact");
      }
    }
  }

  handleInput() {
    if (this.enemy.frameX >= this.enemy.maxFrame) {
      if (this.enemy._impactToIdleStartMs === undefined) {
        this.enemy._impactToIdleStartMs = performance.now();
        this.enemy.setState(enemyStates.IDLE);
      } else {
        const elapsedMs = performance.now() - this.enemy._impactToIdleStartMs;
        if (elapsedMs >= 2000) {
          this.enemy._impactToIdleStartMs = undefined;
          this.enemy.setState(enemyStates.IDLE);
        }
      }
    }
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
    if (this.enemy.frameX >= this.enemy.maxFrame) {
      const resume = this.enemy.resumeState ?? enemyStates.IDLE;
      this.enemy.resumeState = undefined;
      this.enemy.setState(resume);
    }
  }
}

class EnemyDead extends EnemyState {
  constructor(enemy) {
    super(enemyStates.DEATH, enemy);
  }

  enter() {
    this.enemy.speedX = 0;
    this.enemy.isDead = true;
    this.enemy.isAlive = false;

    this.enemy.frameX = 0;
    this.enemy.frameY = 7;
    this.enemy.maxFrame = 15;

    this.enemy._deathAnimDone = false;
    this.enemy._deathStartMs = performance.now();
    this.enemy._deathVanishDelayMs = 4000;
  }

  handleInput() {
    this.enemy.speedX = 0;

    if (this.enemy.frameX >= this.enemy.maxFrame) {
      this.enemy.frameX = this.enemy.maxFrame;
      this.enemy._deathAnimDone = true;
    }

    if (
      this.enemy._deathAnimDone &&
      performance.now() - this.enemy._deathStartMs >=
        this.enemy._deathVanishDelayMs
    ) {
      this.enemy.isVanished = true;
    }
  }
}

export class Enemy {
  constructor() {
    this.frameX = 0;
    this.frameY = 0;

    this.fps = 10;
    this.frameTimer = 0;
    this.frameInterval = 1000 / this.fps;

    this.x = 0;
    this.y = 0;
    this.speedX = 0;

    this.width = 0;
    this.height = 0;

    this.maxFrame = 0;

    this.health = 1;
    this.maxHealth = 1;
    this.isDead = false;
    this.isAlive = true;

    this.direction = 1; // 1 => right, -1 => left
    this.baseSpeedX = 0;

    this.deathFrameX = 0;
    this.deathFrameY = 0;

    this.states = [];
    this.currentState = null;
    this.previousState = null;
    this.targetPlayer = null;

    this.pendingDirection = undefined;
    this.resumeState = undefined;

    // Vision distances
    // - if player is in front: can see up to aggroRangeFront px
    // - if player is behind: smaller range (aggroRangeBack px)
    this.aggroRangeFront = 600;
    this.aggroRangeBack = 200;

    // How long (ms) the enemy keeps chasing after losing sight of the
    // player before giving up and returning to patrol.
    this.loseTrackDelayMs = 2000;

    this._deathAnimDone = false;
    this._isAlerted = false;
    this._lastSeenPlayerAt = 0;
  }

  setState(stateEnum) {
    if (!this.states[stateEnum]) {
      console.warn(
        `[Enemy] setState called with invalid stateEnum: ${stateEnum}`,
      );
      return;
    }
    this.previousState = this.currentState?.state;
    this.currentState = this.states[stateEnum];
    this.currentState.enter();
  }

  revertState() {
    if (this.previousState === null || this.previousState === undefined) return;
    this.setState(this.previousState);
  }

  // Shared damage entry point - any subclass gets this for free.
  takeDamage(amount = 1) {
    if (this.isDead) return;

    if (this.currentState?.state === enemyStates.GET_HIT) {
      // Already in GET_HIT: don't restart animation from frame 0.
      this.frameX = Math.max(this.frameX, 3);
      return;
    }

    this.health -= amount;
    if (this.health < 0) this.health = 0;

    // Being hit always alerts the enemy, regardless of vision range -
    // checkPlayerDistance()/EnemyCharge will pick this up next frame.
    this._isAlerted = true;
    this._lastSeenPlayerAt = performance.now();

    if (this.health <= 0) {
      this.setState(enemyStates.DEATH);
    } else {
      this.resumeState = this.currentState?.state ?? enemyStates.IDLE;
      this.setState(enemyStates.GET_HIT);
    }
  }

  checkPlayerDistance() {
    if (!this.targetPlayer || this.isDead) return;

    // States that own their own player-tracking logic and shouldn't be
    // interrupted by the generic IDLE/WALK detection below.
    const isBusy =
      this.currentState?.state === enemyStates.ANTICIPATION ||
      this.currentState?.state === enemyStates.CHARGE ||
      this.currentState?.state === enemyStates.IMPACT ||
      this.currentState?.state === enemyStates.TURN ||
      this.currentState?.state === enemyStates.GET_HIT;

    if (isBusy) return;

    const dx = this.targetPlayer.x - this.x;
    const isInFront =
      (dx > 0 && this.direction === 1) || (dx < 0 && this.direction === -1);
    const distance = Math.abs(dx);
    const range = isInFront ? this.aggroRangeFront : this.aggroRangeBack;
    const canSeePlayer = distance <= range;

    if (canSeePlayer || this._isAlerted) {
      // Either we can currently see them, or we were alerted (e.g. shot
      // from outside our normal vision range) - react immediately.
      this._isAlerted = false;
      this._lastSeenPlayerAt = performance.now();

      const desiredDirection = dx > 0 ? 1 : -1;

      if (desiredDirection !== this.direction) {
        this.pendingDirection = desiredDirection;
        this.resumeState = enemyStates.ANTICIPATION;
        this.setState(enemyStates.TURN);
        return;
      }

      this.setState(enemyStates.ANTICIPATION);
    } else if (this.currentState?.state !== enemyStates.WALK) {
      this.setState(enemyStates.WALK);
    }
  }

  getHitbox() {
    return {
      left: this.x + this.enemywidth / (this.direction > 0 ? 5 : 2.5),
      right: this.x + this.enemywidth * (this.direction > 0 ? 1.23 : 1.4),
      top: this.y + 20,
      bottom: this.y + this.enemyheight,
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

  update(deltaTime) {
    if (!this.currentState) return;

    this.checkPlayerDistance();
    this.currentState.handleInput(deltaTime);

    this.x += this.speedX;

    // simple frame advance if maxFrame is set.
    // DEATH never wraps back to 0 - EnemyDead.handleInput() clamps it.
    if (this.frameTimer > this.frameInterval) {
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else if (this.currentState?.state !== enemyStates.DEATH) {
        this.frameX = 0;
      }
      this.frameTimer = 0;
    } else {
      this.frameTimer += deltaTime;
    }
  }

  drawHealthBar(ctx) {
    // Hide healthbar for enemies that have a dedicated idle/asleep state.
    // (e.g. ice skeleton while sleeping)
    if (this.currentState?.state === enemyStates.ICE_SKELETON_IDLE) return;

    if (this.maxHealth <= 0) return;

    const barWidth = Math.max(this.width, 60);
    const barHeight = 8;
    const x = this.x + (this.width - barWidth) / 2;
    const y = this.y - 16;

    const pct = Math.max(0, this.health / this.maxHealth);

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = pct > 0.5 ? "#4caf50" : pct > 0.2 ? "#ffb300" : "#e53935";
    ctx.fillRect(x, y, barWidth * pct, barHeight);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

  draw(ctx, deltaTime) {
    if (this.isVanished) return;

    if (this.frameTimer > this.frameInterval) {
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else if (this.currentState?.state !== enemyStates.DEATH) {
        this.frameX = 0;
      }
      this.frameTimer = 0;
    } else {
      this.frameTimer += deltaTime;
    }

    if (!ctx || !this.image) return;

    const box = this.getHitbox();
    ctx.strokeStyle = "#00ff00";
    ctx.strokeRect(
      box.left,
      box.top,
      box.right - box.left,
      box.bottom - box.top,
    );

    if (!this.isDead || !this._deathAnimDone) {
      this.drawHealthBar(ctx);
    }

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

    this.width = 162.4;
    this.height = 106;

    this.enemywidth = 100;
    this.enemyheight = 100;

    this.x = 1000;
    this.y = 0;

    this.maxFrame = 5;

    this.direction = -1;
    this.baseSpeedX = 4;

    this.image = document.getElementById("icebull");

    this.health = 100;
    this.maxHealth = 100;

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
}

class IceSkeletonIdleState extends EnemyState {
  constructor(enemy) {
    super(enemyStates.ICE_SKELETON_IDLE, enemy);
  }

  enter() {
    this.enemy.speedX = 0;
    // Single, fixed frame - no animation while idle/asleep.
    this.enemy.frameX = 0;
    this.enemy.frameY = 2;
    this.enemy.maxFrame = 0; // stays put, no advance
        this.enemy.enemywidth = 0;
    this.enemy.enemyheight = 0;
  }

  handleInput() {
    this.enemy.speedX = 0;

    const target = this.enemy.targetPlayer;
    if (!target || this.enemy.isDead) return;

    const dx = target.x - this.enemy.x;
    const distance = Math.abs(dx);

    if (distance <= (this.enemy.wakeRange ?? 200)) {
      // Player got close enough - wake up and start walking.
      this.enemy.direction = dx >= 0 ? 1 : -1;
      this.enemy.setState(enemyStates.ICE_SKELETON_WALK);
    }
  }
}

class IceSkeletonWalkingState extends EnemyState {
  constructor(enemy) {
    super(enemyStates.ICE_SKELETON_WALK, enemy);
  }

  enter() {
    this.enemy.frameX = 0;
    this.enemy.frameY = this.enemy.walkFrameY ?? 0;
    this.enemy.maxFrame = this.enemy.walkMaxFrame ?? 7;
    this.enemy.enemywidth = 45;
    this.enemy.enemyheight = 80;
  }

  handleInput(deltaTime) {
    if (this.enemy.frameX >= this.enemy.maxFrame) {
      this.enemy.frameX = 0;
    }

    const target = this.enemy.targetPlayer;
    if (!target || this.enemy.isDead) {
      this.enemy.speedX = this.enemy.direction * this.enemy.baseSpeedX;
      return;
    }

    const playerBox = target.getHitbox?.();
    const enemyBox = this.enemy.getHitbox();

    const isTouching =
      playerBox && this.enemy.hitboxesOverlap(enemyBox, playerBox);

    const dx = target.x - this.enemy.x;
    const deadZone = this.enemy.directionFlipDeadZonePx ?? 5;
    const desiredDirection =
      Math.abs(dx) <= deadZone ? this.enemy.direction : dx >= 0 ? 1 : -1;

    if (desiredDirection !== this.enemy.direction) {
      this.enemy.direction = desiredDirection;
    }

    this.enemy.speedX = isTouching
      ? 0
      : this.enemy.direction * this.enemy.baseSpeedX;

    const hitLeftEdge = this.enemy.x <= 0;
    const hitRightEdge =
      this.enemy.x >= (window.worldWidth ?? Infinity) - this.enemy.width;

    if (hitLeftEdge) {
      this.enemy.direction = 1;
      this.enemy.speedX = this.enemy.direction * this.enemy.baseSpeedX;
    } else if (hitRightEdge) {
      this.enemy.direction = -1;
      this.enemy.speedX = this.enemy.direction * this.enemy.baseSpeedX;
    }
  }
}

class IceSkeletonDeathState extends EnemyState {
  constructor(enemy) {
    super(enemyStates.ICE_SKELETON_DEATH, enemy);
  }

  enter() {
    this.enemy.speedX = 0;
    this.enemy.isDead = true;
    this.enemy.isAlive = false;

    this.enemy._prevDeathFrameInterval = this.enemy.frameInterval;
    this.enemy._prevDeathFps = this.enemy.fps;
    this.enemy.fps = 5;
    this.enemy.frameInterval = 1000 / this.enemy.fps;

    this.enemy.frameX = 0;
    this.enemy.frameY = 1;
    this.enemy.maxFrame = 5;

    this.enemy._deathAnimDone = false;
    this.enemy._deathStartMs = performance.now();
    this.enemy._deathVanishDelayMs = 4000;
  }

  handleInput() {
    this.enemy.speedX = 0;

    if (this.enemy.frameX >= this.enemy.maxFrame) {
      this.enemy.frameX = this.enemy.maxFrame;
      this.enemy._deathAnimDone = true;

      if (this.enemy._prevDeathFrameInterval !== undefined) {
        this.enemy.frameInterval = this.enemy._prevDeathFrameInterval;
        this.enemy._prevDeathFrameInterval = undefined;
      }
      if (this.enemy._prevDeathFps !== undefined) {
        this.enemy.fps = this.enemy._prevDeathFps;
        this.enemy._prevDeathFps = undefined;
      }

      this.enemy.frameTimer = 0;
    }

    if (
      this.enemy._deathAnimDone &&
      performance.now() - this.enemy._deathStartMs >=
        this.enemy._deathVanishDelayMs
    ) {
      this.enemy.isVanished = true;
    }
  }
}

export class iceSkeleton extends Enemy {
  constructor() {
    super();

    this.iceWalkState = enemyStates.ICE_SKELETON_WALK;

    this.width = 90;
    this.height = 80;



    this.x = 1000;
    this.y = 0;

    this.direction = -1;
    this.baseSpeedX = 4;

    this.image = document.getElementById("iceskeleton");

    this.health = 10;
    this.maxHealth = 10;

    this.walkFrameY = 0;
    this.walkMaxFrame = 7;
    this.deathFrameY = 1;
    this.deathMaxFrame = 5;

    // Idle/sleep: single fixed frame until the player gets close.
    this.idleFrameX = 0;
    this.idleFrameY = 0;
    this.wakeRange = 200; // px - distance at which it wakes and starts walking

    this.states = [];
    this.states[enemyStates.ICE_SKELETON_IDLE] = new IceSkeletonIdleState(this);
    this.states[enemyStates.ICE_SKELETON_WALK] = new IceSkeletonWalkingState(
      this,
    );
    this.states[enemyStates.ICE_SKELETON_DEATH] = new IceSkeletonDeathState(
      this,
    );

    this.setState(enemyStates.ICE_SKELETON_IDLE);
  }

  // Ice skeleton uses its own simplified hitbox.
  getHitbox() {
    return {
      left:
        this.x + this.enemywidth / (this.direction > 0 ? 1.8 : 3.55),
      right:
        this.x + this.enemywidth * (this.direction > 0 ? 1.8 : 1.4),
      top: this.y + 20,
      bottom: this.y + this.enemyheight,
    };
  }

  takeDamage(amount = 1) {
    if (this.isDead) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.setState(enemyStates.ICE_SKELETON_DEATH);
      return;
    }

    // Being hit always wakes it up, even from outside wakeRange.
    if (this.currentState?.state === enemyStates.ICE_SKELETON_IDLE) {
      const target = this.targetPlayer;
      if (target) {
        this.direction = target.x >= this.x ? 1 : -1;
      }
      this.setState(enemyStates.ICE_SKELETON_WALK);
    }
  }
}
