// Centralized input module. Forwards keyboard and mouse events to the
// currently-active soldier stored in `GameState.currentSoldier`.
import { GameState } from "./state.js";

function forward(methodName, event) {
  const s = GameState && GameState.currentSoldier;
  if (s && typeof s[methodName] === "function") {
    try {
      s[methodName](event);
    } catch (err) {
      console.error(`Error in ${methodName}:`, err);
    }
  }
}

function initInputBindings() {
  document.addEventListener("keydown", (e) => forward("handleKeyDown", e));
  document.addEventListener("keyup", (e) => forward("handleKeyUp", e));

  const canvas = document.getElementById("gameCanvas");
  if (canvas) {
    canvas.addEventListener("mousedown", (e) => forward("handleMouseDown", e));
    canvas.addEventListener("mouseup", (e) => forward("handleMouseUp", e));
    canvas.addEventListener("mousemove", (e) => forward("handleMouseMove", e));
  } else {
    console.warn("[input.js] No #gameCanvas found — mouse events not bound.");
  }
}

// Initialize on import for convenience; consumer may call `initInputBindings` manually if needed.
initInputBindings();

export { initInputBindings };
