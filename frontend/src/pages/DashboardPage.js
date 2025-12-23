import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/config';
// Removed optimization imports
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import {
  PieChart,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Activity,
  RefreshCw,
  Trophy,
} from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const DashboardPage = () => {
  const { user, accessToken, isInitialized } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [userRank, setUserRank] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rankLoading, setRankLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch user rank from leaderboard
  const fetchUserRank = useCallback(async () => {
    if (!user?.id) {
      console.log('🏆 No user ID available for rank fetch');
      return;
    }
    
    try {
      setRankLoading(true);
      console.log('🏆 Fetching user rank for user ID:', user.id);
      
      // Fetch leaderboard data
      const response = await axios.get(`${API_BASE_URL}/api/leaderboard?period=all-time`);
      const leaderboard = response.data;
      
      console.log('🏆 Leaderboard response:', leaderboard.length, 'users');
      
      // Find current user's rank
      const currentUserEntry = leaderboard.find(entry => entry.id === user.id);
      if (currentUserEntry) {
        setUserRank(currentUserEntry.rank);
        console.log(`🏆 User rank: ${currentUserEntry.rank} out of ${leaderboard.length} users`);
      } else {
        // User not in top 50, fetch total users count and estimate rank
        setUserRank(null);
        console.log('🏆 User not in top 50 leaderboard');
      }
      
      setTotalUsers(leaderboard.length);
    } catch (error) {
      console.error('Error fetching user rank:', error);
      setUserRank(null);
      setTotalUsers(0);
    } finally {
      setRankLoading(false);
    }
  }, [user?.id]);

  // Fetch questions and user progress
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        // Fetch questions and user progress
        const [questionsResponse, userProgressResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/questions`),
          axios.get(`${API_BASE_URL}/api/users/${user.id}/progress`)
        ]);
        
        const questions = questionsResponse.data;
        const userProgressData = userProgressResponse.data;
        
        console.log('📊 Dashboard - Loaded:', questions.length, 'questions,', userProgressData.length, 'progress records');
        
        setQuestions(questions);
        
        // Convert progress array to object for easier lookup
        const progressMap = {};
        userProgressData.forEach(p => {
          progressMap[String(p.question_id)] = p.is_solved;
        });
        
        console.log('📈 Dashboard - Progress map:', Object.keys(progressMap).length, 'entries');
        console.log('🎯 Dashboard - Solved count:', Object.values(progressMap).filter(Boolean).length, 'questions');
        
        setUserProgress(progressMap);
        
        // Fetch user rank (don't await to prevent blocking)
        fetchUserRank().catch(err => {
          console.error('Error in fetchUserRank:', err);
        });
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(`Failed to load dashboard data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (isInitialized) {
      if (user?.id && accessToken) {
        fetchData();
      } else {
        setLoading(false);
      }
    }
  }, [user?.id, accessToken, isInitialized]);

  // Track userProgress state changes for debugging (simplified)
  useEffect(() => {
    if (Object.keys(userProgress).length > 0) {
      console.log('📊 Dashboard progress updated:', Object.values(userProgress).filter(Boolean).length, 'solved questions');
    }
  }, [userProgress]);

  // Function to refresh data manually
  const refreshData = async () => {
    if (!user || !accessToken) return;
    
    try {
      setLoading(true);
      
      // Fetch fresh data
      const [questionsResponse, userProgressResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/questions`),
        axios.get(`${API_BASE_URL}/api/users/${user.id}/progress`)
      ]);
      
      const questions = questionsResponse.data;
      const userProgressData = userProgressResponse.data;
      
      console.log('🔄 Dashboard Refresh - Questions data:', questions.length, 'questions');
      console.log('🔄 Dashboard Refresh - Progress data:', userProgressData.length, 'progress records');
      
      setQuestions(questions);
      
      // Convert progress array to object for easier lookup
      const progressMap = {};
      userProgressData.forEach(p => {
        progressMap[String(p.question_id)] = p.is_solved;
      });
      
      console.log('🔄 Dashboard Refresh - Progress updated:', Object.values(progressMap).filter(Boolean).length, 'solved questions');
      
      setUserProgress(progressMap);
      
      // Refresh user rank (don't await to prevent blocking)
      fetchUserRank().catch(err => {
        console.error('Error in refreshUserRank:', err);
      });
      
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const getStats = () => {
    const total = questions.length;
    const solved = Object.values(userProgress).filter(Boolean).length;
    const unsolved = total - solved;
    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
    
    console.log('📊 DASHBOARD STATS CALCULATION:');
    console.log(`   - Total questions: ${total}`);
    console.log(`   - UserProgress values:`, Object.values(userProgress).slice(0, 10));
    console.log(`   - UserProgress solved count: ${solved}`);
    console.log(`   - Calculated unsolved: ${unsolved}`);
    console.log(`   - Percentage: ${percentage}%`);
    
    const solvedByDifficulty = {
      easy: 0,
      medium: 0,
      hard: 0
    };

    questions.forEach(q => {
      const progressKey = String(q.id);
      const isSolvedForThisQuestion = userProgress[progressKey];
      if (isSolvedForThisQuestion) {
        solvedByDifficulty[q.difficulty]++;
        if (solvedByDifficulty.easy + solvedByDifficulty.medium + solvedByDifficulty.hard <= 3) {
          console.log(`   ✅ Question "${q.question_name}" (${q.difficulty}) is solved`);
        }
      }
    });
    
    console.log('   - Solved by difficulty:', solvedByDifficulty);

    return { total, solved, unsolved, percentage, solvedByDifficulty };
  };

  const stats = getStats();

  // Enhanced pie chart data with original green/amber theme
  const pieChartData = {
    labels: ['Solved', 'Pending'],
    datasets: [
      {
        data: [stats.solved, stats.unsolved],
        backgroundColor: [
          'rgba(16, 185, 129, 0.9)', // Emerald green for solved
          'rgba(251, 191, 36, 0.9)', // Amber for pending
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(251, 191, 36, 1)',
        ],
        borderWidth: 4,
        hoverBorderWidth: 6,
        hoverBackgroundColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(251, 191, 36, 1)',
        ],
        hoverBorderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(251, 191, 36, 1)',
        ],
        hoverOffset: 15,
        cutout: '60%',
      },
    ],
  };

  // Enhanced bar chart data with orange/teal theme
  const difficultyChartData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [
      {
        label: 'Solved Questions',
        data: [stats.solvedByDifficulty.easy, stats.solvedByDifficulty.medium, stats.solvedByDifficulty.hard],
        backgroundColor: [
          'rgba(20, 184, 166, 0.9)', // Teal for easy
          'rgba(251, 146, 60, 0.9)', // Orange for medium
          'rgba(248, 113, 113, 0.9)', // Coral red for hard
        ],
        borderColor: [
          'rgba(20, 184, 166, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(248, 113, 113, 1)',
        ],
        borderWidth: 3,
        borderRadius: 12,
        borderSkipped: false,
        hoverBackgroundColor: [
          'rgba(20, 184, 166, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(248, 113, 113, 1)',
        ],
        hoverBorderWidth: 4,
        hoverBorderColor: [
          'rgba(20, 184, 166, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(248, 113, 113, 1)',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 25,
          font: {
            size: 14,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#374151',
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const total = dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return {
                  text: `${label}: ${value} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: dataset.borderWidth,
                  pointStyle: 'circle',
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: '600'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} questions (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2500,
      easing: 'easeOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: '600'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        callbacks: {
          title: function(context) {
            return `${context[0].label} Difficulty`;
          },
          label: function(context) {
            return `Solved: ${context.parsed.y} questions`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 13,
            weight: '500',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#6B7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        border: {
          display: false
        }
      },
      x: {
        ticks: {
          font: {
            size: 13,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#374151'
        },
        grid: {
          display: false
        },
        border: {
          display: false
        }
      }
    },
    animation: {
      duration: 2500,
      easing: 'easeOutQuart',
      delay: (context) => {
        let delay = 0;
        if (context.type === 'data' && context.mode === 'default') {
          delay = context.dataIndex * 200 + context.datasetIndex * 100;
        }
        return delay;
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };


  // Error state
  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Error</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                if (user?.id && accessToken) {
                  // Retry data fetch
                  const fetchData = async () => {
                    try {
                      setLoading(true);
                      setError(null);
                      const [questionsResponse, progressResponse] = await Promise.all([
                        axios.get(`${API_BASE_URL}/questions`),
                        axios.get(`${API_BASE_URL}/api/users/${user.id}/progress`)
                      ]);
                      
                      setQuestions(questionsResponse.data);
                      
                      const progressMap = {};
                      progressResponse.data.forEach(p => {
                        progressMap[String(p.question_id)] = p.is_solved;
                      });
                      
                      setUserProgress(progressMap);
                      fetchUserRank().catch(err => console.error('Error in fetchUserRank:', err));
                    } catch (error) {
                      console.error('Error fetching data:', error);
                      setError(`Failed to load dashboard data: ${error.message}`);
                    } finally {
                      setLoading(false);
                    }
                  };
                  fetchData();
                }
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="loading-message">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Hero Stats Section */}
        <div className="hero-stats-section">
          <div className="hero-stats-grid">
            <div className="hero-stat-card hero-stat-solved group">
              <div className="hero-stat-icon">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div className="hero-stat-content">
                <div className="hero-stat-number">{stats.solved}</div>
                <div className="hero-stat-label">Solved</div>
                <div className="hero-stat-subtitle">Questions completed</div>
              </div>
            </div>
            
            <div className="hero-stat-card hero-stat-pending group">
              <div className="hero-stat-icon">
                <Clock className="w-7 h-7" />
              </div>
              <div className="hero-stat-content">
                <div className="hero-stat-number">{stats.unsolved}</div>
                <div className="hero-stat-label">Pending</div>
                <div className="hero-stat-subtitle">Questions remaining</div>
              </div>
            </div>
            
            <div className="hero-stat-card hero-stat-progress group">
              <div className="hero-stat-icon">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div className="hero-stat-content">
                <div className="hero-stat-number">{stats.percentage}%</div>
                <div className="hero-stat-label">Progress</div>
                <div className="hero-stat-subtitle">Completion rate</div>
              </div>
            </div>
            
            <div className="hero-stat-card hero-stat-rank group">
              <div className="hero-stat-icon">
                <Trophy className="w-7 h-7" />
              </div>
              <div className="hero-stat-content">
                <div className="hero-stat-number">
                  {rankLoading ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  ) : (
                    userRank ? `#${userRank}` : '--'
                  )}
                </div>
                <div className="hero-stat-label">Rank</div>
                <div className="hero-stat-subtitle">
                  {rankLoading ? (
                    'Calculating rank...'
                  ) : (
                    userRank ? `Out of ${totalUsers} users` : 'Not ranked yet'
                  )}
                </div>
              </div>
            </div>
            
            <div className="hero-stat-card hero-stat-total group">
              <div className="hero-stat-icon">
                <PieChart className="w-7 h-7" />
              </div>
              <div className="hero-stat-content">
                <div className="hero-stat-number">{stats.total}</div>
                <div className="hero-stat-label">Total</div>
                <div className="hero-stat-subtitle">Questions available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview Section */}
        <div className="progress-overview-section">
          <div className="progress-overview-card">
            <div className="progress-overview-header">
              <div className="progress-overview-title">
                <Activity className="w-6 h-6" />
                <span>Progress Overview</span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={refreshData}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
                <div className="progress-overview-percentage">{stats.percentage}%</div>
              </div>
            </div>
            <div className="progress-overview-bar">
              <div 
                className="progress-overview-fill" 
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
            <div className="progress-overview-stats">
              <span className="progress-overview-text">
                {stats.solved} of {stats.total} questions completed
              </span>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="analytics-section">
          <div className="analytics-header">
            <h2 className="analytics-title">
              <BarChart3 className="w-6 h-6" />
              Analytics & Insights
            </h2>
            <p className="analytics-subtitle">Detailed breakdown of your performance</p>
          </div>
          
          <div className="analytics-grid">
            <div className="analytics-card group">
              <div className="analytics-card-header">
                <div className="analytics-card-title">
                  <PieChart className="w-5 h-5" />
                  <span>Overall Progress</span>
                </div>
                <div className="analytics-card-subtitle">Solved vs Pending</div>
              </div>
              <div className="analytics-chart">
                <Pie data={pieChartData} options={chartOptions} />
              </div>
            </div>
            
            <div className="analytics-card group">
              <div className="analytics-card-header">
                <div className="analytics-card-title">
                  <BarChart3 className="w-5 h-5" />
                  <span>Difficulty Breakdown</span>
                </div>
                <div className="analytics-card-subtitle">Questions by difficulty level</div>
              </div>
              <div className="analytics-chart">
                <Bar data={difficultyChartData} options={barChartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;