import { GameState } from "./state.js";

// Simple debug overlay: FPS and basic soldier state
const overlay = document.createElement("div");
overlay.id = "debug-overlay";
Object.assign(overlay.style, {
  position: "fixed",
  left: "8px",
  top: "8px",
  padding: "8px 10px",
  background: "rgba(0,0,0,0.7)",
  color: "#0f0",
  fontFamily: "monospace",
  fontSize: "12px",
  zIndex: 2000,
  borderRadius: "6px",
  maxWidth: "320px",
  lineHeight: "1.3",
});

const toggleBtn = document.createElement("button");
toggleBtn.textContent = "Debug";
Object.assign(toggleBtn.style, {
  position: "absolute",
  right: "6px",
  top: "6px",
  background: "#111",
  color: "#0f0",
  border: "1px solid #0f0",
  padding: "2px 6px",
  cursor: "pointer",
});

let visible = true;
toggleBtn.addEventListener("click", () => {
  visible = !visible;
  content.style.display = visible ? "block" : "none";
});

// Keyboard toggle (F1)
document.addEventListener("keydown", (e) => {
  if (e.key === "F1") {
    visible = !visible;
    content.style.display = visible ? "block" : "none";
    e.preventDefault();
  }
});

overlay.appendChild(toggleBtn);

const content = document.createElement("div");
overlay.appendChild(content);

document.addEventListener("DOMContentLoaded", () => {
  (document.body || document.documentElement).appendChild(overlay);
});

let lastTime = performance.now();
let fps = 0;
let frames = 0;
let lastFpsUpdate = performance.now();

function formatNumber(n, dec = 2) {
  return Math.round(n * Math.pow(10, dec)) / Math.pow(10, dec);
}

function update() {
  const now = performance.now();
  frames++;
  if (now - lastFpsUpdate >= 500) {
    fps = (frames * 1000) / (now - lastFpsUpdate);
    frames = 0;
    lastFpsUpdate = now;
  }

  const gs = GameState || window.GameState || {};
  const s = gs.currentSoldier || window.currentSoldier || null;

  let html = `<div style="margin-bottom:6px"><strong>FPS</strong>: ${formatNumber(fps, 1)}</div>`;
  if (s) {
    // Determine current animation name (approximate)
    let anim = "idle";
    if (s.isMeleeing) anim = "melee";
    else if (s.isReloading) anim = "reload";
    else if (s.isFiring) anim = "fire";
    else if (s.isMoving) anim = s.isRunning ? "run" : "walk";

    const activeFrameIndex =
      s.currentFrame != null ? s.currentFrame : s.fireFrameIndex || 0;
    const totalFrames =
      s.totalFrames || (s.activeFrames && s.activeFrames.length) || 0;

    html += `<div><strong>Soldier</strong>:</div>`;
    html += `<div>x:${formatNumber(s.x, 0)} y:${formatNumber(s.y, 0)} hp:${s.health}/${s.maxHealth}</div>`;
    html += `<div>anim:${anim} frame:${activeFrameIndex}/${totalFrames}</div>`;
    html += `<div>dir:${s.direction === -1 ? "L" : "R"} run:${s.isRunning} moving:${s.isMoving}</div>`;
    html += `<div>speed:${s.speed != null ? formatNumber(s.speed, 1) : "n/a"} currentspeed:${s.currentSpeed != null ? formatNumber(s.currentSpeed, 1) : "n/a"} mouse:${formatNumber(s.mouseX || 0, 0)},${formatNumber(s.mouseY || 0, 0)} firing:${s.isFiring} reloading:${s.isReloading}</div>`;
    html += `<div>mag:${s.bulletsInMagazine}/${s.magazineSize} bullets:${s.bullets ? s.bullets.length : 0} current:${s.current != null ? s.current : "n/a"}</div>`;

    // Show up to 4 bullets detail
    if (s.bullets && s.bullets.length > 0) {
      html += '<div style="margin-top:4px"><strong>Bullets</strong>:</div>';
      const bulletsToShow = s.bullets.slice(0, 4);
      bulletsToShow.forEach((b, i) => {
        html += `<div>${i}: x:${formatNumber(b.x, 1)} y:${formatNumber(b.y, 1)} d:${b.damage || 0}</div>`;
      });
      if (s.bullets.length > 4)
        html += `<div>... +${s.bullets.length - 4} more</div>`;
    }
    // Show firing/reload/melee frame indices if present
    html += '<div style="margin-top:4px">';
    if (s.fireFrameIndex != null) html += `fireFrame:${s.fireFrameIndex} `;
    if (s.reloadFrameIndex != null)
      html += `reloadFrame:${s.reloadFrameIndex} `;
    if (s.meleeFrameIndex != null) html += `meleeFrame:${s.meleeFrameIndex} `;
    html += "</div>";
  } else {
    html += `<div>No soldier</div>`;
  }

  content.innerHTML = html;
  requestAnimationFrame(update);
}

requestAnimationFrame(update);

// expose for debugging
window.DebugOverlay = { overlay };
