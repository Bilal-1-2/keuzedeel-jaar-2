// explosion.js - ONLY Explosion class
class Explosion {
  constructor(x, y, scale = 1.0, speed = 80) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.speed = speed;
    this.totalFrames = 27;

    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.frames = new Array(this.totalFrames);
    this.currentFrame = 0;
    this.isPlaying = false;
    this.isLoaded = false;
    this.loadedCount = 0;
    this.lastUpdate = 0;

    this.loadImages();
  }

  loadImages() {
    for (let i = 1; i <= this.totalFrames; i++) {
      const img = new Image();
      const frameIndex = i - 1;
      const frameName = `Sek_${("0000" + i).slice(-5)}.png`;

      img.onload = () => {
        this.frames[frameIndex] = img;
        this.loadedCount++;

        if (this.loadedCount === this.totalFrames) {
          this.isLoaded = true;
          this.start();
        }
      };

      img.onerror = () => {
        console.warn(`Failed to load: ${frameName}`);
        this.loadedCount++;

        // Create placeholder
        const canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#333";
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = "#fff";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText(i.toString(), 50, 60);

        const placeholder = new Image();
        placeholder.src = canvas.toDataURL();
        this.frames[frameIndex] = placeholder;

        if (this.loadedCount === this.totalFrames) {
          this.isLoaded = true;
          this.start();
        }
      };

      img.src = `assets/effects/flame1/images/${frameName}`;
    }
  }

  start() {
    if (!this.isLoaded) return;
    this.isPlaying = true;
    this.currentFrame = 0;
    this.lastUpdate = Date.now();
    this.draw();
  }

  update() {
    if (!this.isPlaying || !this.isLoaded) return false;

    const now = Date.now();
    if (now - this.lastUpdate >= this.speed) {
      this.currentFrame++;
      this.lastUpdate = now;

      if (this.currentFrame >= this.totalFrames) {
        this.isPlaying = false;
        return false;
      }
    }
    return true;
  }

  draw() {
    if (!this.isPlaying || !this.isLoaded) return;

    const frame = this.frames[this.currentFrame];
    if (!frame) return;

    const progress = this.currentFrame / this.totalFrames;
    const sizeMultiplier = 0.3 + progress * 1.7;
    const width = frame.width * this.scale * sizeMultiplier;
    const height = frame.height * this.scale * sizeMultiplier;
    const x = this.x - width / 2;
    const y = this.y - height / 2;

    this.ctx.drawImage(frame, x, y, width, height);
  }
}

// Create explosion function
function createExplosion() {
  const canvas = document.getElementById("gameCanvas");
  const x = Math.random() * (canvas.width - 200) + 100;
  const y = Math.random() * (canvas.height - 200) + 100;
  const scale = 0.5 + Math.random() * 1.0;
  const speed = 50 + Math.random() * 100;

  const explosion = new Explosion(x, y, scale, speed);

  // Use AnimationManager to add it
  if (typeof AnimationManager !== "undefined") {
    AnimationManager.add(explosion, "explosions");
  }
}

// Make available globally
window.Explosion = Explosion;
window.createExplosion = createExplosion;
