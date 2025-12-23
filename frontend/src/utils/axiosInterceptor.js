import axios from 'axios';
import { API_ENDPOINTS } from '../config/config';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Function to setup axios interceptors
export const setupAxiosInterceptors = (authContext) => {
  const { refreshAccessToken, logout } = authContext;

  // Request interceptor to add auth token
  axios.interceptors.request.use(
    (config) => {
      // Always get the latest token from the context
      const currentToken = authContext.accessToken;
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle 401 errors
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If refresh is already in progress, queue the request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          }).catch((err) => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshSuccess = await refreshAccessToken();
          
          if (refreshSuccess) {
            // Get the new access token from the auth context
            const newToken = authContext.accessToken;
            processQueue(null, newToken);
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          } else {
            // Refresh failed, logout user
            processQueue(new Error('Token refresh failed'), null);
            logout();
            return Promise.reject(error);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

// Function to clear interceptors (useful for cleanup)
export const clearAxiosInterceptors = () => {
  axios.interceptors.request.clear();
  axios.interceptors.response.clear();
};
