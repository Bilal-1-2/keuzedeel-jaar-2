class Soldier {
  constructor(x, y) {
    // Position on canvas - this represents the CENTER of the soldier at the feet
    this.x = x;
    this.y = y;
    console.log(
      "🆕 Soldier created! Total soldiers:",
      window.soldierCount || 0,
    );
    window.soldierCount = (window.soldierCount || 0) + 1;

    // Canvas context for drawing
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    // Spritesheet
    this.walkSpriteSheet = new Image();
    this.runSpriteSheet = new Image();
    this.firingSpriteSheet = new Image();
    this.idleSpriteSheet = new Image();
    this.reloadSpriteSheet = new Image();
    this.meleeSpriteSheet = new Image();

    // Frame arrays (will be populated when sprites load)
    this.frames = [];
    this.runFrames = [];
    this.fireFrames = [];
    this.idleFrames = [];
    this.reloadFrames = [];
    this.meleeFrames = [];

    this.activeFrames = this.frames;
    this.totalFrames = 0;
    this.currentFrame = 0;

    // Health
    this.health = 100;
    this.maxHealth = 100;
    this.isAlive = true;
    this.isTakingDamage = false;
    this.damageFlashTimer = 0;
    this.isMoving = false;

    // Dummy enemy for testing bullet damage
    this.enemy = {
      x: 400,
      y: 480,
      health: 100,
      maxHealth: 100,
      width: 50,
      height: 50,
      isAlive: true,
    };

    // Firing properties
    this.isFiring = false;
    this.fireFrameIndex = 0;
    this.fireAnimationLength = 0; // Will be set when fireFrames load
    this.lastFireUpdate = Date.now();
    this.fireCooldown = 500;
    this.lastFireTime = 0;
    this.fireAnimationSpeed = 80;
    this.bullets = [];
    this.bulletSpeed = 15;
    this.mouseX = 0;
    this.mouseY = 0;
    this.isMouseDown = false;
    this.lastBulletUpdate = Date.now();
    this.bulletUpdateSpeed = 16; // ~60 FPS for smooth bullet movement
    this.bulletInterval = null; // interval handle for independent bullet loop

    // melee attack properties
    this.isMeleeing = false;
    this.meleeCooldown = 1500;
    this.lastMeleeUpdate = Date.now();
    this.meleeDamage = 30;
    this.meleeAnimationLength = 0;
    this.meleeFrameIndex = 0;
    this.lastMeleeTime = 0;
    this.meleeAnimationSpeed = 100; // ms per frame

    // reloading properties
    this.magazineSize = 30;
    this.bulletsInMagazine = 30;
    this.isReloading = false;
    this.reloadTime = 2500;
    this.reloadStartTime = 0;
    this.reloadFrameIndex = 0;
    this.lastReloadUpdate = Date.now();

    // Animation timing
    this.speed = 100;
    this.lastUpdate = Date.now();

    // Movement
    this.walkSpeed = 3;
    this.runSpeed = 6;
    this.firingSpeed = 1;
    this.reloadSpeed = 1.5;

    this.direction = 1; // 1 = right, -1 = left
    this.isRunning = false;

    // State
    this.isPlaying = false;
    this.isLoaded = false;
    this.keys = {};

    // Reference dimensions (will be set after frames are generated)
    this.maxFrameWidth = 128;
    this.maxFrameHeight = 128;

    this.collisionBoxes = {
      walk: {
        width: 20, // Measured from walk sprite
        height: 68, // Measured from walk sprite
        offsetX: -5, // Center horizontally
        offsetY: 0, // Adjust up/down if needed
      },
      run: {
        width: 28, // Measured from run sprite
        height: 60, // Measured from run sprite
        offsetX: -5,
        offsetY: 0,
      },
      fire: {
        width: 25, // Measured from fire sprite
        height: 63, // Measured from fire sprite
        offsetX: -13, // Might be offset due to gun
        offsetY: 0,
      },
      idle: {
        width: 20, // Measured from fire sprite
        height: 68, // Measured from fire sprite
        offsetX: -5, // Might be offset due to gun
        offsetY: 0,
      },
      reload: {
        width: 20, // Measured from fire sprite
        height: 68, // Measured from fire sprite
        offsetX: -8, // Might be offset due to gun
        offsetY: 0,
      },
      melee: {
        width: 20, // Measured from fire sprite
        height: 68, // Measured from fire sprite
        offsetX: -8, // Might be offset due to gun
        offsetY: 0,
      },
      meleeattack: {
        width: 20, // Measured from fire sprite
        height: 68, // Measured from fire sprite
        offsetX: 12, // Might be offset due to gun
        offsetY: 0,
      },
    };
    this.currentCollisionBox = this.collisionBoxes.walk;
    // Scale factor
    this.scale = (this.canvas.width / 1920) * 1;

    // Position offsets
    this.drawOffsetX = (this.maxFrameWidth * this.scale) / 2;
    this.drawOffsetY = this.maxFrameHeight * this.scale;

    this.loadSpriteSheets();
    this.setupControls();
    this.setupMouseControls();
  }

  // ========== REUSABLE FRAME GENERATOR ==========
  generateFramesFromSheet(spriteSheet, frameWidth = 128, frameHeight = 128) {
    const numFrames = Math.floor(spriteSheet.width / frameWidth);
    const frames = [];

    for (let i = 0; i < numFrames; i++) {
      frames.push({
        x: i * frameWidth,
        y: 0,
        width: frameWidth,
        height: frameHeight,
      });
    }

    return frames;
  }

  // ========== SPRITE LOADING ==========
  loadSpriteSheets() {
    console.log("📷 Loading sprite sheets...");

    // Walk sprite
    this.walkSpriteSheet.onload = () => {
      console.log(
        "✅ Walk sprite loaded, size:",
        this.walkSpriteSheet.width + "x" + this.walkSpriteSheet.height,
      );

      // Generate walk frames
      this.frames = this.generateFramesFromSheet(this.walkSpriteSheet);
      this.activeFrames = this.frames;
      this.totalFrames = this.frames.length;

      this.isLoaded = true;
      this.draw();

      console.log(`✅ Generated ${this.frames.length} walk frames`);
    };

    this.walkSpriteSheet.onerror = () => {
      console.error("❌ Failed to load soldier spritesheet!");
    };
    this.walkSpriteSheet.src = "assets/soldier/Soldier_1/Walk.png";

    // Run sprite
    this.runSpriteSheet.onload = () => {
      console.log("✅ Running spritesheet loaded!");

      // Generate run frames
      this.runFrames = this.generateFramesFromSheet(this.runSpriteSheet);
      console.log(`✅ Generated ${this.runFrames.length} run frames`);
    };

    this.runSpriteSheet.onerror = () => {
      console.error("❌ Failed to load running spritesheet!");
    };
    this.runSpriteSheet.src = "assets/soldier/Soldier_1/Run.png";

    // Firing sprite
    this.firingSpriteSheet.onload = () => {
      console.log("✅ Firing spritesheet loaded!");

      // Generate fire frames
      this.fireFrames = this.generateFramesFromSheet(this.firingSpriteSheet);
      this.fireAnimationLength = this.fireFrames.length;
      console.log(`✅ Generated ${this.fireFrames.length} fire frames`);
    };

    this.firingSpriteSheet.onerror = () => {
      console.error("❌ Failed to load firing spritesheet!");
    };
    this.firingSpriteSheet.src = "assets/soldier/Soldier_1/Shot_1.png";

    // Idle sprite
    this.idleSpriteSheet.onload = () => {
      console.log("✅ Idle spritesheet loaded!");

      // Generate idle frames
      this.idleFrames = this.generateFramesFromSheet(this.idleSpriteSheet);
      console.log(`✅ Generated ${this.idleFrames.length} idle frames`);
    };

    this.idleSpriteSheet.onerror = () => {
      console.error("❌ Failed to load idle spritesheet!");
    };
    this.idleSpriteSheet.src = "assets/soldier/Soldier_1/Idle.png";

    // reloading sprite
    this.reloadSpriteSheet.onload = () => {
      console.log("✅ reloading spritesheet loaded!");

      // Generate idle frames
      this.reloadFrames = this.generateFramesFromSheet(this.reloadSpriteSheet);
      console.log(`✅ Generated ${this.reloadFrames.length} reloading frames`);
    };

    this.reloadSpriteSheet.onerror = () => {
      console.error("❌ Failed to load reloading spritesheet!");
    };
    this.reloadSpriteSheet.src = "assets/soldier/Soldier_1/recharge.png";

    this.meleeSpriteSheet.onload = () => {
      console.log("melee spritesheet loaded!");
      this.meleeFrames = this.generateFramesFromSheet(this.meleeSpriteSheet);
      this.meleeAnimationLength = this.meleeFrames.length;
      console.log(`Generated ${this.meleeFrames.length} melee frames`);
    };
    this.meleeSpriteSheet.onerror = () => {
      console.error("❌ Failed to load melee spritesheet!");
    };
    this.meleeSpriteSheet.src = "assets/soldier/Soldier_1/Attack.png";
  }

  // ========== COLLISION LOGIC ==========
  getCurrentCollisionBox() {
    if (this.isReloading) {
      return this.collisionBoxes.reload;
    } else if (this.isFiring) {
      return this.collisionBoxes.fire;
    } else if (this.isRunning) {
      return this.collisionBoxes.run;
    } else if (this.isMoving) {
      return this.collisionBoxes.walk;
    } else {
      return this.collisionBoxes.idle;
    }
  }

  checkCollison(pointX, pointY) {
    const box = this.getCurrentCollisionBox();

    const adjustedOffsetX = box.offsetX * this.direction;
    const boxCenterX = this.x + adjustedOffsetX * this.scale;
    const boxTopY = this.y - box.height * this.scale + box.offsetY * this.scale;

    const boxLeftX = boxCenterX - (box.width * this.scale) / 2;

    const isInsideX =
      pointX >= boxLeftX && pointX <= boxLeftX + box.width * this.scale;

    const isInsideY =
      pointY >= boxTopY && pointY <= boxTopY + box.height * this.scale;

    return isInsideX && isInsideY;
  }

  drawCollisionBox() {
    const box = this.getCurrentCollisionBox();
    const testEnemyX = 400;
    const testEnemyY = 80;
    const adjustedOffsetX = box.offsetX * this.direction;

    const boxCenterX = this.x + adjustedOffsetX * this.scale;
    const boxTopY = this.y - box.height * this.scale + box.offsetY * this.scale;
    const boxLeftX = boxCenterX - (box.width * this.scale) / 2;
    this.ctx.save();
    this.ctx.strokeStyle = "rgba(255,0,0,0.7)";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      boxLeftX,
      boxTopY,
      box.width * this.scale,
      box.height * this.scale,
    );

    this.ctx.fillStyle = "rgba(0, 0, 255, 0.8)";
    this.ctx.fillRect(this.x - 3, this.y - 3, 6, 6);

    this.ctx.restore();
  }
  // ========== RELOADING LOGIC ==========
  startReloading() {
    if (this.isReloading || this.isFiring || !this.isAlive || this.isMeleeing)
      return;
    if (this.bulletsInMagazine >= this.magazineSize) return; //already full

    console.log(" starting reload...");
    this.isReloading = true;
    this.reloadFrameIndex = 0;
    this.reloadStartTime = Date.now();
    this.isPlaying = true;

    if (this.isFiring) {
      this.stopFiring();
    }
  }

  stopReloading() {
    if (!this.isReloading) return;

    this.isReloading = false;
    this.bulletsInMagazine = this.magazineSize; // Fill magazine
    this.reloadFrameIndex = 0;
  }

  updateReloadAnimation() {
    if (!this.isReloading) return;

    const now = Date.now();

    // Check if reload time is complete
    if (now - this.reloadStartTime >= this.reloadTime) {
      this.stopReloading();
      return;
    }

    // Update reload animation frames (adjust speed as needed)
    const reloadAnimationSpeed = 100; // ms per frame
    if (now - this.lastReloadUpdate >= reloadAnimationSpeed) {
      if (this.reloadFrames.length > 0) {
        this.reloadFrameIndex =
          (this.reloadFrameIndex + 1) % this.reloadFrames.length;
      }
      this.lastReloadUpdate = now;
    }
  }
  // ========== MELEE LOGIC ==========

  startMelee() {
    if (!this.isAlive || this.isMeleeing) return;
    const now = Date.now();
    if (now - this.lastMeleeTime > this.meleeCooldown) {
      if (this.isFiring) {
        this.stopFiring();
      }
      if (this.isReloading) {
        this.stopReloading();
      }
      this.isPlaying = true;
      this.isMeleeing = true;
      this.meleeFrameIndex = 0;
      this.lastMeleeUpdate = now;
      this.lastMeleeTime = now;
    }
  }

  updateMeleeAnimation() {
    if (!this.isAlive || !this.isLoaded) return;
    const now = Date.now();

    if (now - this.lastMeleeUpdate >= this.meleeAnimationSpeed) {
      this.meleeFrameIndex++;
      this.lastMeleeUpdate = now;
      if (this.meleeFrameIndex >= this.meleeAnimationLength) {
        this.stopMelee();
      }
    }
  }
  stopMelee() {
    if (!this.isMeleeing) return;
    this.isMeleeing = false;
    this.meleeFrameIndex = 0;

    this.isPlaying = true;
    this.currentFrame = 0;
    this.lastUpdate = Date.now();

    if (this.isMouseDown && this.bulletsInMagazine > 0) {
      this.startFiring();
    } else if (this.isMoving) {
    }
  }
  // ========== CONTROLS ==========
  setupControls() {
    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d"].includes(key)) {
        this.keys[key] = true;
        this.checkMovement();
      }
      if (key === "control") {
        toggleSoldierRun();
        this.switchAnimationMode();
      }

      if (key === "r") {
        this.startReloading();
      }
      if (key === "e") {
        this.startMelee();
      }
    });

    document.addEventListener("keyup", (event) => {
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d"].includes(key)) {
        this.keys[key] = false;
        this.checkMovement();
      }
      if (key === "control") {
        this.switchAnimationMode();
      }
    });
  }

  setupMouseControls() {
    // Mouse down (start firing)
    this.canvas.addEventListener("mousedown", (event) => {
      if (event.button === 0) {
        this.isMouseDown = true;
        this.startFiring();
      }
    });

    // Mouse up (stop firing)
    this.canvas.addEventListener("mouseup", (event) => {
      if (event.button === 0) {
        this.isMouseDown = false;
        this.stopFiring();
        if (this.bulletsInMagazine <= 0) {
          this.startReloading();
        }
      }
    });

    // Mouse move (track position only, no direction change)
    this.canvas.addEventListener("mousemove", (event) => {
      if (!this.isAlive) return;

      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = event.clientX - rect.left;
      this.mouseY = event.clientY - rect.top;
    });
  }

  // ========== FIRING LOGIC ==========
  startFiring() {
    if (this.isFiring || !this.isAlive || this.isMeleeing) return;

    if (this.isReloading) return;
    if (this.bulletsInMagazine <= 0) {
      this.startReloading();
      return;
    }
    const now = Date.now();
    if (now - this.lastFireTime < this.fireCooldown) return;

    this.isFiring = true;
    this.fireFrameIndex = 0;
    this.lastFireUpdate = now;
    this.lastFireTime = now;

    this.isPlaying = true;

    this.createBullet();
  }

  stopFiring() {
    this.isFiring = false;
    this.fireFrameIndex = 0;
  }

  createBullet() {
    if (this.bulletsInMagazine <= 0) {
      this.startReloading();

      return;
    }
    this.bulletsInMagazine--;

    const box = this.getCurrentCollisionBox();
    // Bullet always fires in the direction soldier is facing
    const bullet = {
      x: this.x + this.direction * 10 * this.scale,
      y: this.y - box.height * this.scale * 0.6,
      dirX: this.direction,
      dirY: 0, // Horizontal only
      speed: this.bulletSpeed,
      width: 10 * this.scale,
      height: 4 * this.scale,
      active: true,
      color: "#FFD700",
      damage: 25,
    };

    this.bullets.push(bullet);

    // Ensure bullets are updated independently of the soldier's update loop
    this.startBulletLoop();
  }

  updateBullets() {
    // Move bullets and prune inactive ones
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      // Skip and remove inactive bullets
      if (!bullet.active) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Move bullet
      bullet.x += bullet.dirX * bullet.speed;
      bullet.y += bullet.dirY * bullet.speed;

      // Check collision with enemy
      if (
        this.enemy.isAlive &&
        bullet.x >= this.enemy.x - this.enemy.width / 2 &&
        bullet.x <= this.enemy.x + this.enemy.width / 2 &&
        bullet.y >= this.enemy.y - this.enemy.height / 2 &&
        bullet.y <= this.enemy.y + this.enemy.height / 2
      ) {
        this.enemy.health -= bullet.damage;
        console.log(`Enemy hit! Health: ${this.enemy.health}`);
        bullet.active = false;
        if (this.enemy.health <= 0) {
          this.enemy.isAlive = false;
          console.log("Enemy defeated!");
        }
        continue;
      }

      // Mark bullets that are off-screen as inactive
      if (
        bullet.x < -100 ||
        bullet.x > this.canvas.width + 100 ||
        bullet.y < -100 ||
        bullet.y > this.canvas.height + 100
      ) {
        bullet.active = false;
      }
    }

    // If no bullets remain, stop the independent loop
    if (this.bullets.length === 0) {
      this.stopBulletLoop();
    }
  }

  // Start an independent loop to update bullets regardless of the soldier state
  startBulletLoop() {
    if (this.bulletInterval) return; // already running

    // Clamp interval to reasonable minimum for performance
    const intervalMs = Math.max(16, this.bulletUpdateSpeed);
    this.bulletInterval = setInterval(() => {
      try {
        this.updateBullets();
      } catch (err) {
        console.error("Bullet loop error:", err);
      }
    }, intervalMs);
  }

  // Stop the independent bullet loop
  stopBulletLoop() {
    if (this.bulletInterval) {
      clearInterval(this.bulletInterval);
      this.bulletInterval = null;
    }
  }

  updateFireAnimation() {
    if (!this.isFiring) return;

    const now = Date.now();

    const actualFireSpeed = Math.max(this.fireAnimationSpeed, 50);
    if (now - this.lastFireUpdate >= actualFireSpeed) {
      this.fireFrameIndex =
        (this.fireFrameIndex + 1) % this.fireAnimationLength;
      this.lastFireUpdate = now;

      // Create bullet at the "shooting" frame (usually frame 2)
      if (this.fireFrameIndex === 2 && this.isMouseDown) {
        this.createBullet();
      }

      // Reset for continuous firing
      if (this.fireFrameIndex === 0 && this.isMouseDown) {
        if (now - this.lastFireTime >= this.fireCooldown) {
          this.lastFireTime = now;
        }
      }
    }
  }

  // ========== MOVEMENT ==========
  checkMovement() {
    if (this.isMeleeing) return;
    const movingLeft = this.keys["a"];
    const movingRight = this.keys["d"];
    const movingUp = this.keys["w"];
    const movingDown = this.keys["s"];

    this.isMoving = movingLeft || movingRight || movingUp || movingDown;

    if (this.isMoving) {
      // Always set isPlaying to true when moving
      if (!this.isPlaying && this.isLoaded) {
        this.isPlaying = true;
        this.currentFrame = 0;
        this.lastUpdate = Date.now();
      }

      if (movingLeft && !movingRight) {
        this.direction = -1;
      } else if (movingRight && !movingLeft) {
        this.direction = 1;
      }
    } else {
      // When not moving AND not firing
      if (!this.isFiring) {
        // Switch to idle animation if we have idle frames
        if (this.idleFrames.length > 0) {
          this.activeFrames = this.idleFrames;
          this.totalFrames = this.idleFrames.length;
          this.isPlaying = true; // Keep playing, but with idle animation
          this.currentFrame = 0;
          this.lastUpdate = Date.now();
        } else {
          // No idle frames? Then stop animation
          this.isPlaying = false;
        }
      }
      // If we're firing, isPlaying should stay true for fire animation
    }
  }

  switchAnimationMode() {
    if (this.isRunning) {
      console.log("Switching to run mode");
      this.activeFrames = this.runFrames;
      this.totalFrames = this.runFrames.length;
      this.currentFrame = 0;
      this.speed = 50;
    } else {
      console.log("🚶 Switching to WALK mode");
      this.activeFrames = this.frames;
      this.totalFrames = this.frames.length;
      this.currentFrame = 0;
      this.speed = 100;
    }

    this.lastUpdate = Date.now();
  }

  // ========== UPDATE LOOP ==========
  update() {
    if (!this.isLoaded) return true;
    if (!this.isAlive) return false;

    const now = Date.now();
    this.updateReloadAnimation();
    if (!this.isReloading) {
      this.updateFireAnimation();
    }
    if (this.isMeleeing) {
      this.updateMeleeAnimation();
    }

    // Bullets are updated independently by an internal loop (startBulletLoop)
    // This keeps them moving even if the soldier is idle, moving, or dead.

    const isMoving =
      this.keys["a"] || this.keys["d"] || this.keys["w"] || this.keys["s"];

    // Update animation frame if playing
    if (this.isPlaying && now - this.lastUpdate >= this.speed) {
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.lastUpdate = now;
    }

    let currentSpeed;
    if (this.isFiring) {
      currentSpeed = this.firingSpeed;
    } else if (this.isRunning) {
      currentSpeed = this.runSpeed;
    } else {
      currentSpeed = this.walkSpeed;
    }

    // Move soldier
    if (this.keys["a"]) this.x -= currentSpeed;
    if (this.keys["d"]) this.x += currentSpeed;
    if (this.keys["w"]) this.y -= currentSpeed;
    if (this.keys["s"]) this.y += currentSpeed;

    // Keep soldier on screen
    const padding = 30;
    this.x = Math.max(
      padding + this.drawOffsetX,
      Math.min(this.canvas.width - padding - this.drawOffsetX, this.x),
    );
    this.y = Math.max(
      padding + this.drawOffsetY,
      Math.min(this.canvas.height - padding, this.y),
    );

    if (Math.random() < 0.01) {
      // Only log 1% of updates
      console.log(
        `🔄 Update called: isPlaying=${this.isPlaying}, isMoving=${this.isMoving}, isFiring=${this.isFiring}, bullets=${this.bullets.length}`,
      );
    }
    return true;
  }

  // ========== DRAWING ==========
  draw() {
    if (!this.isLoaded) return;

    // Update scale
    const baseScale = this.canvas.width / 1920;

    this.scale = baseScale * 2.5;

    if (this.canvas.width <= 720) {
      this.scale = Math.max(baseScale * 1.2, 1.5);
    }
    this.drawOffsetX = (this.maxFrameWidth * this.scale) / 2;
    this.drawOffsetY = this.maxFrameHeight * this.scale;

    // Choose correct frame based on state
    let frame;
    let spriteSheet;
    if (this.isMeleeing && this.meleeFrames.length > 0) {
      // MELEE FIRST
      frame = this.meleeFrames[this.meleeFrameIndex];
      spriteSheet = this.meleeSpriteSheet;
    } else if (this.isReloading && this.reloadFrames.length > 0) {
      // Reloading second priority
      frame = this.reloadFrames[this.reloadFrameIndex];
      spriteSheet = this.reloadSpriteSheet;
    } else if (this.isFiring && this.fireFrames.length > 0) {
      // Firing third priority
      frame = this.fireFrames[this.fireFrameIndex];
      spriteSheet = this.firingSpriteSheet;
    } else if (this.isMoving) {
      // Moving fourth priority
      frame = this.activeFrames[this.currentFrame] || this.activeFrames[0];
      spriteSheet = this.isRunning ? this.runSpriteSheet : this.walkSpriteSheet;
    } else {
      // Idle last
      if (this.idleFrames.length > 0) {
        frame =
          this.idleFrames[this.currentFrame % this.idleFrames.length] ||
          this.idleFrames[0];
        spriteSheet = this.idleSpriteSheet;
      } else {
        frame = this.activeFrames[this.currentFrame] || this.activeFrames[0];
        spriteSheet = this.walkSpriteSheet;
      }
    }

    // Calculate scaled dimensions
    const scaledWidth = frame.width * this.scale;
    const scaledHeight = frame.height * this.scale;

    // Calculate draw position
    const drawX = this.x - scaledWidth / 2;
    const drawY = this.y - scaledHeight;

    // Damage flash
    if (this.isTakingDamage && this.damageFlashTimer > 0) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.5;
      this.ctx.restore();
      this.damageFlashTimer--;
      if (this.damageFlashTimer <= 0) {
        this.isTakingDamage = false;
      }
    }

    // DEBUG: Draw the center point (red dot at soldier's feet)
    this.ctx.fillStyle = "red";
    this.ctx.fillRect(this.x - 2, this.y - 2, 4, 4);

    // Draw soldier
    this.ctx.save();
    if (this.direction === -1) {
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(
        spriteSheet,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        -drawX - scaledWidth,
        drawY,
        scaledWidth,
        scaledHeight,
      );
    } else {
      this.ctx.drawImage(
        spriteSheet,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        drawX,
        drawY,
        scaledWidth,
        scaledHeight,
      );
    }
    this.ctx.restore();

    // DEBUG: Draw green bounding box around current frame
    this.ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
    this.ctx.strokeRect(drawX, drawY, scaledWidth, scaledHeight);

    // DEBUG: Draw yellow center line
    this.ctx.strokeStyle = "rgba(255, 255, 0, 0.3)";
    this.ctx.beginPath();
    this.ctx.moveTo(this.x, drawY);
    this.ctx.lineTo(this.x, drawY + scaledHeight);
    this.ctx.stroke();

    this.drawCollisionBox();

    // Draw bullets
    this.drawBullets();

    // Draw enemy
    this.drawEnemy();

    // Draw health bar
    this.drawHealthBar();
    // Draw ammocounter bar
    this.drawAmmoCounter();

    this.drawReloadProgress();
  }

  drawBullets() {
    if (!this.bullets.length) return;

    this.ctx.save();
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      this.ctx.fillStyle = bullet.color;
      this.ctx.fillRect(
        bullet.x - bullet.width / 2,
        bullet.y - bullet.height / 2,
        bullet.width,
        bullet.height,
      );

      // Bullet glow effect
      this.ctx.shadowColor = bullet.color;
      this.ctx.shadowBlur = 5;
      this.ctx.fillRect(
        bullet.x - bullet.width / 2,
        bullet.y - bullet.height / 2,
        bullet.width,
        bullet.height,
      );
      this.ctx.shadowBlur = 0; // Reset shadow

      // Bullet trail
      this.ctx.beginPath();
      this.ctx.moveTo(bullet.x - bullet.dirX * 10, bullet.y - bullet.dirY * 10);
      this.ctx.lineTo(bullet.x, bullet.y);
      this.ctx.strokeStyle = "rgba(255,215,0,0.5)";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawHealthBar() {
    if (!this.isLoaded || this.health >= this.maxHealth) return;

    const healthBarWidth = 50 * this.scale;
    const healthBarHeight = 6 * this.scale;
    const healthBarYOffset = -10 * this.scale;

    const barX = this.x - healthBarWidth / 2;
    const barY = this.y - this.maxFrameHeight * this.scale + healthBarYOffset;

    this.ctx.fillStyle = "rgba(123, 50, 50, 0.7)";
    this.ctx.fillRect(barX, barY, healthBarWidth, healthBarHeight);

    const healthPercent = this.health / this.maxHealth;
    const healthWidth = healthBarWidth * healthPercent;

    if (healthPercent > 0.5) {
      this.ctx.fillStyle = "#4CAF50";
    } else if (healthPercent > 0.25) {
      this.ctx.fillStyle = "#FF9800";
    } else {
      this.ctx.fillStyle = "#F44336";
    }

    this.ctx.fillRect(barX, barY, healthWidth, healthBarHeight);

    this.ctx.strokeStyle = "rgba(255,255,255,0.5)";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, barY, healthBarWidth, healthBarHeight);
  }

  drawAmmoCounter() {
    if (!this.isLoaded) return;

    this.ctx.save();

    // TOP-RIGHT corner position
    const padding = 20;
    const ammoX = this.canvas.width - padding;
    const ammoY = padding + 20; // Slightly lower than top edge

    const ammoText = `${this.bulletsInMagazine}/${this.magazineSize}`;

    // Background for readability
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    const textWidth = this.ctx.measureText(ammoText).width + 15;
    this.ctx.fillRect(
      ammoX - textWidth - 15, // Left edge
      ammoY - 15, // Top edge
      textWidth + 20, // Width
      30, // Height
    );

    // Ammo text
    this.ctx.fillStyle = this.bulletsInMagazine > 5 ? "#FFFFFF" : "#FF0000";
    this.ctx.font = "bold 20px Arial";
    this.ctx.textAlign = "right";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(ammoText, ammoX, ammoY);

    // "AMMO" label above
    this.ctx.fillStyle = "#77ff00";
    this.ctx.font = "17px Arial";
    this.ctx.fillText("AMMO", ammoX, ammoY - 25);

    this.ctx.restore();
  }
  drawReloadProgress() {
    if (!this.isReloading || !this.isLoaded) return;

    this.ctx.save();

    const progress = (Date.now() - this.reloadStartTime) / this.reloadTime;
    const progressPercent = Math.min(Math.floor(progress * 100), 100);

    // Position UNDER the soldier (below feet)
    const barWidth = 60 * this.scale;
    const barHeight = 5 * this.scale;
    const barX = this.x - barWidth / 2; // Center under soldier
    const barY = this.y + 5 * this.scale; // Below soldier's feet

    // Reload progress bar background
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Reload progress fill
    this.ctx.fillStyle = "#4CAF50";
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Border
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    // "RELOADING" text below the bar
    this.ctx.fillStyle = "#FFFF00";
    this.ctx.font = `${6 * this.scale}px Arial`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";
    this.ctx.fillText("RELOADING", this.x, barY + barHeight + 5);

    // Optional: Percentage text inside bar
    // this.ctx.fillStyle = "#FFFFFF";
    // this.ctx.font = `${4 * this.scale}px Arial`;
    // this.ctx.fillText(`${progressPercent}%`, this.x, barY + barHeight / 2);

    this.ctx.restore();
  }

  drawEnemy() {
    if (!this.enemy.isAlive) return;

    this.ctx.save();

    // Draw enemy as a red rectangle
    this.ctx.fillStyle = "red";
    this.ctx.fillRect(
      this.enemy.x - this.enemy.width / 2,
      this.enemy.y - this.enemy.height / 2,
      this.enemy.width,
      this.enemy.height,
    );

    // Draw enemy health bar above
    const barWidth = 50;
    const barHeight = 6;
    const barX = this.enemy.x - barWidth / 2;
    const barY = this.enemy.y - this.enemy.height / 2 - 10;

    // Background
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health fill
    const healthPercent = this.enemy.health / this.enemy.maxHealth;
    const healthWidth = barWidth * healthPercent;
    this.ctx.fillStyle =
      healthPercent > 0.5
        ? "#4CAF50"
        : healthPercent > 0.25
          ? "#FF9800"
          : "#F44336";
    this.ctx.fillRect(barX, barY, healthWidth, barHeight);

    // Border
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    this.ctx.restore();
  }
  takeDamage(amount) {
    if (!this.isAlive) return false;

    this.health = Math.max(0, this.health - amount);
    this.damageFlashTimer = 10;
    this.isTakingDamage = true;

    if (this.health <= 0) {
      this.isAlive = false;
      this.isPlaying = false;
      console.log("💀 Soldier has died.");
    }
    return true;
  }

  startDeathAnimation() {
    this.deathAnimationPlaying = true;
    this.deathAnimationComplete = false;
    this.deathFrameIndex = 0;
    this.lastDeathFrameUpdate = Date.now();

    this.activeFrames = this.deathFrames;
    this.totalFrames = this.deathFrames.length;
    this.currentFrame = 0;
  }
}

// ========== HELPER FUNCTIONS ==========
function toggleSoldierRun() {
  if (window.currentSoldier) {
    window.currentSoldier.isRunning = !window.currentSoldier.isRunning;
    window.currentSoldier.switchAnimationMode();
    console.log("Run mode:", window.currentSoldier.isRunning);
  }
}

function toggleMouseFiring() {
  if (window.currentSoldier) {
    if (window.currentSoldier.isFiring) {
      window.currentSoldier.stopFiring();
    } else {
      window.currentSoldier.startFiring();
    }
  }
}

function clearBullets() {
  if (window.currentSoldier) {
    window.currentSoldier.bullets = [];
  }
}

function createSoldier(x, y) {
  const soldier = new Soldier(x, y);

  // Store for debugging
  window.currentSoldier = soldier;

  if (typeof AnimationManager !== "undefined") {
    AnimationManager.add(soldier, "soldiers");
  }

  return soldier;
}

function damageCurrentSoldier(amount = 10) {
  if (window.currentSoldier) {
    window.currentSoldier.takeDamage(amount);
  } else {
    console.log("No soldier to damage!");
  }
}

function forceReload() {
  if (window.currentSoldier) {
    window.currentSoldier.startReloading();
  }
}

function setAmmo(count) {
  if (window.currentSoldiersoldier) {
    window.currentSoldier.bulletsInMagazine = count;
  }
}

// ========== EXPORT TO WINDOW ==========
window.Soldier = Soldier;
window.createSoldier = createSoldier;
window.damageCurrentSoldier = damageCurrentSoldier;
window.toggleMouseFiring = toggleMouseFiring;
window.clearBullets = clearBullets;
window.forceReload = forceReload;
window.setAmmo = setAmmo;
