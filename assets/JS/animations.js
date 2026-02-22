// animations.js - FIXED VERSION with Background
const animations = {
  explosions: [],
  flames: [],
  soldiers: [],
};

let animationLoopId = null;
let backgroundImage = null;
let backgroundLoaded = false;

// Animation Manager Class
class AnimationManager {
  static add(animation, type) {
    if (animations[type]) {
      // LIMIT: Don't allow more than 5 soldiers
      if (type === "soldiers" && animations[type].length >= 5) {
        console.warn("⚠️ Too many soldiers, removing oldest");
        const removed = animations[type].shift();
        if (removed && removed.cleanup) removed.cleanup();
      }

      animations[type].push(animation);

      // Start loop ONLY if not already running
      if (!animationLoopId) {
        console.log(`Starting animation loop for ${type}`);
        AnimationManager.startLoop();
      }
    }
  }

  static loadBackground() {
    backgroundImage = new Image();

    backgroundImage.onload = function () {
      backgroundLoaded = true;
      console.log("✅ Background image loaded successfully");
    };

    backgroundImage.onerror = function () {
      console.error("❌ Failed to load background image");
      backgroundLoaded = false;
    };

    backgroundImage.src = "assets/backgrounds/winter2/3/10.png";
  }

  static startLoop() {
    if (!animationLoopId) {
      console.log("🔄 Starting main animation loop");
      animationLoopId = requestAnimationFrame(() =>
        AnimationManager.gameLoop(),
      );
    }
  }

  static gameLoop() {
    // Safety check
    if (!animationLoopId) return;

    const canvas = document.getElementById("gameCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Draw background FIRST
    if (backgroundLoaded && backgroundImage) {
      // Draw the loaded image
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
      // Fallback to white background while image loads
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Check ALL animation types
    Object.keys(animations).forEach((type) => {
      const animList = animations[type];

      if (animList.length > 0) {
        for (let i = animList.length - 1; i >= 0; i--) {
          const anim = animList[i];

          if (anim.isPlaying) {
            const active = anim.update();
            if (active) {
              anim.draw();
            } else {
              animList.splice(i, 1);
            }
          } else if (anim.isLoaded) {
            // Draw loading animations too
            anim.draw();
          }
        }
      }
    });

    // Draw counters with dark text for white background
    // ctx.fillStyle = "#333333";
    // ctx.font = "16px Arial";
    // ctx.fillText(`Explosions: ${animations.explosions.length}`, 20, 30);
    // ctx.fillText(`Flames: ${animations.flames.length}`, 20, 50);
    // ctx.fillText(`Soldiers: ${animations.soldiers.length}`, 20, 70);

    // If ANY animations exist, keep looping
    const totalAnimations = Object.values(animations).reduce(
      (total, list) => total + list.length,
      0,
    );

    if (totalAnimations > 0) {
      animationLoopId = requestAnimationFrame(() =>
        AnimationManager.gameLoop(),
      );
    } else {
      console.log("⏹️ Stopping animation loop - no animations");
      animationLoopId = null;
    }
  }

  static clearAll() {
    // Cleanup each animation first
    Object.keys(animations).forEach((type) => {
      animations[type].forEach((anim) => {
        if (anim && anim.cleanup) anim.cleanup();
      });
      animations[type] = [];
    });

    // Stop loop
    if (animationLoopId) {
      cancelAnimationFrame(animationLoopId);
      animationLoopId = null;
    }

    // Clear canvas
    const canvas = document.getElementById("gameCanvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Reset canvas to clear GPU memory
      canvas.width = canvas.width;
    }
  }
}

// Nuclear cleanup on page unload
window.addEventListener("beforeunload", () => {
  console.log("☢️ Nuclear cleanup starting...");

  // 1. Cancel animation loop FIRST
  if (animationLoopId) {
    cancelAnimationFrame(animationLoopId);
    animationLoopId = null;
  }

  // 2. Clear all animation arrays
  Object.keys(animations).forEach((key) => {
    animations[key] = [];
  });

  // 3. Nullify ALL global references
  const globalsToClear = [
    "currentSoldier",
    "Soldier",
    "createSoldier",
    "toggleSoldierRun",
    "AnimationManager",
    "KeyboardManager",
    "soldierCount",
  ];

  globalsToClear.forEach((global) => {
    try {
      delete window[global];
    } catch (e) {
      window[global] = null;
    }
  });

  // 4. Clear any canvas contexts
  const canvas = document.getElementById("gameCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  console.log("✅ Cleanup complete");
});

// ⭐ AUTO-START: Start loop immediately when page loads
window.addEventListener("load", () => {
  console.log("🚀 Animation Manager loaded and ready!");

  // Load background image
  AnimationManager.loadBackground();

  // Create a hidden dummy animation to kickstart the loop
  setTimeout(() => {
    if (!animationLoopId) {
      console.log("⚡ Auto-starting animation loop");
      AnimationManager.startLoop();
    }
  }, 500);
});

window.AnimationManager = AnimationManager;
