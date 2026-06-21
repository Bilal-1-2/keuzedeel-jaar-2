t # TODO - Add new enemy

- [ ] Decide whether new enemy goes into `assets/ENEMY_JS/enemy.js` (recommended) or into a separate file.
- [ ] Implement new enemy class by extending `Enemy` and registering required states (Idle/Walk/Turn/Anticipation/Charge/Impact/GetHit/Death).
- [ ] Add spawning logic in `assets/ENEMY_JS/script.js` (or factory) to create the new enemy and set its sprite size, hitbox size, stats, and image.
- [ ] Add asset `<img>` tag (sprite sheet) in `index.html` with the correct `id` used by the enemy class.
- [ ] Quick test: load `index.html`, verify spawning, collisions, damage, death animation.
