export  class Enemy {
  constructor(x, y, width = 64, height = 104) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.exists = true;
    this.health = 100;
    this.isDead = false;
  }

  update() {
    // placeholder for future AI/movement
  }

  draw(ctx) {

    
    if (!this.exists) return;

    // rectangle in the middle of the map
    ctx.save();
    ctx.fillStyle = "#ff3b3b";
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(this.x, this.y - 10, this.width, 6);

    const hp = Math.max(0, this.health);
    const pct = hp / 100;
    ctx.fillStyle = pct > 0.5 ? "#00ff66" : pct > 0.25 ? "#ffcc00" : "#ff0000";
    ctx.fillRect(this.x, this.y - 10, this.width * pct, 6);

    ctx.restore();  

  }

  getHitbox() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height,
    };
  }

  takeDamage(amount) {
    if (!this.exists || this.isDead) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.exists = false;
    }
  }
}
