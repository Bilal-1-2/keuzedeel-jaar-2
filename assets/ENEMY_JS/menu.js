import { listLevels } from "./levels.js";

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
