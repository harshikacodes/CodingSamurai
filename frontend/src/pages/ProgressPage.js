import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  TrophyIcon,
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  ArrowPathIcon,
  FireIcon,
  StarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:3001';

const ProgressPage = () => {
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filter, setFilter] = useState('all-time'); // daily, weekly, all-time

  useEffect(() => {
    const fetchProgress = async (period = 'all-time') => {
      try {
        if (!refreshing) setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/leaderboard?period=${period}`);
        setProgressData(response.data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchProgress(filter);
    }, 30000);

    fetchProgress(filter);
    return () => clearInterval(interval);
  }, [filter]);

  const handleRefresh = () => {
    setRefreshing(true);
    const fetchProgress = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/leaderboard?period=${filter}`);
        setProgressData(response.data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setRefreshing(false);
      }
    };
    fetchProgress();
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <TrophyIcon className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <StarIcon className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <FireIcon className="w-6 h-6 text-orange-500" />;
    return <span className="w-6 h-6 flex items-center justify-center text-gray-600 font-bold">#{rank}</span>;
  };

  const getProgressBarColor = (rate) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-blue-500';
    if (rate >= 40) return 'bg-yellow-500';
    if (rate >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="progress-page-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <TrophyIcon className="title-icon" />
            Progress Leaderboard
          </h1>
          <p className="page-subtitle">Track user progress and achievements</p>
        </div>
        
        <div className="header-actions">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'daily' ? 'active' : ''}`}
              onClick={() => setFilter('daily')}
            >
              Daily
            </button>
            <button 
              className={`filter-tab ${filter === 'weekly' ? 'active' : ''}`}
              onClick={() => setFilter('weekly')}
            >
              Weekly
            </button>
            <button 
              className={`filter-tab ${filter === 'all-time' ? 'active' : ''}`}
              onClick={() => setFilter('all-time')}
            >
              All Time
            </button>
          </div>
          
          <button 
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <ArrowPathIcon className={`btn-icon ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">
            <UsersIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{progressData.length}</div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {progressData.reduce((sum, user) => sum + (user.solved_count || 0), 0)}
            </div>
            <div className="stat-label">Total Solved</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <ChartBarIcon className="w-8 h-8 text-purple-600" />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {progressData.length > 0 
                ? Math.round(progressData.reduce((sum, user) => sum + (user.success_rate || 0), 0) / progressData.length)
                : 0}%
            </div>
            <div className="stat-label">Avg Success Rate</div>
          </div>
        </div>
      </div>

      {/* Last Updated Info */}
      {lastUpdated && (
        <div className="update-info">
          <ClockIcon className="w-4 h-4" />
          Last updated: {lastUpdated.toLocaleTimeString()}
          {refreshing && <span className="refreshing-indicator">Refreshing...</span>}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="leaderboard-container">
        {loading ? (
          <div className="loading-state">
            <ClockIcon className="loading-icon animate-spin" />
            <p>Loading leaderboard...</p>
          </div>
        ) : progressData.length === 0 ? (
          <div className="empty-state">
            <TrophyIcon className="empty-icon" />
            <p>No progress data found</p>
            <p className="empty-subtitle">Users need to solve questions to appear on the leaderboard</p>
          </div>
        ) : (
          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th className="rank-column">Rank</th>
                  <th className="user-column">User</th>
                  <th className="solved-column">Solved</th>
                  <th className="rate-column">Success Rate</th>
                  <th className="progress-column">Progress</th>
                </tr>
              </thead>
              <tbody>
                {progressData.map((user, index) => (
                  <tr key={user.id} className={`leaderboard-row ${index < 3 ? 'top-three' : ''}`}>
                    <td className="rank-cell">
                      <div className="rank-display">
                        {getRankIcon(user.rank || index + 1)}
                      </div>
                    </td>
                    <td className="user-cell">
                      <div className="user-info">
                        <div className="user-avatar-info">
                          {user.profile_photo ? (
                            <img 
                              src={user.profile_photo} 
                              alt={user.username}
                              className="user-avatar"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=random`;
                              }}
                            />
                          ) : (
                            <div className="user-avatar-placeholder">
                              {(user.full_name || user.username).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="user-details">
                            <div className="user-name">{user.full_name || user.username}</div>
                            <div className="username">@{user.username}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="solved-cell">
                      <div className="solved-display">
                        <span className="solved-number">{user.solved_count || 0}</span>
                        <span className="solved-label">questions</span>
                      </div>
                    </td>
                    <td className="rate-cell">
                      <div className="rate-display">
                        <span className={`rate-number ${
                          (user.success_rate || 0) >= 80 ? 'text-green-600' :
                          (user.success_rate || 0) >= 60 ? 'text-blue-600' :
                          (user.success_rate || 0) >= 40 ? 'text-yellow-600' :
                          (user.success_rate || 0) >= 20 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {user.success_rate || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="progress-cell">
                      <div className="progress-bar-container">
                        <div className="progress-bar-bg">
                          <div 
                            className={`progress-bar-fill ${getProgressBarColor(user.success_rate || 0)}`}
                            style={{ width: `${Math.min(user.success_rate || 0, 100)}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{user.success_rate || 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;
