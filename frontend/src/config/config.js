// API Configuration
const API_CONFIG = {
  // For local development
  LOCAL: 'http://localhost:3001',
  // For network access (your server IP)
  NETWORK: 'http://10.108.172.217:3001'
};

// Detect if we're running locally or on network
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '';

// Export the appropriate API URL based on environment
export const API_BASE_URL = isLocalhost ? API_CONFIG.LOCAL : API_CONFIG.NETWORK;

// Individual API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`
  },
  QUESTIONS: `${API_BASE_URL}/questions`,  // Fixed: removed /api prefix
  USERS: `${API_BASE_URL}/api/users`,
  PROGRESS: `${API_BASE_URL}/api/progress`,
  LEADERBOARD: `${API_BASE_URL}/api/leaderboard`
};

// For debugging
console.log('🌐 API Configuration:', {
  hostname: window.location.hostname,
  isLocalhost,
  API_BASE_URL
});

export default API_BASE_URL;
