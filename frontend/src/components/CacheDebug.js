import React, { useState, useEffect } from 'react';
import { getCacheStats, clearAllCache } from '../utils/cache';
import { RefreshCw, Trash2, Database } from 'lucide-react';

const CacheDebug = () => {
  const [stats, setStats] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const refreshStats = () => {
    const cacheStats = getCacheStats();
    setStats(cacheStats);
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear all cache? This will reload data from the server.')) {
      clearAllCache();
      refreshStats();
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow-lg z-50"
        title="Show cache debug info"
      >
        <Database className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border p-4 max-w-md z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Cache Debug
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshStats}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Refresh stats"
          >
            <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={handleClearCache}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
            title="Clear all cache"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Hide"
          >
            ×
          </button>
        </div>
      </div>

      {stats && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-300">Entries:</span>
              <span className="ml-2 font-semibold">{stats.totalEntries}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-300">Size:</span>
              <span className="ml-2 font-semibold">{formatSize(stats.totalSize)}</span>
            </div>
          </div>

          {stats.entries.length > 0 && (
            <div className="border-t pt-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Cache Entries:
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {stats.entries.map((entry, index) => (
                  <div
                    key={index}
                    className="text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded"
                  >
                    <div className="font-medium text-gray-800 dark:text-white">
                      {entry.key}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 mt-1">
                      Size: {formatSize(entry.size)} • Age: {entry.age}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">
                      Expires: {new Date(entry.expiry).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-2">
            Cache improves loading speed by storing API responses locally.
            Data auto-refreshes based on configured expiry times.
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheDebug;
