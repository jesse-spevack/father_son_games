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

  BOSS: {
    // Core stats
    MAX_HEALTH: 300,
    POINTS: 5000,
    COLLISION_DAMAGE: 50, // damage to player on body collision

    // Movement
    SPEED: 80, // side-to-side movement speed
    ENTER_SPEED: 100, // speed when entering screen
    Y_POSITION: 80, // anchor position from top of screen
    MOVEMENT_RANGE: 150, // pixels left/right from center

    // Spawn timing
    SPAWN_INTERVAL: 120000, // 2 minutes between bosses
    FIRST_SPAWN_DELAY: 30000, // 30 seconds before first boss

    // Phase thresholds (percentage of max health)
    PHASE_2_THRESHOLD: 0.66,
    PHASE_3_THRESHOLD: 0.33,

    // Attack cooldowns (ms)
    SPRAY_COOLDOWN: 2000,
    AIMED_COOLDOWN: 1500,
    SUMMON_COOLDOWN: 5000,

    // Phase 3 speed multiplier (faster attacks)
    PHASE_3_SPEED_MULT: 0.5,

    // Spray attack
    SPRAY_BULLET_COUNT: 7,
    SPRAY_ANGLE: 90, // degrees spread
    SPRAY_BULLET_SPEED: 280,

    // Aimed attack
    AIMED_BULLET_COUNT: 3,
    AIMED_BULLET_SPEED: 320,

    // Ring attack (phase 3 only)
    RING_COOLDOWN: 3000,
    RING_BULLET_COUNT: 12,
    RING_BULLET_SPEED: 200,

    // Summon counts per phase
    SUMMON_FIGHTERS: 3,
    SUMMON_HEAVIES: 2,

    // Rewards
    REWARD_EXTRA_LIFE: true,
    REWARD_POWER_UP: true,
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

  POWER_UP: {
    DROP_CHANCE: 0.18, // 18% chance on enemy death
    SPEED: 50, // drift downward speed
    LIFETIME: 10000, // ms before disappearing
    POOL_SIZE: 10,

    // Types and their effects
    HEALTH: {
      COLOR: 0x00ff00, // green
      RESTORE_AMOUNT: 25,
    },
    WEAPON: {
      COLOR: 0xff0000, // red
      MAX_LEVEL: 3,
      FIRE_RATE_MULT: [1, 0.75, 0.5], // multiplier per level
      BULLET_COUNT: [1, 2, 3], // bullets per shot per level
    },
    SPEED_BOOST: {
      COLOR: 0x0088ff, // blue
      SPEED_MULT: 1.5,
      DURATION: 8000, // ms
    },
    SHIELD: {
      COLOR: 0xaa44ff, // purple
      DURATION: 4000, // ms
    },
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
