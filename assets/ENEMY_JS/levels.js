// Central place to define each level's background, world size, and enemies.
// Add a new level by adding a new entry here, plus the matching <img> tags
// in your HTML for that level's background layers.

export const levels = {
  winter1: {
    displayName: "Winter Outpost",
    nextLevel: "winter2",
    worldWidth: 8000,
    background: {
      width: 1667,
      height: 786,
      layers: [
        { elementId: "layer1", speedModifier: 0 },
        { elementId: "layer2", speedModifier: 0.001 },
        { elementId: "layer3", speedModifier: 0.09 },
        { elementId: "layer4", speedModifier: 0.6 },
        { elementId: "layer5", speedModifier: 0.4 },
        { elementId: "layer6", speedModifier: 0.65 },
        { elementId: "layer7", speedModifier: 0.65 },
        { elementId: "layer8", speedModifier: 1 },
        { elementId: "layer9", speedModifier: 0.85 },
      ],
    },
    // Where each enemy should spawn for this level.
    // "type" must match a key in the enemySpawners map in script.js.
    enemySpawns: [
      { type: "iceSkeleton", x: 1600 },
      { type: "iceSkeleton", x: 2400 },
      { type: "iceSkeleton", x: 2600 },
      { type: "iceSkeleton", x: 2800 },
      { type: "icebull", x: 3700 },
      { type: "iceSkeleton", x: 3400 },
      { type: "icebull", x: 7600 },
      { type: "iceSkeleton", x: 6400 },
      { type: "iceSkeleton", x: 6600 },
      { type: "iceSkeleton", x: 6900 },
    ],
  },

  // Example second level - swap in different <img> elements/ids in your
  // HTML (e.g. layer1_cave, layer2_cave, ...) and reference them here.
  winter2: {
    displayName: "Frozen Pass",
    nextLevel: null,
    worldWidth:7000,
    background: {
      width: 1667,
      height: 786,
      layers: [
        { elementId: "winter_layer1", speedModifier: 0 },
        { elementId: "winter_layer2", speedModifier: 0.2 },
        { elementId: "winter_layer3", speedModifier: 0.4 },
      ],
    },
    enemySpawns: [
      { type: "iceSkeleton", x: 1200 },
      { type: "iceSkeleton", x: 1400 },
      { type: "iceSkeleton", x: 2200 },
      { type: "iceSkeleton", x: 2400 },
      { type: "iceSkeleton", x: 2800 },
      { type: "icebull", x: 3700 },
      { type: "iceSkeleton", x: 3400 },
      { type: "icebull", x: 5600 },
      { type: "iceSkeleton", x: 6400 },
      { type: "iceSkeleton", x: 6600 },
      { type: "iceSkeleton", x: 6800 },
    ],
  },
};

export function getLevel(levelKey) {
  const level = levels[levelKey];
  if (!level) {
    console.warn(
      `[levels] Unknown level "${levelKey}", falling back to first level.`,
    );
    return Object.values(levels)[0];
  }
  return level;
}

// For the level-select menu: list of { key, displayName } pairs.
export function listLevels() {
  return Object.entries(levels).map(([key, level]) => ({
    key,
    displayName: level.displayName ?? key,
  }));
}
