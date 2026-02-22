# Project Structure — Eigen Game 🔧

## Overview

This file documents the project's structure and where to find or modify major parts of the game. Use this as a quick reference for development and adding assets.

---

## How to run ✅

- Serve the project (it's already in XAMPP `htdocs`).
- Open: `http://localhost/module-6-2-eigen-game/index.html` in your browser.

---

## Top-level files

- `index.html` — Game entry page; loads scripts and canvas.
- `README.md` — Project notes and higher-level instructions.
- `TODO.md` — Tasks and planned work.

---

## `assets/` (main resources) 🔊

- `backgrounds/` — Background images and PSD sources. Organized into themes (`PNG/War1`, `War2`, `winter`, etc.) and includes license/readme files.
- `effects/` — Special effects, Spine/atlas files, JSON animations and PNG sprites. Folders like `flame1`, `flame2`, ... each contain their own `spine` data and images.
- `enemies/` — Enemy assets and associated logic. (Also see `assets/enemies/JS/` for enemy-related scripts.)
- `soldier/` — Soldier character art, PSDs, and related assets.
- `JS/` — Main game scripts (game loop, menus, actor logic). Key scripts include:
  - `main.js` — Main game logic / entry point for gameplay.
  - `menu.js` — Menu and UI logic.
  - `animations.js` — Common animation helpers.
  - `explosion.js` / `flame.js` — Effect logic.
  - `soldier.js` — Player/soldier logic and behaviour (current file being edited).

> Note: Some subsystems also include JS inside nested folders such as `assets/enemies/JS/` depending on how features are grouped.

---

## Where to change things 🔧

- To adjust gameplay, inspect `assets/JS/main.js` and `assets/JS/soldier.js`.
- To add an enemy: add art to `assets/enemies/` and update enemy code in `assets/enemies/JS/` or central scripts.
- To add an effect: place sprites or spine data under `assets/effects/<effect>/` and register/use it in effect scripts.

---

## Licenses & Credits ⚖️

- Many asset folders include `License.txt` or `readme.txt` (e.g., `assets/backgrounds/License.txt`, `assets/effects/License.txt`). Keep these files with any redistributed assets.

---

## Quick tips 💡

- Use the browser dev tools to debug canvas and game state.
- Keep assets organized by theme to avoid duplication.
- If you add Spine/atlas JSON, ensure filenames referenced by code match exactly (case-sensitive in many loaders).

---

If you'd like, I can:

- add a table of contents to this file, or
- generate a visual tree output of the project structure.
