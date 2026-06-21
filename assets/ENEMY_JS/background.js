class Layer {
  constructor(width, height, speedModifier, image) {
    this.width = width;
    this.height = height;
    this.speedModifier = speedModifier;
    this.image = image;
    this.x = 0;
    this.y = 0;
  }

  update(cameraX) {
    // Calculate background position based on camera (creates parallax)
    // The background moves opposite to camera direction
    this.x = -cameraX * this.speedModifier;

    // Wrap around for seamless scrolling
    while (this.x <= -this.width) {
      this.x += this.width;
    }
    while (this.x > 0) {
      this.x -= this.width;
    }
  }

  draw(context) {
    if (!this.image) return;

    context.drawImage(this.image, this.x, this.y, this.width, this.height);

    // Draw a second copy to fill the gap when scrolling
    if (this.x < 0) {
      context.drawImage(
        this.image,
        this.x + this.width,
        this.y,
        this.width,
        this.height,
      );
    }
    // Draw a third copy if needed for very wide screens (left side)
    if (this.x > 0) {
      context.drawImage(
        this.image,
        this.x - this.width,
        this.y,
        this.width,
        this.height,
      );
    }
  }
}

/**
 * Background is now level-agnostic: pass it a `levelConfig` describing
 * which <img> elements to use and how fast each one scrolls.
 *
 * levelConfig shape:
 * {
 *   width: 1667,            // image width in px
 *   height: 786,            // image height in px
 *   layers: [
 *     { elementId: "layer1", speedModifier: 0 },     // farthest, barely moves
 *     { elementId: "layer2", speedModifier: 0.09 },
 *     ...
 *     { elementId: "layer9", speedModifier: 0.85 },  // closest, fastest
 *   ],
 * }
 *
 * Different levels can point at different <img> elements (different art),
 * use more or fewer layers, and tune speeds independently - see
 * levels.js for ready-made configs and how to switch between them.
 */
export class Background {
  constructor(levelConfig) {
    this.setLevel(levelConfig);
  }

  // Swap to a new level's background without creating a new Background
  // instance - useful when the game transitions between levels.
  setLevel(levelConfig) {
    this.width = levelConfig.width;
    this.height = levelConfig.height;

    this.backgroundLayers = levelConfig.layers.map((layerConfig) => {
      const image = document.getElementById(layerConfig.elementId);
      if (!image) {
        console.warn(
          `[Background] No <img> found with id "${layerConfig.elementId}" - this layer will be blank.`,
        );
      }
      return new Layer(
        this.width,
        this.height,
        layerConfig.speedModifier,
        image,
      );
    });
  }

  update(cameraX) {
    this.backgroundLayers.forEach((layer) => {
      layer.update(cameraX);
    });
  }

  draw(context) {
    this.backgroundLayers.forEach((layer) => {
      layer.draw(context);
    });
  }
}