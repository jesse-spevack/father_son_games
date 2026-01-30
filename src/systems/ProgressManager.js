/**
 * @typedef {Object} PlayerProgress
 * @property {number} totalCredits - Total credits earned across all runs
 * @property {number} highScore - Highest score achieved
 * @property {number} longestSurvival - Longest survival time in seconds
 * @property {number} totalKills - Total enemies killed
 * @property {number} bossesDefeated - Total bosses defeated
 * @property {string[]} unlockedWeapons - Array of unlocked weapon type keys
 * @property {Object<string, number>} upgrades - Purchased upgrade levels
 */

const STORAGE_KEY = 'spacebear_progress';
const STORAGE_VERSION = 1;

/**
 * Default progress state for new players.
 * @returns {PlayerProgress}
 */
function getDefaultProgress() {
  return {
    totalCredits: 0,
    highScore: 0,
    longestSurvival: 0,
    totalKills: 0,
    bossesDefeated: 0,
    unlockedWeapons: ['vulcan'], // Default weapon is always unlocked
    upgrades: {},
  };
}

/**
 * ProgressManager - Handles persistent player progress via localStorage.
 * Tracks credits, high scores, unlocks, and upgrades across game sessions.
 */
export default class ProgressManager {
  constructor() {
    /** @type {PlayerProgress} */
    this.progress = getDefaultProgress();
    this.load();
  }

  /**
   * Load progress from localStorage.
   * Creates default progress if none exists.
   */
  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        // Version migration (for future use)
        if (data.version !== STORAGE_VERSION) {
          console.log('Migrating progress from version', data.version);
          // Add migration logic here when needed
        }
        // Merge with defaults to handle new fields
        this.progress = { ...getDefaultProgress(), ...data.progress };
      }
    } catch (e) {
      console.warn('Failed to load progress:', e);
      this.progress = getDefaultProgress();
    }
  }

  /**
   * Save progress to localStorage.
   */
  save() {
    try {
      const data = {
        version: STORAGE_VERSION,
        progress: this.progress,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  }

  /**
   * Reset all progress to defaults.
   * Use with caution - this clears all player progress.
   */
  reset() {
    this.progress = getDefaultProgress();
    this.save();
  }

  /**
   * Add credits to the player's total.
   * Automatically saves after update.
   * @param {number} amount - Credits to add
   * @returns {number} New total credits
   */
  addCredits(amount) {
    this.progress.totalCredits += amount;
    this.save();
    return this.progress.totalCredits;
  }

  /**
   * Spend credits (for purchases).
   * @param {number} amount - Credits to spend
   * @returns {boolean} True if successful, false if insufficient credits
   */
  spendCredits(amount) {
    if (this.progress.totalCredits < amount) {
      return false;
    }
    this.progress.totalCredits -= amount;
    this.save();
    return true;
  }

  /**
   * Get current credit balance.
   * @returns {number}
   */
  getCredits() {
    return this.progress.totalCredits;
  }

  /**
   * Check if player can afford a purchase.
   * @param {number} amount - Cost to check
   * @returns {boolean}
   */
  canAfford(amount) {
    return this.progress.totalCredits >= amount;
  }

  /**
   * Update high score if new score is higher.
   * @param {number} score - Score to check
   * @returns {boolean} True if new high score
   */
  updateHighScore(score) {
    if (score > this.progress.highScore) {
      this.progress.highScore = score;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Get the current high score.
   * @returns {number}
   */
  getHighScore() {
    return this.progress.highScore;
  }

  /**
   * Update longest survival time if new time is higher.
   * @param {number} seconds - Survival time in seconds
   * @returns {boolean} True if new record
   */
  updateLongestSurvival(seconds) {
    if (seconds > this.progress.longestSurvival) {
      this.progress.longestSurvival = seconds;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Add to total kills count.
   * @param {number} kills - Kills to add
   */
  addKills(kills) {
    this.progress.totalKills += kills;
    this.save();
  }

  /**
   * Increment bosses defeated count.
   */
  recordBossDefeat() {
    this.progress.bossesDefeated++;
    this.save();
  }

  /**
   * Check if a weapon is unlocked.
   * @param {string} weaponType - Weapon type key
   * @returns {boolean}
   */
  isWeaponUnlocked(weaponType) {
    return this.progress.unlockedWeapons.includes(weaponType);
  }

  /**
   * Unlock a weapon.
   * @param {string} weaponType - Weapon type key
   * @returns {boolean} True if newly unlocked, false if already owned
   */
  unlockWeapon(weaponType) {
    if (this.isWeaponUnlocked(weaponType)) {
      return false;
    }
    this.progress.unlockedWeapons.push(weaponType);
    this.save();
    return true;
  }

  /**
   * Get all unlocked weapons.
   * @returns {string[]}
   */
  getUnlockedWeapons() {
    return [...this.progress.unlockedWeapons];
  }

  /**
   * Get an upgrade level.
   * @param {string} upgradeKey - Upgrade identifier
   * @returns {number} Current level (0 if not purchased)
   */
  getUpgradeLevel(upgradeKey) {
    return this.progress.upgrades[upgradeKey] || 0;
  }

  /**
   * Set an upgrade level.
   * @param {string} upgradeKey - Upgrade identifier
   * @param {number} level - New level
   */
  setUpgradeLevel(upgradeKey, level) {
    this.progress.upgrades[upgradeKey] = level;
    this.save();
  }

  /**
   * Increment an upgrade level by 1.
   * @param {string} upgradeKey - Upgrade identifier
   * @returns {number} New level
   */
  upgradeLevel(upgradeKey) {
    const current = this.getUpgradeLevel(upgradeKey);
    this.setUpgradeLevel(upgradeKey, current + 1);
    return current + 1;
  }

  /**
   * Update progress at end of game run.
   * @param {Object} stats - Game stats from GameState.getStats()
   * @param {number} stats.score - Final score
   * @param {number} stats.timeSurvived - Survival time in seconds
   * @param {number} stats.enemiesKilled - Enemies killed this run
   * @param {number} stats.credits - Credits earned this run
   */
  recordGameEnd(stats) {
    // Add credits earned this run to total
    this.progress.totalCredits += stats.credits;

    // Update high score
    this.updateHighScore(stats.score);

    // Update longest survival
    this.updateLongestSurvival(stats.timeSurvived);

    // Add kills to total
    this.progress.totalKills += stats.enemiesKilled;

    this.save();
  }

  /**
   * Get all progress data.
   * @returns {PlayerProgress}
   */
  getProgress() {
    return { ...this.progress };
  }
}
