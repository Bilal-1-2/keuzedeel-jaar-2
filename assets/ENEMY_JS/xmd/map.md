# Adding a Camera System and World Boundaries to Your Game

## Overview
This guide will help you create a scrolling world with boundaries. The camera will follow the player only when they get within 20% of the screen edges, creating a smooth exploration experience.

## Step 1: Add Camera and World Variables to `script.js`

Add these variables at the top of your `script.js` file, right after the existing variable declarations:

```javascript
let grenades = [];
let bullets = [];
let background;

// CAMERA SYSTEM - Add these new variables
let cameraX = 0;        // Camera position in the world (X-axis)
let cameraY = 0;        // Camera position in the world (Y-axis)

// WORLD BOUNDARIES - Define your map size
const worldWidth = 3000;   // Total world width (adjust as needed)
const worldHeight = 500;   // World height (same as canvas)

// SCREEN EDGE THRESHOLDS - When to start moving the camera
const edgeThreshold = 0.2;     // 20% from screen edges
const leftEdge = edgeThreshold;      // Left boundary (20%)
const rightEdge = 1 - edgeThreshold; // Right boundary (80%)