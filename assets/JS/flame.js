// flame.js - ONLY Flame class
class Flame {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.frames = [];
    this.currentFrame = 0;
    this.totalFrames = 35;
    this.isPlaying = false;
    this.isLoaded = false;
    this.loadedCount = 0;
    this.lastUpdate = 0;

    this.loadImages();
  }

  loadImages() {
    for (let i = 1; i <= this.totalFrames; i++) {
      const img = new Image();
      const index = i - 1;

      img.onload = () => {
        this.frames[index] = img;
        this.loadedCount++;
        if (this.loadedCount === this.totalFrames) {
          this.isLoaded = true;
          this.start();
        }
      };

      img.src = `assets/effects/flame4/image/2Me_VFX${i.toString().padStart(4, "0")}.png`;
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
    if (now - this.lastUpdate >= 100) {
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

    const width = frame.width;
    const height = frame.height;
    const x = this.x - width / 2;
    const y = this.y - height / 2;

    this.ctx.drawImage(frame, x, y, width, height);
  }
}

// Create flame function
function createFlame() {
  const canvas = document.getElementById("gameCanvas");
  const x = Math.random() * (canvas.width - 200) + 100;
  const y = Math.random() * (canvas.height - 200) + 100;

  const flame = new Flame(x, y);

  // Use AnimationManager to add it
  if (typeof AnimationManager !== "undefined") {
    AnimationManager.add(flame, "flames");
  }
}

// Make available globally
window.Flame = Flame;
window.createFlame = createFlame;
