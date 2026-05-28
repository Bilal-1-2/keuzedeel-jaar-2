# Collision Box (Crafter) — How to Describe in Your Project

## 1) What to create

A **collision box** is an invisible rectangle (or polygon) used by the game to detect:

- when the player/enemy **hits** the crafter
- when the player/enemy should **stop** or **take damage**

In this project you can think of it as: **visual sprite ≠ collision shape**.

---

## 2) Where to put it (concept)

For a **2D damage collision box**, you typically attach it to the crafter sprite.

### Important: your sprite x/y is the **middle (center)**

If your engine stores `sprite.x` / `sprite.y` as the **center**, then:

- **collider.x = crafter.x + offsetX**
- **collider.y = crafter.y + offsetY**

…but the collider is usually defined using a **top-left corner**.
So convert center → top-left like this:

- `colliderLeft = collider.x - collider.w/2`
- `colliderTop  = collider.y - collider.h/2`

Then do overlap checks with `(left, top, w, h)`.

### Inputs you need

- **width, height**: collision box size
- **offsetX, offsetY**: move the collision box inside the sprite (optional)

---

Then create a rectangle aligned to the game world (usually no rotation):

- `collider.x = crafter.x + offsetX`
- `collider.y = crafter.y + offsetY`
- `collider.w = crafter.w - trimLeft - trimRight`
- `collider.h = crafter.h - trimTop - trimBottom`

### Why offsets/trim are useful

Sprites often have empty space (transparent pixels). Trimming makes collisions feel fair.

---

## 3) Typical variables (example names)

Use consistent names in your code/docs:

- `crafterColliderWidth`
- `crafterColliderHeight`
- `crafterColliderOffsetX`
- `crafterColliderOffsetY`

If your engine supports it, you can also store:

- `colliderType`: `solid` / `damage` / `trigger`

---

## 4) Collision detection approach (simple)

Most student projects start with **AABB** (Axis-Aligned Bounding Box):

Two rectangles overlap if:

- `a.left < b.right`
- `a.right > b.left`
- `a.top < b.bottom`
- `a.bottom > b.top`

### Result of collision

Decide what happens when overlapped:

- **Solid**: push actor out (or block movement)
- **Damage**: reduce health once per cooldown
- **Trigger**: start an interaction (collect / craft / open UI)

---

## 5) Preventing damage spam (cooldown idea)

If the crafter damages the player/enemy, you usually want:

- apply damage **once per X milliseconds**

Example logic in words:

- If collision is true and `now - lastHitTime > hitCooldown`
  - apply damage
  - set `lastHitTime = now`

---

## 6) How to test it

1. Put player/enemy close to crafter edges.
2. Move slowly and observe:
   - Can you walk “through” the sprite?
   - Does it collide too early/too late?
3. Adjust:
   - offsets (offsetX/offsetY)
   - trim (width/height)
4. Test at:
   - standing
   - jumping
   - moving left/right

---

## 7) How to write it in your report (short template)

You can copy/paste this section into your documentation:

> We implemented a collision box for the crafter using an axis-aligned rectangle. The collision rectangle is positioned using offsets relative to the crafter sprite to reduce mismatch caused by transparent pixels. Collision detection is done using AABB overlap checks. When the player/enemy intersects the collision box, we either block movement (solid collider) or trigger interaction/damage (depending on collider type). To prevent damage spam, we applied a cooldown timer so health is reduced only once per interval.

---

## 8) What I need from you (only if you want it customized)

If you tell me (in one message):

- crafter purpose (solid block? damage? crafting trigger?)
- whether x/y is top-left or center in your code
- the intended box size (roughly)

…I can rewrite this MD file as a perfect, project-specific explanation without changing any code.
