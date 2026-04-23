export default class InputHandler {
  constructor() {
    this.lastKey = "";
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      ctrl: false,
    };
    this.toggles = {
      walkMode: false,
    };
    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "a":
        case "A":
          this.keys.left = true;
          this.lastKey = "PRESS left";
          break;
        case "d":
        case "D":
          this.keys.right = true;
          this.lastKey = "PRESS right";
          break;
        case "r":
        case "R":
          this.keys.down = true;
          this.lastKey = "PRESS reload";
          break;
        case "w":
        case "W":
        case " ":
          this.keys.up = true;
          this.lastKey = "PRESS up";
          break;
        case "Control":
          e.preventDefault(); // Prevent browser menu
          // Only toggle on keydown, not while held
          if (!this.keys.ctrlWasPressed) {
            this.toggles.walkMode = !this.toggles.walkMode;
            this.lastKey = this.toggles.walkMode
              ? "PRESS walkMode"
              : "PRESS runMode";
          }
          this.keys.ctrlWasPressed = true;
          break;
        case "g":
        case "G":
          this.keys.g = true;
          this.lastKey = "PRESS G";
          break;
      }
    });
    window.addEventListener("keyup", (e) => {
      switch (e.key) {
        case "a":
        case "A":
          this.keys.left = false;
          this.lastKey = "RELEASE left";
          break;
        case "d":
        case "D":
          this.keys.right = false;
          this.lastKey = "RELEASE right";
          break;
        case "r":
        case "R":
          this.keys.down = false;
          this.lastKey = "RELEASE reload";
          break;

        case "w":
        case "W":
        case " ":
          this.keys.up = false;
          this.lastKey = "RELEASE up";
          break;
        case "Control":
          this.keys.ctrlWasPressed = false;

          break;
        case "g":
        case "G":
          this.keys.g = true;
          this.lastKey = "RELEASE G";
          break;
      }
    });
  }
}
