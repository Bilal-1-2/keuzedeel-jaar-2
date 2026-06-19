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
      this.enemy.resumeState = enemyStates.WALK;
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
    this.enemy.speedX = this.enemy.direction * this.enemy.baseSpeedX * 2;
    this.enemy.frameX = 0;
    this.enemy.frameY = 4;
    this.enemy.maxFrame = 6;
  }

  handleInput() {
    const target = this.enemy.targetPlayer;
    if (!target) return;

    const dx = target.x - this.enemy.x;

    // Hit check: real hitbox overlap, not raw x distance.
    const enemyBox = this.enemy.getHitbox();
    const playerBox = target.getHitbox?.();

    if (playerBox && this.enemy.hitboxesOverlap(enemyBox, playerBox)) {
      this.enemy.setState(enemyStates.IMPACT);
      return;
    }

    // Player slipped behind us mid-charge - turn to keep following them.
    // This intentionally ignores aggroRangeBack: once committed to a
    // charge, the enemy stays locked on rather than "losing" the player.
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
    if (target && typeof target.health === "number") {
      target.health -= 25;
      if (target.health < 0) target.health = 0;
    }
  }

  handleInput() {
    // We want:
    // 1) IMPACT animation plays
    // 2) As soon as IMPACT ends, switch to IDLE
    // 3) Stay in IDLE for 2 more seconds, then continue (re-set to IDLE is harmless)
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
  }

  handleInput() {
    // Dead is final - no movement, no transitions out.
    this.enemy.speedX = 0;

    // Clamp on the last frame instead of looping back to 0,
    // so the death pose holds once the animation finishes.
    if (this.enemy.frameX >= this.enemy.maxFrame) {
      this.enemy.frameX = this.enemy.maxFrame;
      this.enemy._deathAnimDone = true;
    }
  }
}

export class Enemy {
  constructor() {
    this.frameX = 0;
    this.frameY = 0;

    // sprite animation
    // Enemy animation fps (independent from the player)
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
    this.maxHealth = 1;
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

    // Used by EnemyTurn to know the target facing direction and which
    // state to resume once the turn animation finishes.
    this.pendingDirection = undefined;
    this.resumeState = undefined;

    // Vision distances
    // - if player is in front: can see up to aggroRangeFront px
    // - if player is behind: smaller range (aggroRangeBack px)
    this.aggroRangeFront = 600;
    this.aggroRangeBack = 200;

    this._deathAnimDone = false;
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

  // Revert to the last state we were in.
  revertState() {
    if (this.previousState === null || this.previousState === undefined) return;
    this.setState(this.previousState);
  }

  // Shared damage entry point - any subclass gets this for free.
  // Override in a subclass only if you need different death/hit behavior.
  takeDamage(amount = 1) {
    if (this.isDead) return;
    this.health -= amount;
    if (this.health < 0) this.health = 0;

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

    if (canSeePlayer) {
      const desiredDirection = dx > 0 ? 1 : -1;

      if (desiredDirection !== this.direction) {
        // Don't flip direction yet - just start the turn animation.
        // EnemyTurn will flip this.direction once the animation finishes,
        // then resume ANTICIPATION (freshly spotted the player).
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

    // Let current state decide transitions (distance checks etc.).
    // Some states may use targetPlayer/x in their logic.
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
    if (this.maxHealth <= 0) return;

    const barWidth = Math.max(this.width, 60);
    const barHeight = 8;
    const x = this.x + (this.width - barWidth) / 2;
    const y = this.y - 16;

    const pct = Math.max(0, this.health / this.maxHealth);

    // background
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x, y, barWidth, barHeight);

    // fill
    ctx.fillStyle = pct > 0.5 ? "#4caf50" : pct > 0.2 ? "#ffb300" : "#e53935";
    ctx.fillRect(x, y, barWidth * pct, barHeight);

    // border
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

  draw(ctx, deltaTime) {
    // Advance animation timer
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

    // Debug hitbox
    const box = this.getHitbox();
    ctx.strokeStyle = "lime";
    ctx.strokeRect(
      box.left,
      box.top,
      box.right - box.left,
      box.bottom - box.top,
    );

    // Health bar (hide once fully dead and animation finished, optional)
    if (!this.isDead || !this._deathAnimDone) {
      this.drawHealthBar(ctx);
    }

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

    // Hitbox size (used by getHitbox/overlap). If these are left 0/undefined,
    // collisions will never register.
    this.enemywidth = 100;
    this.enemyheight = 100;

    this.x = 1000;
    this.y = 0;

    this.maxFrame = 5;

    // movement tuning
    this.direction = -1;
    this.baseSpeedX = 4;

    this.image = document.getElementById("icebull");

    // enemy stats
    this.health = 100;
    this.maxHealth = 100;

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

  // takeDamage() is inherited from Enemy - no need to redefine it here
  // unless icebull needs special death/hit behavior.
}
