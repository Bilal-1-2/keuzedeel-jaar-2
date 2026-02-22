// Adapted Sprite class for standard browser canvas
var Sprite = (function () {
  function Sprite(options) {
    options = Object.assign(
      {
        spriteSheetURL:
          "https://codehs.com/uploads/72e9b6f60ac412f32a2fd3a955990c3b",
        spriteWidth: 13,
        spriteHeight: 14,
        nRows: 2,
        nCols: 3,
        borderWidth: 1,
        spacingWidth: 1,
        scale: 5,
        x: 0,
        y: 0,
      },
      options
    );
    this.x = options.x;
    this.y = options.y;
    this.frames = [];
    this.animations = {};
    this.activeAnimationStep = 0;
    this.spriteWidth = options.spriteWidth;
    this.spriteHeight = options.spriteHeight;
    this.nRows = options.nRows;
    this.nCols = options.nCols;
    this.borderWidth = options.borderWidth;
    this.spacingWidth = options.spacingWidth;
    this.scale = options.scale;
    this.canvas = document.getElementById("gameCanvas");
    this.context = this.canvas.getContext("2d");
    this.context.imageSmoothingEnabled = false;

    var spriteSheetImage = new Image();
    spriteSheetImage.src = options.spriteSheetURL;
    spriteSheetImage.crossOrigin = true;
    spriteSheetImage.onload = function () {
      for (var row = 0; row < this.nRows; row++) {
        for (var col = 0; col < this.nCols; col++) {
          var frame = {
            x: this.borderWidth + col * (this.spacingWidth + this.spriteWidth),
            y: this.borderWidth + row * (this.spacingWidth + this.spriteHeight),
            width: this.spriteWidth,
            height: this.spriteHeight,
          };
          this.frames.push(frame);
        }
      }
      this.activeFrame = this.frames[0];
      this.ready();
    }.bind(this);
  }

  Sprite.prototype.ready = function () {
    if (typeof this.onReady === "function") {
      this.onReady(this);
    }
  };

  Sprite.prototype.onReady = function (handler) {
    this.onReady = handler;
  };

  Sprite.prototype.draw = function () {
    var spriteSheetImage = new Image();
    spriteSheetImage.src = this.spriteSheetURL;
    spriteSheetImage.crossOrigin = true;
    this.context.drawImage(
      spriteSheetImage,
      this.activeFrame.x,
      this.activeFrame.y,
      this.activeFrame.width,
      this.activeFrame.height,
      this.x,
      this.y,
      this.spriteWidth * this.scale,
      this.spriteHeight * this.scale
    );
  };

  Sprite.prototype.setPosition = function (x, y) {
    this.x = x;
    this.y = y;
  };

  Sprite.prototype.move = function (dx, dy) {
    this.x += dx;
    this.y += dy;
  };

  Sprite.prototype.addAnimation = function (options) {
    options = Object.assign(
      {
        name: "idle",
        frameIndices: [0],
        timePerFrame: 250,
        onEnd: "repeat",
      },
      options
    );
    this.animations[options.name] = {
      frameIndices: options.frameIndices,
      timePerFrame: options.timePerFrame,
      onEnd: options.onEnd,
    };
  };

  Sprite.prototype.animate = function (animationName, smoothStep) {
    var animation = this.animations[animationName];
    if (animation === undefined) {
      return;
    }
    this.activeAnimation = animation;
    this.activeAnimationStep =
      smoothStep &&
      this.activeAnimationStep < this.activeAnimation.frameIndices.length
        ? this.activeAnimationStep
        : 0;
    this.clearAnimation();
    this.advanceFrame();
    this.activeAnimationID = setInterval(
      function () {
        this.advanceFrame();
      }.bind(this),
      animation.timePerFrame
    );
  };

  Sprite.prototype.advanceFrame = function () {
    if (this.activeAnimationStep >= this.activeAnimation.frameIndices.length) {
      if (this.activeAnimation.onEnd === "repeat") {
        this.activeAnimationStep = 0;
      } else {
        this.clearAnimation();
      }
    }
    var frameIndex =
      this.activeAnimation.frameIndices[this.activeAnimationStep];
    this.activeFrame = this.frames[frameIndex];
    this.activeAnimationStep += 1;
  };

  Sprite.prototype.clearAnimation = function () {
    clearInterval(this.activeAnimationID);
    this.activeAnimationID = -1;
  };

  return Sprite;
})();

// EXAMPLE!
var sprite = new Sprite({
  spriteSheetURL: "https://codehs.com/uploads/72e9b6f60ac412f32a2fd3a955990c3b",
  nRows: 2,
  nCols: 3,
  spriteWidth: 13,
  spriteHeight: 14,
  borderWidth: 1,
  spacingWidth: 1,
  x: 400 - (13 * 5) / 2, // Center horizontally
  y: 300 - (14 * 5) / 2, // Center vertically
});

sprite.onReady(function () {
  sprite.addAnimation({
    name: "walkright",
    frameIndices: [0, 1, 2, 1],
  });
  sprite.addAnimation({
    name: "walkleft",
    frameIndices: [3, 4, 5, 4],
  });

  startLoop();
});

function startLoop() {
  var velocity = 1;
  sprite.animate("walkright");

  function gameLoop() {
    // Clear canvas
    sprite.context.clearRect(0, 0, sprite.canvas.width, sprite.canvas.height);

    // Draw sprite
    sprite.draw();

    // Draw explosions
    if (window.explosions) {
      window.explosions.forEach(function (exp) {
        exp.draw();
      });
      // Remove finished explosions
      window.explosions = window.explosions.filter(function (exp) {
        return exp.activeAnimationID !== null;
      });
    }

    // Update position
    if (sprite.x + sprite.spriteWidth * sprite.scale >= sprite.canvas.width) {
      velocity = -1;
      sprite.animate("walkleft", true);
    }
    if (sprite.x <= 0) {
      velocity = 1;
      sprite.animate("walkright", true);
    }
    sprite.move(velocity, 0);

    requestAnimationFrame(gameLoop);
  }

  gameLoop();
}
