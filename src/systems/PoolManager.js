/**
 * @file PoolManager - Centralized object pool management.
 * Provides a single interface for creating and managing all game object pools.
 */

/**
 * @typedef {Object} PoolConfig
 * @property {number} [maxSize] - Maximum pool size
 * @property {boolean} [runChildUpdate=true] - Whether to call preUpdate on children
 */

/**
 * PoolManager - Centralized object pool management.
 */
export default class PoolManager {
  /**
   * @param {Phaser.Scene} scene - The game scene
   */
  constructor(scene) {
    /** @type {Phaser.Scene} */
    this.scene = scene;
    /** @type {Object<string, Phaser.Physics.Arcade.Group>} */
    this.pools = {};
  }

  /**
   * Register a new object pool.
   * @param {string} name - Pool identifier
   * @param {Function} classType - The class to instantiate (e.g., Bullet)
   * @param {Object} config - Pool configuration
   * @param {number} [config.maxSize] - Maximum pool size
   * @param {boolean} [config.runChildUpdate=true] - Whether to call preUpdate on children
   * @returns {Phaser.Physics.Arcade.Group} The created group
   */
  register(name, classType, config = {}) {
    if (this.pools[name]) {
      console.warn(`Pool '${name}' already exists`);
      return this.pools[name];
    }

    const poolConfig = {
      classType,
      runChildUpdate: config.runChildUpdate !== false,
      ...config,
    };

    const group = this.scene.physics.add.group(poolConfig);
    this.pools[name] = group;

    return group;
  }

  /**
   * Get a pool by name.
   * @param {string} name - Pool identifier
   * @returns {Phaser.Physics.Arcade.Group|null} The pool group or null
   */
  getPool(name) {
    return this.pools[name] || null;
  }

  /**
   * Get an object from a pool.
   * @param {string} name - Pool identifier
   * @param {number} [x=0] - Initial X position
   * @param {number} [y=0] - Initial Y position
   * @returns {Phaser.GameObjects.GameObject|null} The pooled object or null
   */
  get(name, x = 0, y = 0) {
    const pool = this.pools[name];
    if (!pool) {
      console.warn(`Pool '${name}' not found`);
      return null;
    }

    return pool.get(x, y);
  }

  /**
   * Get an object and call its fire method (for projectiles).
   * @param {string} name - Pool identifier
   * @param {number} x - Fire X position
   * @param {number} y - Fire Y position
   * @param {Object} [options] - Additional fire options (passed to fire method)
   * @returns {Phaser.GameObjects.GameObject|null} The fired object or null
   */
  fire(name, x, y, options = {}) {
    const obj = this.get(name, x, y);
    if (obj && typeof obj.fire === 'function') {
      obj.fire(x, y, options.angle || 0, options.speed);
    }
    return obj;
  }

  /**
   * Check if a pool exists.
   * @param {string} name - Pool identifier
   * @returns {boolean}
   */
  has(name) {
    return !!this.pools[name];
  }

  /**
   * Get all pool names.
   * @returns {string[]}
   */
  getPoolNames() {
    return Object.keys(this.pools);
  }

  /**
   * Get count of active objects in a pool.
   * @param {string} name - Pool identifier
   * @returns {number}
   */
  getActiveCount(name) {
    const pool = this.pools[name];
    if (!pool) return 0;
    return pool.getChildren().filter(child => child.active).length;
  }

  /**
   * Get total count of objects in a pool.
   * @param {string} name - Pool identifier
   * @returns {number}
   */
  getTotalCount(name) {
    const pool = this.pools[name];
    if (!pool) return 0;
    return pool.getChildren().length;
  }

  /**
   * Clear all objects in a pool.
   * @param {string} name - Pool identifier
   * @param {boolean} [removeFromScene=true] - Remove from scene display list
   * @param {boolean} [destroyChildren=true] - Destroy the objects
   */
  clear(name, removeFromScene = true, destroyChildren = true) {
    const pool = this.pools[name];
    if (pool) {
      pool.clear(removeFromScene, destroyChildren);
    }
  }

  /**
   * Clear all pools.
   */
  clearAll() {
    Object.keys(this.pools).forEach(name => {
      this.clear(name);
    });
  }

  /**
   * Destroy the pool manager and all pools.
   */
  destroy() {
    this.clearAll();
    this.pools = {};
    this.scene = null;
  }
}
