import { describe, it, expect, beforeEach, vi } from 'vitest';
import ProgressManager from '../src/systems/ProgressManager.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('ProgressManager', () => {
  let progress;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    progress = new ProgressManager();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const data = progress.getProgress();
      expect(data.totalCredits).toBe(0);
      expect(data.highScore).toBe(0);
      expect(data.longestSurvival).toBe(0);
      expect(data.totalKills).toBe(0);
      expect(data.bossesDefeated).toBe(0);
      expect(data.unlockedWeapons).toEqual(['vulcan']);
      expect(data.upgrades).toEqual({});
    });

    it('should load saved progress from localStorage', () => {
      const saved = {
        version: 1,
        progress: {
          totalCredits: 500,
          highScore: 10000,
          longestSurvival: 300,
          totalKills: 100,
          bossesDefeated: 5,
          unlockedWeapons: ['vulcan', 'laser'],
          upgrades: { speed: 2 },
        },
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(saved));

      const loadedProgress = new ProgressManager();
      const data = loadedProgress.getProgress();

      expect(data.totalCredits).toBe(500);
      expect(data.highScore).toBe(10000);
      expect(data.unlockedWeapons).toContain('laser');
    });
  });

  describe('credits', () => {
    it('should add credits', () => {
      progress.addCredits(100);
      expect(progress.getCredits()).toBe(100);
    });

    it('should accumulate credits', () => {
      progress.addCredits(50);
      progress.addCredits(75);
      expect(progress.getCredits()).toBe(125);
    });

    it('should spend credits if sufficient', () => {
      progress.addCredits(100);
      const result = progress.spendCredits(50);
      expect(result).toBe(true);
      expect(progress.getCredits()).toBe(50);
    });

    it('should not spend credits if insufficient', () => {
      progress.addCredits(30);
      const result = progress.spendCredits(50);
      expect(result).toBe(false);
      expect(progress.getCredits()).toBe(30);
    });

    it('should check affordability', () => {
      progress.addCredits(100);
      expect(progress.canAfford(50)).toBe(true);
      expect(progress.canAfford(150)).toBe(false);
    });
  });

  describe('high score', () => {
    it('should update high score when higher', () => {
      const result = progress.updateHighScore(5000);
      expect(result).toBe(true);
      expect(progress.getHighScore()).toBe(5000);
    });

    it('should not update high score when lower', () => {
      progress.updateHighScore(5000);
      const result = progress.updateHighScore(3000);
      expect(result).toBe(false);
      expect(progress.getHighScore()).toBe(5000);
    });
  });

  describe('survival time', () => {
    it('should update longest survival when higher', () => {
      const result = progress.updateLongestSurvival(120);
      expect(result).toBe(true);
      expect(progress.getProgress().longestSurvival).toBe(120);
    });

    it('should not update when lower', () => {
      progress.updateLongestSurvival(120);
      const result = progress.updateLongestSurvival(60);
      expect(result).toBe(false);
      expect(progress.getProgress().longestSurvival).toBe(120);
    });
  });

  describe('weapons', () => {
    it('should start with vulcan unlocked', () => {
      expect(progress.isWeaponUnlocked('vulcan')).toBe(true);
    });

    it('should unlock new weapons', () => {
      const result = progress.unlockWeapon('laser');
      expect(result).toBe(true);
      expect(progress.isWeaponUnlocked('laser')).toBe(true);
    });

    it('should not re-unlock already owned weapons', () => {
      progress.unlockWeapon('laser');
      const result = progress.unlockWeapon('laser');
      expect(result).toBe(false);
    });

    it('should list all unlocked weapons', () => {
      progress.unlockWeapon('laser');
      progress.unlockWeapon('plasma');
      const weapons = progress.getUnlockedWeapons();
      expect(weapons).toContain('vulcan');
      expect(weapons).toContain('laser');
      expect(weapons).toContain('plasma');
    });
  });

  describe('upgrades', () => {
    it('should return 0 for non-purchased upgrades', () => {
      expect(progress.getUpgradeLevel('speed')).toBe(0);
    });

    it('should set upgrade level', () => {
      progress.setUpgradeLevel('speed', 3);
      expect(progress.getUpgradeLevel('speed')).toBe(3);
    });

    it('should increment upgrade level', () => {
      progress.setUpgradeLevel('speed', 1);
      const newLevel = progress.upgradeLevel('speed');
      expect(newLevel).toBe(2);
    });
  });

  describe('recordGameEnd', () => {
    it('should update all stats from game end', () => {
      const stats = {
        score: 10000,
        timeSurvived: 180,
        enemiesKilled: 50,
        credits: 250,
      };

      progress.recordGameEnd(stats);

      expect(progress.getCredits()).toBe(250);
      expect(progress.getHighScore()).toBe(10000);
      expect(progress.getProgress().longestSurvival).toBe(180);
      expect(progress.getProgress().totalKills).toBe(50);
    });

    it('should accumulate across multiple games', () => {
      progress.recordGameEnd({ score: 5000, timeSurvived: 60, enemiesKilled: 25, credits: 100 });
      progress.recordGameEnd({ score: 3000, timeSurvived: 45, enemiesKilled: 20, credits: 75 });

      expect(progress.getCredits()).toBe(175);
      expect(progress.getHighScore()).toBe(5000); // Should keep the higher one
      expect(progress.getProgress().totalKills).toBe(45);
    });
  });

  describe('persistence', () => {
    it('should save to localStorage on changes', () => {
      progress.addCredits(100);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should reset all progress', () => {
      progress.addCredits(500);
      progress.unlockWeapon('laser');
      progress.reset();

      expect(progress.getCredits()).toBe(0);
      expect(progress.isWeaponUnlocked('laser')).toBe(false);
      expect(progress.isWeaponUnlocked('vulcan')).toBe(true); // Default always unlocked
    });
  });
});
