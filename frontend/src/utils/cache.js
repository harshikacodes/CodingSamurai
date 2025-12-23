/**
 * Browser Cache Management System for DSA-Samurai
 * Handles caching of API responses with expiration times
 */

// Cache configuration with different expiry times for different data types
const CACHE_CONFIG = {
  // Static data that rarely changes
  QUESTIONS: { 
    key: 'dsa_questions',
    expiry: 30 * 60 * 1000 // 30 minutes
  },
  
  // User progress data - more dynamic
  USER_PROGRESS: { 
    key: 'dsa_user_progress',
    expiry: 5 * 60 * 1000 // 5 minutes
  },
  
  // Leaderboard data - semi-static
  LEADERBOARD: { 
    key: 'dsa_leaderboard',
    expiry: 10 * 60 * 1000 // 10 minutes
  },
  
  // User rank data - semi-static
  USER_RANK: { 
    key: 'dsa_user_rank',
    expiry: 10 * 60 * 1000 // 10 minutes
  },
  
  // User profile data - rarely changes
  USER_PROFILE: { 
    key: 'dsa_user_profile',
    expiry: 60 * 60 * 1000 // 1 hour
  },
  
  // Debug/system data - rarely changes
  USERS_LIST: { 
    key: 'dsa_users_list',
    expiry: 60 * 60 * 1000 // 1 hour
  }
};

/**
 * Cache utility class
 */
class CacheManager {
  constructor() {
    this.storage = window.localStorage;
    this.prefix = 'dsa_cache_';
  }

  /**
   * Generate cache key with user context
   * @param {string} baseKey - Base cache key
   * @param {string} userId - User ID for user-specific data
   * @returns {string} Full cache key
   */
  getCacheKey(baseKey, userId = null) {
    return userId ? `${this.prefix}${baseKey}_${userId}` : `${this.prefix}${baseKey}`;
  }

  /**
   * Set data in cache with expiration
   * @param {string} configKey - Key from CACHE_CONFIG
   * @param {any} data - Data to cache
   * @param {string} userId - User ID for user-specific data
   */
  set(configKey, data, userId = null) {
    try {
      const config = CACHE_CONFIG[configKey];
      if (!config) {
        console.warn(`Cache config not found for key: ${configKey}`);
        return false;
      }

      const cacheKey = this.getCacheKey(config.key, userId);
      const expiryTime = Date.now() + config.expiry;
      
      const cacheData = {
        data: data,
        expiry: expiryTime,
        timestamp: Date.now(),
        userId: userId
      };

      this.storage.setItem(cacheKey, JSON.stringify(cacheData));
      
      console.log(`🗄️ Cached data for ${configKey}${userId ? ` (user: ${userId})` : ''}, expires in ${config.expiry / 1000}s`);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get data from cache
   * @param {string} configKey - Key from CACHE_CONFIG
   * @param {string} userId - User ID for user-specific data
   * @returns {any|null} Cached data or null if not found/expired
   */
  get(configKey, userId = null) {
    try {
      const config = CACHE_CONFIG[configKey];
      if (!config) {
        console.warn(`Cache config not found for key: ${configKey}`);
        return null;
      }

      const cacheKey = this.getCacheKey(config.key, userId);
      const cachedItem = this.storage.getItem(cacheKey);
      
      if (!cachedItem) {
        return null;
      }

      const cacheData = JSON.parse(cachedItem);
      
      // Check if cache has expired
      if (Date.now() > cacheData.expiry) {
        this.remove(configKey, userId);
        console.log(`⏰ Cache expired for ${configKey}${userId ? ` (user: ${userId})` : ''}`);
        return null;
      }

      const ageInSeconds = (Date.now() - cacheData.timestamp) / 1000;
      console.log(`📦 Cache hit for ${configKey}${userId ? ` (user: ${userId})` : ''} (age: ${ageInSeconds.toFixed(1)}s)`);
      
      return cacheData.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Remove specific cache entry
   * @param {string} configKey - Key from CACHE_CONFIG
   * @param {string} userId - User ID for user-specific data
   */
  remove(configKey, userId = null) {
    try {
      const config = CACHE_CONFIG[configKey];
      if (!config) return;

      const cacheKey = this.getCacheKey(config.key, userId);
      this.storage.removeItem(cacheKey);
      console.log(`🗑️ Removed cache for ${configKey}${userId ? ` (user: ${userId})` : ''}`);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  /**
   * Clear all DSA-Samurai cache
   */
  clearAll() {
    try {
      const keys = Object.keys(this.storage);
      const dsaKeys = keys.filter(key => key.startsWith(this.prefix));
      
      dsaKeys.forEach(key => {
        this.storage.removeItem(key);
      });
      
      console.log(`🧹 Cleared ${dsaKeys.length} cache entries`);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Clear cache for specific user (on logout)
   * @param {string} userId - User ID
   */
  clearUser(userId) {
    try {
      const keys = Object.keys(this.storage);
      const userKeys = keys.filter(key => 
        key.startsWith(this.prefix) && key.endsWith(`_${userId}`)
      );
      
      userKeys.forEach(key => {
        this.storage.removeItem(key);
      });
      
      console.log(`🧹 Cleared ${userKeys.length} cache entries for user ${userId}`);
    } catch (error) {
      console.error('Cache clear user error:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    try {
      const keys = Object.keys(this.storage);
      const dsaKeys = keys.filter(key => key.startsWith(this.prefix));
      
      const stats = {
        totalEntries: dsaKeys.length,
        totalSize: 0,
        entries: []
      };

      dsaKeys.forEach(key => {
        try {
          const value = this.storage.getItem(key);
          const size = new Blob([value]).size;
          const data = JSON.parse(value);
          
          stats.totalSize += size;
          stats.entries.push({
            key: key.replace(this.prefix, ''),
            size: size,
            expiry: new Date(data.expiry).toLocaleString(),
            age: ((Date.now() - data.timestamp) / 1000).toFixed(1) + 's'
          });
        } catch (e) {
          // Skip invalid entries
        }
      });

      return stats;
    } catch (error) {
      console.error('Cache stats error:', error);
      return { totalEntries: 0, totalSize: 0, entries: [] };
    }
  }

  /**
   * Check if data is cached and not expired
   * @param {string} configKey - Key from CACHE_CONFIG
   * @param {string} userId - User ID for user-specific data
   * @returns {boolean} True if cached and not expired
   */
  has(configKey, userId = null) {
    return this.get(configKey, userId) !== null;
  }
}

// Create singleton instance
const cache = new CacheManager();

/**
 * Helper function for API calls with caching
 * @param {string} configKey - Key from CACHE_CONFIG
 * @param {Function} apiCall - Function that returns a Promise with API data
 * @param {string} userId - User ID for user-specific data
 * @returns {Promise} Promise with cached or fresh data
 */
export const withCache = async (configKey, apiCall, userId = null) => {
  // Try to get from cache first
  const cachedData = cache.get(configKey, userId);
  if (cachedData !== null) {
    return cachedData;
  }

  // If not in cache, make API call
  console.log(`🌐 Making API call for ${configKey}${userId ? ` (user: ${userId})` : ''}`);
  try {
    const data = await apiCall();
    
    // Cache the result
    cache.set(configKey, data, userId);
    
    return data;
  } catch (error) {
    console.error(`API call failed for ${configKey}:`, error);
    throw error;
  }
};

/**
 * Invalidate cache when data changes
 * @param {string} configKey - Key from CACHE_CONFIG
 * @param {string} userId - User ID for user-specific data
 */
export const invalidateCache = (configKey, userId = null) => {
  cache.remove(configKey, userId);
};

/**
 * Clear all cache (useful for debugging or major updates)
 */
export const clearAllCache = () => {
  cache.clearAll();
};

/**
 * Clear user-specific cache (useful on logout)
 * @param {string} userId - User ID
 */
export const clearUserCache = (userId) => {
  cache.clearUser(userId);
};

/**
 * Get cache statistics for debugging
 */
export const getCacheStats = () => {
  return cache.getStats();
};

// Export cache configuration for reference
export { CACHE_CONFIG };

export default cache;
