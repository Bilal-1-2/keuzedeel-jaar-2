# ThrowingGrenade Speed Not Stopping Issue Fix Guide

## Issue Analysis

- **Symptom**: While running/walking, press G → enters THROWINGGRENADE, but player speed remains previous value (continues moving).
- **Cause**: `player.speed` not reset to 0 on THROWINGGRENADE `enter()`. Running enter sets speed = ±maxSpeed, G press sets speed=0 but enter overrides? No, enter called on setState, after speed=0.
  - Code in Standing/Running/Walking "PRESS G": `this.player.speed = 0; ... setState(THROWINGGRENADE)`
  - ThrowingGrenade.enter(): `this.player.speed = 0;` - should stop.
  - But continues: Likely held keys logic **after** setState continues applying speed in next frames, or update x += speed before state change.
  - Flow: update() → handleInput sets speed=0 + setState → enter sets speed=0 → physics x += speed (0).
  - Next frame: handleInput sees no "PRESS G" (one-shot), held keys.right/left → sets speed again!
  - **Root**: No "no-movement during grenade" held logic in ThrowingGrenade.

## Fix Steps

1. **ThrowingGrenade.enter()**: Already `speed = 0;` good.

2. **ThrowingGrenade.handleInput()**: Add held override **every frame** ignore movement keys:

```
handleInput(input) {
  // Ignore movement during grenade
  // No if for keys.right/left/up/down

  // Existing event checks...
}
```

Or explicitly:

```
  // Force stop speed every frame
  this.player.speed = 0;
```

3. **Prevent state change back**: Ensure no held logic in ThrowingGrenade sets RUNNING etc. Current no, good.

4. **Grenade anim complete**: On "RELEASE G" + frameX >= maxFrames, set STANDING (already).

5. **Test**: Debug shows speed=0 during grenade, keys held don't override.

## Code Snippet

```
export class ThrowingGrenade extends State {
  // ...
  handleInput(input) {
    this.player.speed = 0; // Force stop every frame
    // Existing PRESS up etc.
  }
}
```

## Why It Works

- Every update frame during grenade: speed forced 0, no movement override.
- Physics x += 0.
- On anim end/release, to STANDING, held keys take over naturally.

Reload enemy.html, test run+G → stops dead during grenade, resumes on end. Fixed!
