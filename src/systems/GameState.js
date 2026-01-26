import GameConfig from '../config/GameConfig.js';

/**
 * Centralized game state management.
 * This is a data class that holds all game state variables.
 * Note: Invincibility state has been moved to Player class.
 */
export default class GameState {
  constructor() {
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
}
