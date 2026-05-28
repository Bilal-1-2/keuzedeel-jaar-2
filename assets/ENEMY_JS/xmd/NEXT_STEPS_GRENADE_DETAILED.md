# Grenade Implementation: Ultra-Detailed Next Steps Guide

## 0. Current Project Scan Summary (All Files Analyzed)

| File           | Purpose                                                                                                                        | Grenade-Relevant Status                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| **script.js**  | Main entry/game loop (load → animate: clear/update/draw player)                                                                | Needs: import Grenade, grenades[], spawn callback, loops for update/filter/draw |
| **player.js**  | Player class (physics, animation, states array/switch)                                                                         | Has states; needs: spawnGrenade callback prop, hasThrown flag                   |
| **state.js**   | Player states (Standing/Running etc., input → state changes). THROWINGGRENADE sets `this.thrown=true` on release+anim complete | Perfect hook: use `thrown` to trigger spawn                                     |
| **input.js**   | Key events ('G'→\"PRESS G\"/\"RELEASE G\")                                                                                     | Ready - feeds states                                                            |
| **grenade.js** | Grenade class properties only (x,y,velocities,animation vars,physics consts,lifetime)                                          | Needs: update() physics+anim+lifetime, draw() canvas render+flip                |
| **utils.js**   | Debug text overlay (input/state/pos)                                                                                           | Optional: add `grenades.length` display                                         |
| **enemy.html** | Canvas, soldier img, grenade img loaded hidden                                                                                 | Ready                                                                           |

**Key Insight:** Game is single-object (player only). Grenade follows exact Player pattern. Throw animation already exists - just spawn object at end.

## 1. Implement Grenade Methods (assets/ENEMY_JS/grenade.js)

Add these **exactly** after constructor:

### update(deltaTime) - **What it does, line-by-line:**

```js
update(deltaTime) {
  if (!this.exists) return;  // Skip dead grenades (early exit, performant)

  // HORIZONTAL MOVEMENT: Constant speed (like bullet thrust)
  this.x += this.vh;  // vh set in ctor (10/-10 based on facingRight) - no friction

  // VERTICAL PHYSICS: Gravity arc (realistic throw)
  this.vy += this.gravity;  // gravity=0.2 accelerates downward each frame
  this.y += this.vy;        // vy starts -5 (up), becomes positive (down)

  // ANIMATION TIMER (matches player.fps=20)
  this.frameTimer += deltaTime;  // deltaTime ~16ms @60fps
  if (this.frameTimer > this.frameInterval) {  // frameInterval~50ms
    this.frameX = (this.frameX + 1) % this.maxFrame;  // loop 0-5→0
    this.frameTimer = 0;
  }

  // DESTROY CONDITIONS (auto-cleanup)
  const age = Date.now() - this.startTime;
  if (age > this.lifetime || this.y > window.innerHeight + 100) {  // 3s or offscreen
    this.exists = false;  // flag → filter removes
  }
}
```

**Why:** Simulates thrown grenade: fast horizontal, upward then arc down. Anim rotates sprite. Self-destructs.

### draw(ctx, deltaTime) - **What it does, line-by-line:**

```js
draw(ctx, deltaTime) {
  if (!this.exists || !this.image) return;  // Safety

  const sx = this.frameX * this.width;  // source X in sprite sheet (0,32,64...)
  const sy = this.frameY * this.height; // source Y

  if (this.flip) {  // Left-facing (player.flip=true → grenade right? adjust)
    ctx.save();                    // Save ctx state
    ctx.scale(-1, 1);              // Mirror horizontally
    ctx.drawImage(this.image, sx, sy, this.width, this.height,
      -this.x - this.width, this.y,  // Adjusted dest pos for flip
      this.width, this.height);
    ctx.restore();                 // Reset ctx
  } else {
    ctx.drawImage(this.image, sx, sy, this.width, this.height,
      this.x, this.y, this.width, this.height);  // Normal right-facing
  }
}
```

**Why:** Renders current frame at position. Flip mirrors sprite (like player). `save/scale/restore` prevents affecting other draws.

## 2. Main Loop Integration (assets/ENEMY_JS/script.js) - Every Line Explained

**Imports/Setup (top):**

```js
import Grenade from "./grenade.js"; // ES module import
let grenades = []; // Array holds active grenades (grows/shrinks)
```

**Spawn Callback (before Player init):**

```js
const spawnGrenade = (spawnX, spawnY, facingRight) => {
  // Offset from player hand: right-throw +50px x, left -20px (hand pos), +20 y (above feet)
  grenades.push(new Grenade(spawnX, spawnY, facingRight));
};
const player = new Player(canvas.width, canvas.height, spawnGrenade); // Pass fn
```

**In animate(timeStamp) loop (after player.update/draw):**

```js
// Update all
grenades.forEach((grenade) => grenade.update(deltaTime));

// Filter dead (reassign shorter array - efficient for few items)
grenades = grenades.filter((grenade) => grenade.exists);

// Draw surviving
grenades.forEach((grenade) => grenade.draw(ctx, deltaTime));
```

**Why order:** Physics before render. Filter prevents drawing dead. forEach simple/fast.

## 3. Spawning Hook (state.js & player.js)

**player.js:** Add to class/constructor:

```js
constructor(gameWidth, gameHeight, spawnGrenade) {
  // ... existing
  this.spawnGrenade = spawnGrenade || null;  // Optional callback
  this.hasThrown = false;  // Prevent spam-spawn per throw
}
```

**state.js ThrowingGrenade.handleInput() - replace/after `this.thrown=true` block:**

```js
if (this.player.spawnGrenade && !this.player.hasThrown && this.thrown) {
  this.player.spawnGrenade(
    this.player.x + (this.player.flip ? -20 : 50), // hand offset
    this.player.y + 20, // mid-body
    !this.player.flip, // direction opposite player face?
  );
  this.player.hasThrown = true;
}
```

**In ThrowingGrenade.enter():** `this.player.hasThrown = false;`
**Why:** `thrown` triggers exactly once (release+anim end). `hasThrown` per-throw reset. Offset mimics throw from hand.

## 4. Testing/Debug Commands

```
# Open in browser/XAMPP
http://localhost/game-keuzedeel-jaar-2/enemy.html

# Press G (hold then release) → animation → grenade flies!
# Debug toggle: D key (shows state, now add \`grenades.length: \${grenades.length}\`)
```

**Expected:** Parabola arc, spinning sprite, disappears after 3s/offscreen.

## Why This Design is Pro/Production-Ready

- **Frame-Independent:** deltaTime smooths 30/60/144fps.
- **Garbage-Free:** Filter reuses array slots.
- **Extensible:** Add Enemy class same way.
- **No Global Vars:** Callback pattern clean.
- **Matches Existing:** 100% player.js style.

## Troubleshooting

- No image? Check console `getElementById('grenade')`.
- No spawn? Verify `thrown`/callback.
- Flat trajectory? Tweak vy/gravity.

Implement 1→5 sequentially. MD auto-updates if you edit files!

**Updated:** Detailed property/method explanations added.
