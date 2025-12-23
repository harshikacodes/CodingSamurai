import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/config';
import { 
  TrophyIcon, 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  FireIcon,
  CheckCircleIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { 
  TrophyIcon as TrophyIconSolid,
} from '@heroicons/react/24/solid';

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all-time');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Enhanced static demo data with more details
// Removed GFG photo fetching for performance

// Fetch leaderboard data from backend API
const fetchLeaderboardData = async (filter) => {
  try {
    const periodMap = {
      'daily': 'daily',
      'weekly': 'weekly', 
      'all-time': 'all-time'
    };
    
    const period = periodMap[filter] || 'all-time';
    const response = await fetch(`${API_BASE_URL}/api/leaderboard?period=${period}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('No leaderboard data available');
    }
    
    // Limit to top 10 users
    const top10Data = data.slice(0, 10);
    
    // Skip individual profile fetching for performance - just use basic user data
    const enrichedData = top10Data.map((user) => ({
      ...user,
      photo: null, // No profile photos for now
      streak: Math.floor(Math.random() * 30) + 1, // Mock streak for now
      easy: Math.floor(user.solved_count * 0.4),
      medium: Math.floor(user.solved_count * 0.4), 
      hard: Math.floor(user.solved_count * 0.2)
    }));
    
    return enrichedData;
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    throw new Error('Failed to fetch leaderboard data. Please check if the backend server is running.');
  }
};

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(''); // Clear any previous errors
const data = await fetchLeaderboardData(filter);
        setLeaderboardData(data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Leaderboard fetch error:', err);
        setError(`Failed to fetch leaderboard data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [filter]);

  const getAvatarInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (rank) => {
    const colors = {
      1: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
      2: 'bg-gradient-to-br from-gray-300 to-gray-500',
      3: 'bg-gradient-to-br from-orange-400 to-orange-600'
    };
    return colors[rank] || 'bg-gradient-to-br from-blue-400 to-blue-600';
  };

  const UserAvatar = ({ user, size = 'w-10 h-10', textSize = 'text-sm', showBorder = false }) => {
    // Always show initials since we removed profile photos for performance
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold ${textSize} shadow-lg ${showBorder ? 'ring-2 ring-white ring-offset-2' : ''}`}>
        {getAvatarInitials(user.full_name || user.username)}
      </div>
    );
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <TrophyIcon className="w-16 h-16 text-yellow-500 mx-auto" />
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const topThree = leaderboardData.slice(0, 3);
  const restOfUsers = leaderboardData.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <TrophyIconSolid className="w-12 h-12 text-yellow-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Leaderboard</h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300">Celebrating our coding champions</p>
          
          {/* Stats and Last Updated */}
          <div className="flex justify-center items-center gap-6 mt-4">
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              {/* <UserGroupIcon className="w-4 h-4 mr-1" /> */}
              {/* <span className="text-sm">{leaderboardData.length} participants</span> */}
            </div>
            {lastUpdated && (
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <CalendarIcon className="w-4 h-4 mr-1" />
                <span className="text-sm">Updated {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
            <button
              onClick={() => {
                setError('');
                setLoading(true);
                const fetchLeaderboard = async () => {
                  try {
                    const data = await fetchLeaderboardData(filter);
                    setLeaderboardData(data);
                    setLastUpdated(new Date());
                  } catch (err) {
                    setError('Failed to fetch leaderboard data');
                  } finally {
                    setLoading(false);
                  }
                };
                fetchLeaderboard();
              }}
              className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              <span className="text-sm">Refresh click</span>
            </button>
            
            {/* Removed sync photos button for performance */}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-lg">
            {['daily', 'weekly', 'all-time'].map((period) => (
              <button
                key={period}
                onClick={() => setFilter(period)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  filter === period
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {period === 'all-time' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Podium for Top 3 */}
        {topThree.length >= 1 && (
          <div className="mb-16">
            {/* Winner (1st Place) - Larger and Centered */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-4 border-yellow-400 transform hover:scale-105 transition-all duration-300">
                  {/* Crown */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-yellow-400 rounded-full p-3 shadow-lg">
                      <TrophyIconSolid className="w-8 h-8 text-yellow-700" />
                    </div>
                  </div>
                  
                  {/* Avatar */}
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 mb-4">
                      <UserAvatar user={topThree[0]} size="w-24 h-24" textSize="text-2xl" showBorder={true} />
                    </div>
                    
                    {/* User Info */}
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                      {topThree[0].full_name || topThree[0].username}
                    </h3>
                    <div className="text-yellow-600 font-semibold text-lg mb-4">🥇 Champion</div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <div className="text-2xl font-bold text-green-600">{topThree[0].solved_count}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Problems Solved</div>
                      </div>
                      <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <div className="text-2xl font-bold text-blue-600">{topThree[0].success_rate}%</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Success Rate</div>
                      </div>
                    </div>

                    {/* Detailed breakdown for winner */}
                    {topThree[0].easy !== undefined && (
                      <div className="mt-4 w-full">
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Problem Breakdown:</div>
                        <div className="flex justify-between text-xs">
                          <span className="text-green-600">Easy: {topThree[0].easy}</span>
                          <span className="text-yellow-600">Medium: {topThree[0].medium}</span>
                          <span className="text-red-600">Hard: {topThree[0].hard}</span>
                        </div>
                        {topThree[0].streak && (
                          <div className="flex items-center justify-center mt-2 text-orange-600">
                            <FireIcon className="w-4 h-4 mr-1" />
                            <span className="text-sm">{topThree[0].streak} day streak</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2nd and 3rd Place Side by Side */}
            {topThree.length >= 2 && (
              <div className="flex justify-center gap-8">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl border-2 border-gray-300 transform hover:scale-105 transition-all duration-300">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 mb-3">
                        <UserAvatar user={topThree[1]} size="w-20 h-20" textSize="text-xl" showBorder={true} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                        {topThree[1].full_name || topThree[1].username}
                      </h3>
                      <div className="text-gray-500 font-semibold mb-3">🥈 Runner-up</div>
                      <div className="grid grid-cols-2 gap-3 w-full">
                        <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                          <div className="text-lg font-bold text-green-600">{topThree[1].solved_count}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">Solved</div>
                        </div>
                        <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                          <div className="text-lg font-bold text-blue-600">{topThree[1].success_rate}%</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">Success</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl border-2 border-orange-300 transform hover:scale-105 transition-all duration-300">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 mb-3">
                        <UserAvatar user={topThree[2]} size="w-20 h-20" textSize="text-xl" showBorder={true} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                        {topThree[2].full_name || topThree[2].username}
                      </h3>
                      <div className="text-orange-600 font-semibold mb-3">🥉 Third Place</div>
                      <div className="grid grid-cols-2 gap-3 w-full">
                        <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                          <div className="text-lg font-bold text-green-600">{topThree[2].solved_count}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">Solved</div>
                        </div>
                        <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                          <div className="text-lg font-bold text-blue-600">{topThree[2].success_rate}%</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">Success</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Rest of the Leaderboard */}
        {restOfUsers.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-8">Other Competitors</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Problems Solved
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Success Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {restOfUsers.map((user, index) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-lg font-bold text-gray-600 dark:text-gray-300">
                              #{user.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="mr-4">
                              <UserAvatar user={user} size="w-10 h-10" textSize="text-sm" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.full_name || user.username}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                              {user.solved_count}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <ChartBarIcon className="w-5 h-5 text-blue-500 mr-2" />
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                              {user.success_rate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {leaderboardData.length === 0 && (
          <div className="text-center py-16">
            <TrophyIcon className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
              No data available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try selecting a different time period
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
