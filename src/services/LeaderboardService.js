import { database } from './firebase.js';
import { ref, push, query, orderByChild, limitToLast, get, onValue } from 'firebase/database';

/**
 * LeaderboardService - Handles all leaderboard operations with Firebase.
 */
export default class LeaderboardService {
  constructor() {
    this.leaderboardRef = ref(database, 'leaderboard');
    this.maxEntries = 10;
    this.listeners = [];
  }

  /**
   * Submit a new score to the leaderboard.
   * @param {Object} entry - Score entry
   * @param {string} entry.initials - 3-letter initials
   * @param {number} entry.score - Final score
   * @param {number} entry.wave - Wave reached
   * @param {number} entry.enemiesKilled - Total enemies killed
   * @param {number} entry.timeSurvived - Time survived in seconds
   * @returns {Promise<boolean>} True if score made the top 10
   */
  async submitScore(entry) {
    try {
      const scoreData = {
        initials: entry.initials.toUpperCase().substring(0, 3),
        score: entry.score,
        wave: entry.wave,
        enemiesKilled: entry.enemiesKilled,
        timeSurvived: entry.timeSurvived,
        timestamp: Date.now(),
      };

      // Check if score qualifies
      const qualifies = await this.checkIfQualifies(entry.score);

      if (qualifies) {
        await push(this.leaderboardRef, scoreData);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error submitting score:', error);
      return false;
    }
  }

  /**
   * Check if a score would make the top 10.
   * @param {number} score - Score to check
   * @returns {Promise<boolean>} True if score qualifies
   */
  async checkIfQualifies(score) {
    try {
      const scores = await this.getTopScores();

      // If less than 10 entries, always qualifies
      if (scores.length < this.maxEntries) {
        return true;
      }

      // Check if score beats the lowest top 10 score
      const lowestScore = scores[scores.length - 1].score;
      return score > lowestScore;
    } catch (error) {
      console.error('Error checking qualification:', error);
      // On error, allow submission attempt
      return true;
    }
  }

  /**
   * Get the top 10 scores.
   * @returns {Promise<Array>} Array of score entries sorted by score descending
   */
  async getTopScores() {
    try {
      const scoresQuery = query(
        this.leaderboardRef,
        orderByChild('score'),
        limitToLast(this.maxEntries)
      );

      const snapshot = await get(scoresQuery);
      const scores = [];

      snapshot.forEach((child) => {
        scores.push({
          id: child.key,
          ...child.val(),
        });
      });

      // Sort by score descending (limitToLast returns ascending)
      return scores.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error fetching scores:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time leaderboard updates.
   * @param {Function} callback - Called with updated scores array
   * @returns {Function} Unsubscribe function
   */
  subscribeToScores(callback) {
    const scoresQuery = query(
      this.leaderboardRef,
      orderByChild('score'),
      limitToLast(this.maxEntries)
    );

    const unsubscribe = onValue(scoresQuery, (snapshot) => {
      const scores = [];
      snapshot.forEach((child) => {
        scores.push({
          id: child.key,
          ...child.val(),
        });
      });

      // Sort by score descending
      callback(scores.sort((a, b) => b.score - a.score));
    });

    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Get the rank a score would achieve.
   * @param {number} score - Score to check
   * @returns {Promise<number>} Rank (1-based), or -1 if not in top 10
   */
  async getRank(score) {
    const scores = await this.getTopScores();

    for (let i = 0; i < scores.length; i++) {
      if (score > scores[i].score) {
        return i + 1;
      }
    }

    if (scores.length < this.maxEntries) {
      return scores.length + 1;
    }

    return -1;
  }

  /**
   * Clean up listeners.
   */
  destroy() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
  }
}

// Singleton instance
export const leaderboardService = new LeaderboardService();
