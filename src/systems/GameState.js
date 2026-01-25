/**
 * Centralized game state management.
 * This is a data class that holds all game state variables.
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
    this.lives = 3;
    this.difficulty = 1;
    this.isInvincible = false;
    this.gameStarted = false;
    this.difficultyTimer = 0;
    this.mineSpawnTimer = 0;

    // Clear any pending invincibility timeout
    if (this._invincibilityEvent) {
      this._invincibilityEvent.remove();
      this._invincibilityEvent = null;
    }
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
   * Set invincibility state.
   * @param {boolean} value - Whether player is invincible
   * @param {number} [duration] - Optional duration in ms, auto-resets after timeout
   * @param {Phaser.Scene} [scene] - Required if duration is provided, for time events
   */
  setInvincible(value, duration, scene) {
    this.isInvincible = value;

    // Clear any existing invincibility timeout
    if (this._invincibilityEvent) {
      this._invincibilityEvent.remove();
      this._invincibilityEvent = null;
    }

    // Set auto-reset timeout if duration provided
    if (value && duration && scene) {
      this._invincibilityEvent = scene.time.delayedCall(duration, () => {
        this.isInvincible = false;
        this._invincibilityEvent = null;
      });
    }
  }
}
