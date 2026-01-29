import GameConfig from '../config/GameConfig.js';

/**
 * @typedef {Object} GameStats
 * @property {number} score - Final score
 * @property {number} wave - Final wave/difficulty level
 * @property {number} enemiesKilled - Total enemies killed
 * @property {number} timeSurvived - Survival time in seconds
 */

/**
 * Centralized game state management.
 * This is a data class that holds all game state variables.
 * Note: Invincibility state has been moved to Player class.
 */
export default class GameState {
  /**
   * Create a new GameState instance.
   */
  constructor() {
    /** @type {number} Current score */
    this.score = 0;
    /** @type {number} Remaining lives */
    this.lives = 0;
    /** @type {number} Current difficulty level */
    this.difficulty = 1;
    /** @type {boolean} Whether game has started */
    this.gameStarted = false;
    /** @type {number} Timer for difficulty progression */
    this.difficultyTimer = 0;
    /** @type {number} Timer for mine spawning */
    this.mineSpawnTimer = 0;
    /** @type {number} Total enemies killed */
    this.enemiesKilled = 0;
    /** @type {number} Time survived in seconds */
    this.timeSurvived = 0;
    /** @type {number} Game start timestamp */
    this.gameStartTime = 0;

    this.reset();
  }

  /**
   * Reset all state to initial values.
   */
  reset() {
    this.score = 0;
    this.lives = GameConfig.PLAYER.START_LIVES;
    this.difficulty = 1;
    this.gameStarted = false;
    this.difficultyTimer = 0;
    this.mineSpawnTimer = 0;
    // Stats for leaderboard
    this.enemiesKilled = 0;
    this.timeSurvived = 0; // in seconds
    this.gameStartTime = 0;
  }

  /**
   * Add points to the score.
   * @param {number} points - Points to add
   * @returns {number} The new score
   */
  addScore(points) {
    this.score += points;
    return this.score;
  }

  /**
   * Lose a life.
   * @returns {number} Remaining lives
   */
  loseLife() {
    this.lives--;
    return this.lives;
  }

  /**
   * Record an enemy kill.
   */
  recordKill() {
    this.enemiesKilled++;
  }

  /**
   * Start tracking game time.
   * @param {number} time - Current game time in ms
   */
  startTimer(time) {
    this.gameStartTime = time;
  }

  /**
   * Update the time survived.
   * @param {number} time - Current game time in ms
   */
  updateTime(time) {
    if (this.gameStartTime > 0) {
      this.timeSurvived = Math.floor((time - this.gameStartTime) / 1000);
    }
  }

  /**
   * Get stats for leaderboard submission.
   * @returns {GameStats} Stats object
   */
  getStats() {
    return {
      score: this.score,
      wave: this.difficulty,
      enemiesKilled: this.enemiesKilled,
      timeSurvived: this.timeSurvived,
    };
  }
}
