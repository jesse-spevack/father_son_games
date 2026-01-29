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

  // Projectile registry - add new weapon types here
  PROJECTILES: {
    player_bullet: {
      texture: 'sprites',
      frame: 'vulcan_1.png',
      speed: 500,
      direction: -1, // upward
    },
    player_laser: {
      texture: 'sprites',
      frame: 'laser_1.png',
      speed: 700,
      direction: -1,
    },
    enemy_bullet: {
      texture: 'sprites',
      frame: 'plasma_1.png',
      speed: 300,
      direction: 1, // downward
    },
    enemy_plasma: {
      texture: 'sprites',
      frame: 'proton_01.png',
      speed: 250,
      direction: 1,
    },
  },

  ENEMY: {
    // Tilt thresholds for visual feedback
    TILT_THRESHOLD_LOW: 30,
    TILT_THRESHOLD_HIGH: 100,

    // Enemy type registry - add new types here
    // frameId corresponds to sprite atlas naming: enemy_{frameId}_{color}_{tilt}.png
    TYPES: {
      fighter: {
        frameId: '1',
        health: 1,
        speed: 150,
        points: 100,
        fireRate: 2000,
      },
      heavy: {
        frameId: '2',
        health: 3,
        speed: 80,
        points: 250,
        fireRate: 1500,
      },
    },
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

  // Formation registry - positions are in unit spacing (multiplied by SHIP_SPACING)
  // Add new formations here - no code changes needed
  FORMATIONS: {
    v: {
      // V-formation: lead ship with two pairs spreading back
      positions: [
        { x: 0, y: 0 },      // Lead
        { x: -1, y: 1 },     // Left wing
        { x: 1, y: 1 },      // Right wing
        { x: -2, y: 2 },     // Far left
        { x: 2, y: 2 },      // Far right
      ],
      types: ['fighter', 'heavy'],
    },
    line: {
      // Horizontal line of 3-5 ships (randomized at spawn)
      positions: [
        { x: -2, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ],
      minShips: 3,
      maxShips: 5,
      types: ['fighter', 'heavy'],
    },
    diamond: {
      // Diamond shape
      positions: [
        { x: 0, y: 0 },      // Top
        { x: -1, y: 1 },     // Left
        { x: 1, y: 1 },      // Right
        { x: 0, y: 2 },      // Bottom
      ],
      types: ['fighter', 'heavy'],
    },
    arrow: {
      // Arrow pointing down
      positions: [
        { x: 0, y: 0 },      // Tip
        { x: -1, y: -1 },    // Left back
        { x: 1, y: -1 },     // Right back
        { x: -2, y: -2 },    // Far left back
        { x: 2, y: -2 },     // Far right back
      ],
      types: ['fighter'],
    },
    box: {
      // Square formation
      positions: [
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        { x: -1, y: 2 },
        { x: 1, y: 2 },
      ],
      types: ['heavy'],
    },
  },

  POWER_UP: {
    DROP_CHANCE: 0.18, // 18% chance on enemy death
    SPEED: 50, // drift downward speed
    LIFETIME: 10000, // ms before disappearing
    POOL_SIZE: 10,

    // Weapon upgrade settings (used by player)
    WEAPON_MAX_LEVEL: 3,
    WEAPON_FIRE_RATE_MULT: [1, 0.75, 0.5],
    WEAPON_BULLET_COUNT: [1, 2, 3],

    // Power-up type registry - add new types here
    TYPES: {
      health: {
        color: 0x00ff00,
        text: '+25 HP',
        textColor: '#00ff00',
        healAmount: 25,
      },
      weapon: {
        color: 0xff6600,
        text: 'WEAPON UP!',
        textColor: '#ff6600',
      },
      speed: {
        color: 0x00aaff,
        text: 'SPEED BOOST!',
        textColor: '#00aaff',
        speedMult: 1.5,
        duration: 8000,
      },
      shield: {
        color: 0xaa44ff,
        text: 'SHIELD!',
        textColor: '#aa44ff',
        duration: 4000,
      },
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
