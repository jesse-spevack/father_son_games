import { describe, it, expect } from 'vitest';
import GameConfig from '../src/config/GameConfig.js';

describe('GameConfig', () => {
  describe('structure', () => {
    it('should have all required top-level sections', () => {
      const requiredSections = [
        'PLAYER',
        'BULLET',
        'ENEMY_BULLET',
        'PROJECTILES',
        'WEAPONS',
        'ENEMY',
        'MINE',
        'BOSS',
        'DIFFICULTY',
        'SPAWNER',
        'FORMATIONS',
        'POWER_UP',
        'DISPLAY',
      ];

      requiredSections.forEach((section) => {
        expect(GameConfig).toHaveProperty(section);
      });
    });
  });

  describe('PLAYER config', () => {
    it('should have valid player stats', () => {
      expect(GameConfig.PLAYER.SPEED).toBeGreaterThan(0);
      expect(GameConfig.PLAYER.MAX_HEALTH).toBeGreaterThan(0);
      expect(GameConfig.PLAYER.START_LIVES).toBeGreaterThanOrEqual(1);
      expect(GameConfig.PLAYER.FIRE_RATE).toBeGreaterThan(0);
    });

    it('should have valid visual effect values', () => {
      expect(GameConfig.PLAYER.HITBOX_SCALE).toBeGreaterThan(0);
      expect(GameConfig.PLAYER.HITBOX_SCALE).toBeLessThanOrEqual(1);
      expect(GameConfig.PLAYER.DAMAGE_FLASH_DURATION).toBeGreaterThan(0);
      expect(GameConfig.PLAYER.SHIELD_RADIUS).toBeGreaterThan(0);
    });
  });

  describe('ENEMY config', () => {
    it('should have at least one enemy type defined', () => {
      const types = Object.keys(GameConfig.ENEMY.TYPES);
      expect(types.length).toBeGreaterThan(0);
    });

    it('should have valid stats for each enemy type', () => {
      Object.entries(GameConfig.ENEMY.TYPES).forEach(([typeName, config]) => {
        expect(config.frameId, `${typeName} missing frameId`).toBeDefined();
        expect(config.health, `${typeName} health`).toBeGreaterThan(0);
        expect(config.speed, `${typeName} speed`).toBeGreaterThan(0);
        expect(config.points, `${typeName} points`).toBeGreaterThanOrEqual(0);
        expect(config.fireRate, `${typeName} fireRate`).toBeGreaterThan(0);
      });
    });

    it('should have valid movement patterns', () => {
      const validPatterns = ['straight', 'sine', 'zigzag', 'dive'];
      Object.entries(GameConfig.ENEMY.TYPES).forEach(([typeName, config]) => {
        if (config.movement) {
          expect(validPatterns, `${typeName} has invalid movement`).toContain(config.movement);
        }
      });
    });

    it('should have valid attack patterns', () => {
      const validAttacks = ['basic', 'aimed', 'burst', 'none'];
      Object.entries(GameConfig.ENEMY.TYPES).forEach(([typeName, config]) => {
        if (config.attack) {
          expect(validAttacks, `${typeName} has invalid attack`).toContain(config.attack);
        }
      });
    });
  });

  describe('WEAPONS config', () => {
    it('should have at least one weapon type defined', () => {
      const types = Object.keys(GameConfig.WEAPONS);
      expect(types.length).toBeGreaterThan(0);
    });

    it('should have valid config for each weapon type', () => {
      Object.entries(GameConfig.WEAPONS).forEach(([weaponName, config]) => {
        expect(config.name, `${weaponName} missing name`).toBeDefined();
        expect(config.projectile, `${weaponName} missing projectile`).toBeDefined();
        expect(config.baseFireRate, `${weaponName} baseFireRate`).toBeGreaterThan(0);
        expect(config.levels, `${weaponName} missing levels`).toBeDefined();
        expect(config.levels.length, `${weaponName} needs at least 1 level`).toBeGreaterThan(0);
      });
    });

    it('should reference valid projectile types', () => {
      const validProjectiles = Object.keys(GameConfig.PROJECTILES);
      Object.entries(GameConfig.WEAPONS).forEach(([weaponName, config]) => {
        expect(
          validProjectiles,
          `${weaponName} references invalid projectile: ${config.projectile}`
        ).toContain(config.projectile);
      });
    });

    it('should have valid fire patterns in levels', () => {
      const validPatterns = ['single', 'dual', 'spread', 'burst'];
      Object.entries(GameConfig.WEAPONS).forEach(([weaponName, config]) => {
        config.levels.forEach((level, index) => {
          expect(
            validPatterns,
            `${weaponName} level ${index} has invalid pattern`
          ).toContain(level.pattern);
          expect(level.bulletCount, `${weaponName} level ${index} bulletCount`).toBeGreaterThan(0);
          expect(level.fireRateMult, `${weaponName} level ${index} fireRateMult`).toBeGreaterThan(0);
        });
      });
    });

    it('should have default weapon defined', () => {
      expect(GameConfig.DEFAULT_WEAPON).toBeDefined();
      expect(GameConfig.WEAPONS[GameConfig.DEFAULT_WEAPON]).toBeDefined();
    });
  });

  describe('PROJECTILES config', () => {
    it('should have at least one projectile type', () => {
      const types = Object.keys(GameConfig.PROJECTILES);
      expect(types.length).toBeGreaterThan(0);
    });

    it('should have valid config for each projectile', () => {
      Object.entries(GameConfig.PROJECTILES).forEach(([name, config]) => {
        expect(config.texture, `${name} missing texture`).toBeDefined();
        expect(config.frame, `${name} missing frame`).toBeDefined();
        expect(config.speed, `${name} speed`).toBeGreaterThan(0);
        expect([-1, 1], `${name} direction must be -1 or 1`).toContain(config.direction);
      });
    });
  });

  describe('FORMATIONS config', () => {
    it('should have at least one formation defined', () => {
      const formations = Object.keys(GameConfig.FORMATIONS);
      expect(formations.length).toBeGreaterThan(0);
    });

    it('should have valid positions for each formation', () => {
      Object.entries(GameConfig.FORMATIONS).forEach(([name, config]) => {
        expect(config.positions, `${name} missing positions`).toBeDefined();
        expect(config.positions.length, `${name} needs at least 1 position`).toBeGreaterThan(0);

        config.positions.forEach((pos, index) => {
          expect(pos, `${name} position ${index} missing x`).toHaveProperty('x');
          expect(pos, `${name} position ${index} missing y`).toHaveProperty('y');
        });
      });
    });

    it('should reference valid enemy types', () => {
      const validEnemyTypes = Object.keys(GameConfig.ENEMY.TYPES);
      Object.entries(GameConfig.FORMATIONS).forEach(([name, config]) => {
        if (config.types) {
          config.types.forEach((type) => {
            expect(
              validEnemyTypes,
              `${name} references invalid enemy type: ${type}`
            ).toContain(type);
          });
        }
      });
    });
  });

  describe('POWER_UP config', () => {
    it('should have valid drop chance', () => {
      expect(GameConfig.POWER_UP.DROP_CHANCE).toBeGreaterThan(0);
      expect(GameConfig.POWER_UP.DROP_CHANCE).toBeLessThanOrEqual(1);
    });

    it('should have at least one power-up type', () => {
      const types = Object.keys(GameConfig.POWER_UP.TYPES);
      expect(types.length).toBeGreaterThan(0);
    });

    it('should have valid config for each power-up type', () => {
      Object.entries(GameConfig.POWER_UP.TYPES).forEach(([name, config]) => {
        expect(config.color, `${name} missing color`).toBeDefined();
        expect(config.text, `${name} missing text`).toBeDefined();
        expect(config.textColor, `${name} missing textColor`).toBeDefined();
      });
    });
  });

  describe('BOSS config', () => {
    it('should have valid boss stats', () => {
      expect(GameConfig.BOSS.MAX_HEALTH).toBeGreaterThan(0);
      expect(GameConfig.BOSS.POINTS).toBeGreaterThan(0);
      expect(GameConfig.BOSS.COLLISION_DAMAGE).toBeGreaterThan(0);
    });

    it('should have valid phase thresholds', () => {
      expect(GameConfig.BOSS.PHASE_2_THRESHOLD).toBeGreaterThan(0);
      expect(GameConfig.BOSS.PHASE_2_THRESHOLD).toBeLessThan(1);
      expect(GameConfig.BOSS.PHASE_3_THRESHOLD).toBeGreaterThan(0);
      expect(GameConfig.BOSS.PHASE_3_THRESHOLD).toBeLessThan(GameConfig.BOSS.PHASE_2_THRESHOLD);
    });

    it('should have valid attack cooldowns', () => {
      expect(GameConfig.BOSS.SPRAY_COOLDOWN).toBeGreaterThan(0);
      expect(GameConfig.BOSS.AIMED_COOLDOWN).toBeGreaterThan(0);
      expect(GameConfig.BOSS.SUMMON_COOLDOWN).toBeGreaterThan(0);
    });
  });
});
