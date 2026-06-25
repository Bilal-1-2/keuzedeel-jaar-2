import { listLevels } from "./levels.js";

// Shown again whenever the player dies (see showMenu(), wired to
// window so script.js/state.js can call it without importing this
// module directly).
function showMenu(message) {
  const overlay = document.getElementById("menuOverlay");
  if (!overlay) return;

  const subtitle = document.querySelector("#menuOverlay .subtitle");
  if (subtitle) {
    subtitle.textContent = message || "Choose where to drop in.";
  }

  overlay.classList.remove("hidden");
}
window.showMenu = showMenu;

function buildMenu() {
  const levelList = document.getElementById("levelList");
  const overlay = document.getElementById("menuOverlay");

  listLevels().forEach(({ key, displayName }) => {
    const btn = document.createElement("button");
    btn.className = "levelButton";
    btn.type = "button";
    btn.textContent = displayName;
    btn.addEventListener("click", () => {
      if (typeof window.startGame !== "function") {
        console.error(
          "[menu.js] window.startGame is not defined yet - script.js may not have loaded.",
        );
        return;
      }
      window.startGame(key);
      overlay.classList.add("hidden");
    });
    levelList.appendChild(btn);
  });
}

function wireControlsToggle() {
  const toggleBtn = document.getElementById("controlsToggleBtn");
  const panel = document.getElementById("menuControlsPanel");

  toggleBtn.addEventListener("click", () => {
    const isOpen = panel.classList.toggle("open");
    toggleBtn.textContent = isOpen ? "Hide controls" : "Show controls";
  });
}

function wireInGameControlsToggle() {
  const inGamePanel = document.getElementById("inGameControls");

  window.addEventListener("keydown", (e) => {
    if (e.key === "h" || e.key === "H") {
      inGamePanel.classList.toggle("open");
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  buildMenu();
  wireControlsToggle();
  wireInGameControlsToggle();
});
