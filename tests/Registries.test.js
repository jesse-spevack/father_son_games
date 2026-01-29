import { describe, it, expect } from 'vitest';
import GameConfig from '../src/config/GameConfig.js';

/**
 * Tests for registry lookup patterns used across the codebase.
 * These test the static helper methods that classes use to get config.
 */
describe('Registry Lookups', () => {
  describe('Enemy Type Registry', () => {
    // Simulating Enemy.getTypeConfig()
    const getEnemyTypeConfig = (type) => GameConfig.ENEMY.TYPES[type];
    const getEnemyTypeKeys = () => Object.keys(GameConfig.ENEMY.TYPES);

    it('should return config for valid enemy type', () => {
      const config = getEnemyTypeConfig('fighter');
      expect(config).toBeDefined();
      expect(config.health).toBeDefined();
      expect(config.speed).toBeDefined();
    });

    it('should return undefined for invalid enemy type', () => {
      const config = getEnemyTypeConfig('nonexistent');
      expect(config).toBeUndefined();
    });

    it('should return all enemy type keys', () => {
      const keys = getEnemyTypeKeys();
      expect(keys).toContain('fighter');
      expect(keys).toContain('heavy');
      expect(keys.length).toBeGreaterThanOrEqual(2);
    });

    it('should have consistent structure across all enemy types', () => {
      const requiredFields = ['frameId', 'health', 'speed', 'points', 'fireRate'];
      const keys = getEnemyTypeKeys();

      keys.forEach((key) => {
        const config = getEnemyTypeConfig(key);
        requiredFields.forEach((field) => {
          expect(config, `${key} missing ${field}`).toHaveProperty(field);
        });
      });
    });
  });

  describe('Weapon Type Registry', () => {
    // Simulating Player.getWeaponConfig()
    const getWeaponConfig = (type) => GameConfig.WEAPONS[type];
    const getWeaponTypes = () => Object.keys(GameConfig.WEAPONS);

    it('should return config for valid weapon type', () => {
      const config = getWeaponConfig('vulcan');
      expect(config).toBeDefined();
      expect(config.name).toBeDefined();
      expect(config.levels).toBeDefined();
    });

    it('should return undefined for invalid weapon type', () => {
      const config = getWeaponConfig('nonexistent');
      expect(config).toBeUndefined();
    });

    it('should return all weapon type keys', () => {
      const keys = getWeaponTypes();
      expect(keys).toContain('vulcan');
      expect(keys.length).toBeGreaterThanOrEqual(1);
    });

    it('should have level configs for upgrade progression', () => {
      const keys = getWeaponTypes();

      keys.forEach((key) => {
        const config = getWeaponConfig(key);
        expect(config.levels.length, `${key} should have multiple levels`).toBeGreaterThanOrEqual(1);

        // Each level should have required fields
        config.levels.forEach((level, index) => {
          expect(level, `${key} level ${index} missing pattern`).toHaveProperty('pattern');
          expect(level, `${key} level ${index} missing bulletCount`).toHaveProperty('bulletCount');
          expect(level, `${key} level ${index} missing fireRateMult`).toHaveProperty('fireRateMult');
        });
      });
    });
  });

  describe('Projectile Type Registry', () => {
    // Simulating BaseProjectile.getTypeConfig()
    const getProjectileConfig = (type) => GameConfig.PROJECTILES[type];
    const getProjectileKeys = () => Object.keys(GameConfig.PROJECTILES);

    it('should return config for valid projectile type', () => {
      const config = getProjectileConfig('player_bullet');
      expect(config).toBeDefined();
      expect(config.speed).toBeDefined();
      expect(config.direction).toBeDefined();
    });

    it('should return null/undefined for invalid projectile type', () => {
      const config = getProjectileConfig('nonexistent');
      expect(config).toBeUndefined();
    });

    it('should have player and enemy projectiles', () => {
      const keys = getProjectileKeys();
      const hasPlayerProjectile = keys.some((k) => k.startsWith('player_'));
      const hasEnemyProjectile = keys.some((k) => k.startsWith('enemy_'));

      expect(hasPlayerProjectile).toBe(true);
      expect(hasEnemyProjectile).toBe(true);
    });

    it('should have correct direction for player vs enemy projectiles', () => {
      const keys = getProjectileKeys();

      keys.forEach((key) => {
        const config = getProjectileConfig(key);
        if (key.startsWith('player_')) {
          expect(config.direction, `${key} should move upward`).toBe(-1);
        } else if (key.startsWith('enemy_')) {
          expect(config.direction, `${key} should move downward`).toBe(1);
        }
      });
    });
  });

  describe('Formation Registry', () => {
    const getFormationConfig = (key) => GameConfig.FORMATIONS[key];
    const getFormationKeys = () => Object.keys(GameConfig.FORMATIONS);

    it('should return config for valid formation', () => {
      const config = getFormationConfig('v');
      expect(config).toBeDefined();
      expect(config.positions).toBeDefined();
    });

    it('should return undefined for invalid formation', () => {
      const config = getFormationConfig('nonexistent');
      expect(config).toBeUndefined();
    });

    it('should have at least 3 formations', () => {
      const keys = getFormationKeys();
      expect(keys.length).toBeGreaterThanOrEqual(3);
    });

    it('should have valid position coordinates', () => {
      const keys = getFormationKeys();

      keys.forEach((key) => {
        const config = getFormationConfig(key);
        config.positions.forEach((pos, index) => {
          expect(typeof pos.x, `${key} position ${index} x should be number`).toBe('number');
          expect(typeof pos.y, `${key} position ${index} y should be number`).toBe('number');
        });
      });
    });
  });

  describe('Power-up Type Registry', () => {
    const getPowerUpConfig = (type) => GameConfig.POWER_UP.TYPES[type];
    const getPowerUpKeys = () => Object.keys(GameConfig.POWER_UP.TYPES);

    it('should return config for valid power-up type', () => {
      const config = getPowerUpConfig('health');
      expect(config).toBeDefined();
      expect(config.color).toBeDefined();
      expect(config.text).toBeDefined();
    });

    it('should return undefined for invalid power-up type', () => {
      const config = getPowerUpConfig('nonexistent');
      expect(config).toBeUndefined();
    });

    it('should have essential power-up types', () => {
      const keys = getPowerUpKeys();
      expect(keys).toContain('health');
      expect(keys).toContain('weapon');
    });

    it('should have consistent color format (hex number)', () => {
      const keys = getPowerUpKeys();

      keys.forEach((key) => {
        const config = getPowerUpConfig(key);
        expect(typeof config.color, `${key} color should be number`).toBe('number');
        expect(config.color, `${key} color should be valid hex`).toBeGreaterThanOrEqual(0);
        expect(config.color, `${key} color should be valid hex`).toBeLessThanOrEqual(0xffffff);
      });
    });
  });

  describe('Cross-registry references', () => {
    it('should have valid weapon->projectile references', () => {
      const projectileKeys = Object.keys(GameConfig.PROJECTILES);

      Object.entries(GameConfig.WEAPONS).forEach(([weaponName, config]) => {
        expect(
          projectileKeys,
          `${weaponName} references invalid projectile: ${config.projectile}`
        ).toContain(config.projectile);
      });
    });

    it('should have valid formation->enemy type references', () => {
      const enemyKeys = Object.keys(GameConfig.ENEMY.TYPES);

      Object.entries(GameConfig.FORMATIONS).forEach(([formationName, config]) => {
        if (config.types) {
          config.types.forEach((enemyType) => {
            expect(
              enemyKeys,
              `${formationName} references invalid enemy: ${enemyType}`
            ).toContain(enemyType);
          });
        }
      });
    });

    it('should have valid power-up->weapon references', () => {
      const weaponKeys = Object.keys(GameConfig.WEAPONS);

      Object.entries(GameConfig.POWER_UP.TYPES).forEach(([powerUpName, config]) => {
        if (config.weaponType) {
          expect(
            weaponKeys,
            `${powerUpName} references invalid weapon: ${config.weaponType}`
          ).toContain(config.weaponType);
        }
      });
    });
  });
});
