/**
 * Centralized game configuration and constants.
 * All magic numbers and tunable values should be defined here.
 */
export default {
  PLAYER: {
    SPEED: 300,
    MAX_HEALTH: 100,
    START_LIVES: 3,
    FIRE_RATE: 150, // ms between shots
    INVINCIBILITY_DURATION: 1600, // 100ms * 16 flashes
    TOUCH_DEADZONE: 10, // pixels from player center to ignore touch
  },

  BULLET: {
    SPEED: 500,
    POOL_SIZE: 30,
  },

  ENEMY_BULLET: {
    SPEED: 300,
    POOL_SIZE: 50,
  },

  ENEMY: {
    FIGHTER: {
      HEALTH: 1,
      SPEED: 150,
      POINTS: 100,
      FIRE_RATE: 2000, // ms between shots
    },
    HEAVY: {
      HEALTH: 3,
      SPEED: 80,
      POINTS: 250,
      FIRE_RATE: 1500, // ms between shots
    },
    // Tilt thresholds for visual feedback
    TILT_THRESHOLD_LOW: 30,
    TILT_THRESHOLD_HIGH: 100,
  },

  MINE: {
    SPEED: 60,
    HEALTH: 2,
    DAMAGE: 30,
    POINTS: 50,
    PROXIMITY_RADIUS: 80,
    EXPLOSION_RADIUS_MULTIPLIER: 1.5,
    WAVE_AMPLITUDE_MIN: 30,
    WAVE_AMPLITUDE_MAX: 60,
    WAVE_FREQUENCY_MIN: 2,
    WAVE_FREQUENCY_MAX: 4,
  },

  DIFFICULTY: {
    INTERVAL: 30000, // ms between difficulty increases
    INITIAL_MINE_SPAWN_INTERVAL: 3000,
    MIN_MINE_SPAWN_INTERVAL: 2000,
    MIN_FIRE_RATE: 500, // minimum enemy fire rate at max difficulty
  },

  SPAWNER: {
    INITIAL_SPAWN_INTERVAL: 2000,
    MIN_SPAWN_INTERVAL: 1000,
    MAX_SPAWN_INTERVAL: 3000,
    SPAWN_MARGIN: 60, // keep formations away from edges
    SHIP_SPACING: 50,
    FIGHTER_SPAWN_WEIGHT: 0.7, // 70% chance of fighter vs heavy
  },

  // Screen and visual constants
  DISPLAY: {
    OFFSCREEN_BUFFER: 50, // pixels beyond screen before destroying
    TOUCH_INDICATOR_RADIUS: 20,
    TOUCH_INDICATOR_ALPHA: 0.3,
    DAMAGE_FLASH_DURATION: 100,
    DAMAGE_FLASH_TINT: 0xff0000,
  },
};
