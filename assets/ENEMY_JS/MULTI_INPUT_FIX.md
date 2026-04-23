# Multi-Input Fix Explanation

## Problem

Original system:

- InputHandler only tracks `lastKey` (single string, e.g. "PRESS left").
- `player.update(input.lastKey)` passes **one** event per frame.
- Simultaneous keys (left+right, down+up) overwrite lastKey → only last event processed.
- Rapid state flicker (standing ↔ running) because key held state not tracked properly.
- Jump landing bias left due inconsistent flip/key logic.

## Solution

1. **InputHandler upgrade**:
   - Added `keys` object: `{left/right/up/down: bool}` persistent held state.
   - Keydown: keys[dir] = true, lastKey = "PRESS dir".
   - Keyup: keys[dir] = false, lastKey = "RELEASE dir".
   - **Debug now shows held states live.**

2. **Propagate full `input` obj**:
   - script.js: `player.update(input)` (obj).
   - player.js: `this.currentState.handleInput(input)` (obj).
   - States get **both** lastKey (events) + keys (held).

3. **State machine refactor** (all 4 states):
   - `input === "PRESS right"` → `input.lastKey === "PRESS right"`.
   - **Every frame held logic** using `input.keys`:
     | State | Held Logic |
     |-------|------------|
     | Standing | right/left → RUNNING; |
     | Running | right → right/maxSpeed; left → left/-max; down → RELOAD; none → STANDING. |
     | Reloading | up/release down → STANDING; up+ground → JUMP. |
     | Jumping | right/left air accel (0.5, clamp); friction else; land → running/down/prev. |

4. **Removed** player.left/rightKeyPressed (redundant/error-prone).

## Benefits

- **Multi-keys**: left+down reloads left; up+right jump right air-control.
- Smooth held movement, no flicker (held overrides events).
- Debug keys true/false while held.
- Consistent dir/flip/speed everywhere.

## Test

Reload enemy.html:

- Hold left+right → prioritizes right (right > left).
- Jump hold down → land reload.
- Debug top-left shows keys, states live.

Improved FSM handles real multi-input!
