import { describe, it, expect, beforeEach } from 'vitest';
import GameState from '../src/systems/GameState.js';
import GameConfig from '../src/config/GameConfig.js';

describe('GameState', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(gameState.score).toBe(0);
      expect(gameState.lives).toBe(GameConfig.PLAYER.START_LIVES);
      expect(gameState.difficulty).toBe(1);
      expect(gameState.gameStarted).toBe(false);
      expect(gameState.enemiesKilled).toBe(0);
      expect(gameState.timeSurvived).toBe(0);
    });
  });

  describe('reset()', () => {
    it('should reset all values to defaults', () => {
      // Modify state
      gameState.score = 1000;
      gameState.lives = 1;
      gameState.difficulty = 5;
      gameState.gameStarted = true;
      gameState.enemiesKilled = 50;

      // Reset
      gameState.reset();

      // Verify
      expect(gameState.score).toBe(0);
      expect(gameState.lives).toBe(GameConfig.PLAYER.START_LIVES);
      expect(gameState.difficulty).toBe(1);
      expect(gameState.gameStarted).toBe(false);
      expect(gameState.enemiesKilled).toBe(0);
    });
  });

  describe('addScore()', () => {
    it('should add points to score', () => {
      gameState.addScore(100);
      expect(gameState.score).toBe(100);
    });

    it('should accumulate multiple score additions', () => {
      gameState.addScore(100);
      gameState.addScore(250);
      gameState.addScore(50);
      expect(gameState.score).toBe(400);
    });

    it('should return the new score', () => {
      const newScore = gameState.addScore(100);
      expect(newScore).toBe(100);
    });

    it('should handle zero points', () => {
      gameState.addScore(0);
      expect(gameState.score).toBe(0);
    });
  });

  describe('loseLife()', () => {
    it('should decrement lives', () => {
      const initialLives = gameState.lives;
      gameState.loseLife();
      expect(gameState.lives).toBe(initialLives - 1);
    });

    it('should return remaining lives', () => {
      const remaining = gameState.loseLife();
      expect(remaining).toBe(gameState.lives);
    });

    it('should allow lives to go below zero', () => {
      // Lose all lives plus one more
      for (let i = 0; i <= GameConfig.PLAYER.START_LIVES; i++) {
        gameState.loseLife();
      }
      expect(gameState.lives).toBeLessThan(0);
    });
  });

  describe('recordKill()', () => {
    it('should increment enemies killed', () => {
      gameState.recordKill();
      expect(gameState.enemiesKilled).toBe(1);
    });

    it('should accumulate multiple kills', () => {
      gameState.recordKill();
      gameState.recordKill();
      gameState.recordKill();
      expect(gameState.enemiesKilled).toBe(3);
    });
  });

  describe('addCredits()', () => {
    it('should add credits to total', () => {
      gameState.addCredits(100);
      expect(gameState.credits).toBe(100);
    });

    it('should accumulate multiple credit additions', () => {
      gameState.addCredits(50);
      gameState.addCredits(30);
      gameState.addCredits(20);
      expect(gameState.credits).toBe(100);
    });

    it('should return the new credit total', () => {
      gameState.addCredits(50);
      const result = gameState.addCredits(25);
      expect(result).toBe(75);
    });
  });

  describe('timer functions', () => {
    it('should set game start time', () => {
      gameState.startTimer(1000);
      expect(gameState.gameStartTime).toBe(1000);
    });

    it('should calculate time survived in seconds', () => {
      gameState.startTimer(1000); // start at 1 second
      gameState.updateTime(6000); // 5 seconds later
      expect(gameState.timeSurvived).toBe(5);
    });

    it('should round down to whole seconds', () => {
      gameState.startTimer(1000); // start at 1 second
      gameState.updateTime(6999); // 5.999 seconds later
      expect(gameState.timeSurvived).toBe(5);
    });

    it('should not update time if timer not started', () => {
      gameState.updateTime(5000);
      expect(gameState.timeSurvived).toBe(0);
    });
  });

  describe('getStats()', () => {
    it('should return stats object with all fields', () => {
      gameState.score = 1000;
      gameState.difficulty = 3;
      gameState.enemiesKilled = 25;
      gameState.timeSurvived = 120;
      gameState.credits = 500;

      const stats = gameState.getStats();

      expect(stats).toEqual({
        score: 1000,
        wave: 3,
        enemiesKilled: 25,
        timeSurvived: 120,
        credits: 500,
      });
    });

    it('should return a new object each time', () => {
      const stats1 = gameState.getStats();
      const stats2 = gameState.getStats();
      expect(stats1).not.toBe(stats2);
      expect(stats1).toEqual(stats2);
    });
  });
});
