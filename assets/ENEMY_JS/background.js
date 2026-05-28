class Layer {
  constructor(game, width, height, speedModifier, image) {
    this.game = game;
    this.width = width;
    this.height = height;
    this.speedModifier = speedModifier;
    this.image = image;
    this.x = 0;
    this.y = 0;
  }

  // CHANGE THIS METHOD - use camera position instead of game.speed
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
    // Draw the main image
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

export class Background {
  constructor(game) {
    this.game = game;
    this.width = 1667;
    this.height = 786;

    // Get all the different layer images from HTML
    this.layer1Image = document.getElementById("layer1");
    this.layer2Image = document.getElementById("layer2");
    this.layer3Image = document.getElementById("layer3");
    this.layer4Image = document.getElementById("layer4");
    this.layer5Image = document.getElementById("layer5");
    this.layer6Image = document.getElementById("layer6");
    this.layer7Image = document.getElementById("layer7");
    this.layer8Image = document.getElementById("layer8");
    this.layer9Image = document.getElementById("layer9");

    // Create layers with different speed modifiers for parallax effect
    // Farther layers (smaller numbers) move slower
    // Closer layers (larger numbers) move faster
    this.layer1 = new Layer(
      this.game,
      this.width,
      this.height,
      0,
      this.layer1Image,
    ); // farthest
    this.layer2 = new Layer(
      this.game,
      this.width,
      this.height,
      0.001,
      this.layer2Image,
    );
    this.layer3 = new Layer(
      this.game,
      this.width,
      this.height,
      0.09,
      this.layer3Image,
    );
    this.layer4 = new Layer(
      this.game,
      this.width,
      this.height,
      0.6,
      this.layer4Image,
    );
    this.layer5 = new Layer(
      this.game,
      this.width,
      this.height,
      0.4,
      this.layer5Image,
    );
    this.layer6 = new Layer(
      this.game,
      this.width,
      this.height,
      0.65,
      this.layer6Image,
    );
    this.layer7 = new Layer(
      this.game,
      this.width,
      this.height,
      0.65,
      this.layer7Image,
    );
    this.layer8 = new Layer(
      this.game,
      this.width,
      this.height,
      1,
      this.layer8Image,
    );
    this.layer9 = new Layer(
      this.game,
      this.width,
      this.height,
      0.85,
      this.layer9Image,
    ); // closest (fastest)

    this.backgroundLayers = [
      this.layer1,
      this.layer2,
      this.layer3,
      this.layer4,
      this.layer5,
      this.layer6,
      this.layer7,
      this.layer8,
      this.layer9,
    ];
  }

   //  accept cameraX parameter
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

