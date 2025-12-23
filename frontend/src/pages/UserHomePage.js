import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import {
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  Square3Stack3DIcon,
  LinkIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import {
  TreePineIcon,
  BarChart3Icon,
  GitBranchIcon
} from 'lucide-react';
import QuestionCard from '../components/QuestionCard';
import FilterTabs from '../components/FilterTabs';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL, API_ENDPOINTS } from '../config/config';

const UserHomePage = () => {
  const { user, accessToken } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [solvedFilter, setSolvedFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('latest'); // Add sort filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState({});

  // Fetch all questions
  const fetchQuestions = useCallback(async () => {
    if (!user || !accessToken) return;

    try {
      const response = await axios.get(API_ENDPOINTS.QUESTIONS, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('Raw user progress API data:', response.data);
      setQuestions(response.data);
      setFilteredQuestions(response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  }, [user, accessToken]);

  // Fetch user progress
  const fetchUserProgress = useCallback(async () => {
    if (!user || !accessToken) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${user.id}/progress`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      console.log("📊 Raw user progress API data:", response.data);
      console.log(`📋 Found ${response.data.length} progress records`);

      const progressMap = {};
      response.data.forEach(progress => {
        // Map by question_id which is the actual foreign key to questions table
        progressMap[String(progress.question_id)] = progress;
        if (progress.is_solved) {
          console.log(`✅ Question ${progress.question_id} is marked as solved`);
        }
      });

      console.log("🗺️ progressMap created:", progressMap);
      console.log(`🎯 Total solved questions: ${Object.values(progressMap).filter(p => p.is_solved).length}`);

      // Use React state updater function to ensure state is properly set
      setUserProgress(prevProgress => {
        console.log("🔄 UserProgress state updating from:", Object.keys(prevProgress).length, "to", Object.keys(progressMap).length, "records");
        console.log("🔄 New progress map keys:", Object.keys(progressMap));
        return progressMap;
      });
      
      console.log("🔄 UserProgress state update called");
      
      // Debug the filter logic after progress is loaded
      setTimeout(() => {
        console.log('\n🔍 FILTER LOGIC DEBUG:');
        console.log('Progress records loaded:', Object.keys(progressMap).length);
        console.log(`Total solved questions: ${Object.values(progressMap).filter(p => p.is_solved).length}`);
      }, 100);

    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  }, [user, accessToken]);


  // Get bookmarked questions from localStorage
  const getBookmarkedQuestions = useCallback(() => {
    if (!user?.id) return;

    try {
      console.log('🔖 Loading bookmarks from localStorage for user:', user.id);
      
      const savedBookmarks = localStorage.getItem(`bookmarks_${user.id}`);
      const bookmarks = savedBookmarks ? JSON.parse(savedBookmarks) : {};
      
      console.log('🔖 Bookmarks loaded from localStorage:', bookmarks);
      console.log('🔖 Number of bookmarks:', Object.keys(bookmarks).length);
      
      setBookmarkedQuestions(bookmarks);
    } catch (error) {
      console.error('Error loading bookmarks from localStorage:', error);
      setBookmarkedQuestions({});
    }
  }, [user]);

  // Debug function to analyze filter logic
  const debugFilterLogic = useCallback(() => {
    console.log('\n🔍 FILTER LOGIC DEBUG:');
    console.log('Current filters:', { solvedFilter, activeFilter, difficultyFilter, searchTerm });
    console.log(`Total questions: ${questions.length}`);
    console.log(`Progress records: ${Object.keys(userProgress).length}`);
    
    const solvedCount = questions.filter(q => userProgress[String(q.id)]?.is_solved).length;
    const unsolvedCount = questions.length - solvedCount;
    
    console.log(`Questions solved: ${solvedCount}`);
    console.log(`Questions unsolved: ${unsolvedCount}`);
    
    if (solvedFilter !== 'all') {
      const filteredBySolved = questions.filter(q => {
        const isSolved = userProgress[String(q.id)]?.is_solved || false;
        return solvedFilter === 'solved' ? isSolved : !isSolved;
      });
      console.log(`Questions matching solvedFilter='${solvedFilter}': ${filteredBySolved.length}`);
    }
    
    console.log('Sample progress records:', Object.entries(userProgress).slice(0, 3));
  }, [questions, userProgress, solvedFilter, activeFilter, difficultyFilter, searchTerm]);
  
  // Note: Manual toggle removed - progress is now tracked via API sync only
  // Use the "Sync All" button to update progress from LeetCode/GFG APIs

  // Refresh solved status from GFG API
  const refreshGFGStatus = async () => {
    if (!user || !accessToken) return;

    try {
      setLoading(true);

      // Sync progress with GeeksforGeeks API using user ID
      const response = await axios.get(`${API_BASE_URL}/api/sync-gfg-progress/${user.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // Refresh user progress
      await fetchUserProgress();

      const stats = response.data.stats;
      alert(`GFG Progress synchronized!\n\nFound ${stats.totalGFGQuestions} GFG questions in database\nSolved ${stats.solvedQuestions} questions\nUpdated ${stats.updatedQuestions} records`);
    } catch (error) {
      console.error('Error refreshing GFG status:', error);
      if (error.response?.status === 400) {
        alert('Please add your GeeksforGeeks username in your profile first.');
      } else {
        alert('Failed to synchronize GFG progress. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh solved status from LeetCode API
  const refreshLeetCodeStatus = async () => {
    if (!user || !accessToken) return;

    try {
      setLoading(true);

      // Sync progress with LeetCode API using user ID
      const response = await axios.get(`${API_BASE_URL}/api/sync-leetcode-progress/${user.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // Refresh user progress
      await fetchUserProgress();

      const stats = response.data.stats;
      alert(`LeetCode Progress synchronized!\n\nFound ${stats.totalLeetCodeQuestions} LeetCode questions in database\nSolved ${stats.solvedQuestions} questions\nUpdated ${stats.updatedQuestions} records`);
    } catch (error) {
      console.error('Error refreshing LeetCode status:', error);
      if (error.response?.status === 400) {
        alert('Please add your LeetCode username in your profile first.');
      } else {
        alert('Failed to synchronize LeetCode progress. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh solved status from both GFG and LeetCode APIs
  const refreshAllStatus = async () => {
    if (!user || !accessToken) return;

    try {
      setLoading(true);

      // Sync progress with both platforms
      const response = await axios.get(`${API_BASE_URL}/api/sync-all-progress/${user.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // Refresh user progress with enhanced timing
      console.log('🔄 Refreshing user progress after sync...');
      await fetchUserProgress();
      
      // Force a longer delay to ensure React state updates are processed
      console.log('⏳ Waiting for state updates to propagate...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force a re-render by triggering a state change
      setLoading(false);
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      setLoading(false);
      
      console.log('✅ State updates should be complete now');
      
      const results = response.data.results;
      let message = 'Progress synchronized for all platforms!\n\n';

      if (results.gfg && results.gfg.success) {
        const gfgStats = results.gfg.stats;
        message += `GFG: Updated ${gfgStats.updatedQuestions} out of ${gfgStats.totalGFGQuestions} questions\n`;
      } else {
        message += `GFG: ${results.gfg?.error || 'Failed to sync'}\n`;
      }

      if (results.leetcode && results.leetcode.success) {
        const lcStats = results.leetcode.stats;
        message += `LeetCode: Updated ${lcStats.updatedQuestions} out of ${lcStats.totalLeetCodeQuestions} questions\n`;
      } else {
        message += `LeetCode: ${results.leetcode?.error || 'Failed to sync'}\n`;
      }

      console.log('✅ Sync completed, showing message:', message);
      alert(message);
    } catch (error) {
      console.error('Error refreshing all status:', error);
      alert('Failed to synchronize progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get date filter options
  const getDateFilteredQuestions = useCallback((questions) => {
    if (dateFilter === 'all') return questions;

    const now = new Date();
    const filterDate = new Date();

    switch (dateFilter) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      default:
        return questions;
    }

    return questions.filter(question => {
      const questionDate = new Date(question.created_at);
      return questionDate >= filterDate;
    });
  }, [dateFilter]);

  // Filter and sort questions based on search and filters
  useEffect(() => {
    console.log("🔍 FILTERING EFFECT - Starting filter with:");
    console.log(`   - ${questions.length} total questions`);
    console.log(`   - ${Object.keys(userProgress).length} progress records`);
    console.log(`   - solvedFilter: ${solvedFilter}`);
    console.log(`   - searchTerm: '${searchTerm}'`);
    console.log(`   - activeFilter: ${activeFilter}`);
    console.log(`   - difficultyFilter: ${difficultyFilter}`);
    
    let filtered = questions.filter((question, index) => {
      const matchesSearch = question.question_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = activeFilter === 'all' || question.type === activeFilter;
      const matchesDifficulty = difficultyFilter === 'all' || question.difficulty === difficultyFilter;

      // Check if question is solved based on user progress data
      const isSolved = userProgress[String(question.id)]?.is_solved || false;
      const matchesSolved = solvedFilter === 'all' ||
        (solvedFilter === 'solved' && isSolved) ||
        (solvedFilter === 'unsolved' && !isSolved);

      // Debug specific questions
      if (index < 3) {
        console.log(`   📄 Question "${question.question_name}" (ID: ${question.id}):`);
        console.log(`     - isSolved: ${isSolved} (from userProgress[${String(question.id)}])`);
        console.log(`     - matchesSolved (${solvedFilter}): ${matchesSolved}`);
        console.log(`     - overall match: ${matchesSearch && matchesType && matchesDifficulty && matchesSolved}`);
      }

      return matchesSearch && matchesType && matchesDifficulty && matchesSolved;
    });

    filtered = getDateFilteredQuestions(filtered);

    // Sort questions based on sortFilter
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);

      if (sortFilter === 'latest') {
        return dateB - dateA; // Newest first (descending)
      } else if (sortFilter === 'oldest') {
        return dateA - dateB; // Oldest first (ascending)
      }
      return 0;
    });

    console.log(`🎯 FILTERING RESULT: ${filtered.length} questions after filtering`);
    console.log(`   🔢 First few filtered questions:`, filtered.slice(0, 3).map(q => ({ 
      name: q.question_name, 
      id: q.id, 
      isSolved: userProgress[String(q.id)]?.is_solved || false 
    })));
    
    setFilteredQuestions(filtered);
  }, [questions, searchTerm, activeFilter, difficultyFilter, solvedFilter, dateFilter, sortFilter, userProgress, getDateFilteredQuestions]);

  // Track userProgress state changes for debugging
  useEffect(() => {
    console.log('🔄 USER PROGRESS STATE CHANGED in UserHomePage:');
    console.log(`   - Progress records count: ${Object.keys(userProgress).length}`);
    console.log(`   - Solved questions count: ${Object.values(userProgress).filter(p => p?.is_solved).length}`);
    console.log(`   - Sample progress records:`, Object.entries(userProgress).slice(0, 3));
    
    // Trigger debug function when userProgress changes
    if (Object.keys(userProgress).length > 0) {
      setTimeout(() => debugFilterLogic(), 50);
    }
  }, [userProgress, debugFilterLogic]);

  // Load questions and progress on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      if (user && accessToken) {
        await fetchQuestions();
        await fetchUserProgress();
        await getBookmarkedQuestions();
      }
    };
    fetchAllData();
  }, [user, accessToken, fetchQuestions, fetchUserProgress, getBookmarkedQuestions]);

  // Get statistics
  const getStats = () => {
    const total = questions.length;
    const homework = questions.filter(q => q.type === 'homework').length;
    const classwork = questions.filter(q => q.type === 'classwork').length;
    const easy = questions.filter(q => q.difficulty === 'easy').length;
    const medium = questions.filter(q => q.difficulty === 'medium').length;
    const hard = questions.filter(q => q.difficulty === 'hard').length;

    return { total, homework, classwork, easy, medium, hard };
  };

  const stats = getStats();
  const itemsPerPage = 10;

  // Save bookmarks to local storage
  const saveBookmarks = (bookmarks) => {
    if (!user?.id) return;
    localStorage.setItem(`bookmarks_${user.id}`, JSON.stringify(bookmarks));
  };

  const toggleBookmark = (questionId) => {
    if (!user?.id) return;

    try {
      console.log('🔖 Toggling bookmark for question:', questionId);
      
      const currentBookmarks = { ...bookmarkedQuestions };
      const isCurrentlyBookmarked = currentBookmarks[questionId];
      
      // Toggle bookmark state
      if (isCurrentlyBookmarked) {
        delete currentBookmarks[questionId];
      } else {
        currentBookmarks[questionId] = true;
      }
      
      // Save to localStorage
      localStorage.setItem(`bookmarks_${user.id}`, JSON.stringify(currentBookmarks));
      
      // Update state
      setBookmarkedQuestions(currentBookmarks);
      
      // Show success message
      const questionName = questions.find(q => q.id == questionId)?.question_name || 'Question';
      const action = isCurrentlyBookmarked ? 'removed from' : 'added to';
      const emoji = isCurrentlyBookmarked ? '❌' : '✅';
      const message = `${emoji} "${questionName}" ${action} bookmarks!`;
      
      console.log(message);
      
      // Optional: Show a visual notification (you can replace with toast library)
      if (window.alert) {
        setTimeout(() => {
          // Non-blocking alert alternative
          console.log('🔔 Bookmark notification:', message);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const paginate = (questions) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return questions.slice(startIndex, endIndex);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage * itemsPerPage < filteredQuestions.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="user-home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Master Your <span className="highlight">Coding Skills</span>
          </h1>
          <p className="hero-description">
            Code like a <span className="highlight">Samurai</span> — stay sharp, solve daily, and track every step of your DSA journey
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total Questions</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">3</span>
              <span className="stat-label">Difficulty Levels</span>
            </div>
          </div>
        </div>
        <div className="hero-illustration">
          <div className="dsa-visualization">
            <div className="dsa-title">Data Structures & Algorithms</div>
            <div className="dsa-items">
              <div className="dsa-item">
                <div className="dsa-icon"><TreePineIcon className="w-8 h-8" /></div>
                <div className="dsa-name">Trees</div>
              </div>
              <div className="dsa-item">
                <div className="dsa-icon"><BarChart3Icon className="w-8 h-8" /></div>
                <div className="dsa-name">Arrays</div>
              </div>
              <div className="dsa-item">
                <div className="dsa-icon"><LinkIcon className="w-8 h-8" /></div>
                <div className="dsa-name">Linked Lists</div>
              </div>
              <div className="dsa-item">
                <div className="dsa-icon"><Square3Stack3DIcon className="w-8 h-8" /></div>
                <div className="dsa-name">Stacks</div>
              </div>
              <div className="dsa-item">
                <div className="dsa-icon"><GitBranchIcon className="w-8 h-8" /></div>
                <div className="dsa-name">Graphs</div>
              </div>
              <div className="dsa-item">
                <div className="dsa-icon"><BoltIcon className="w-8 h-8" /></div>
                <div className="dsa-name">Sorting</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="search-section">
        <div className="search-container">
          <div className="search-bar relative">
            <input
              type="text"
              placeholder="Search questions by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-user pl-10"
            />
          </div>
          <FilterTabs
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            difficultyFilter={difficultyFilter}
            setDifficultyFilter={setDifficultyFilter}
            stats={stats}
          />

          <div className="additional-filters">
            <div className="filter-group">
              <label>By Date</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {user && (
              <div className="filter-group">
                <label>Progress:</label>
                <select
                  value={solvedFilter}
                  onChange={(e) => setSolvedFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Questions</option>
                  <option value="solved">Solved</option>
                  <option value="unsolved">Unsolved</option>
                </select>
              </div>
            )}

            <div className="filter-group">
              <label>Sort by:</label>
              <select
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value)}
                className="filter-select"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Questions Section */}
      <section className="questions-section">
        <div className="questions-container">
          <div className="section-header">
            <h2 className="section-title">
              {activeFilter === 'all'
                ? 'All Questions'
                : activeFilter === 'homework'
                  ? 'Homework Questions'
                  : 'Classwork Questions'}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="results-count">
                {filteredQuestions.length} questions
              </div>
              {user && (
                <div className="flex items-center space-x-2">
                  {/* <button 
                    onClick={refreshGFGStatus}
                    disabled={loading}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{loading ? 'Syncing...' : 'Sync GFG'}</span>
                  </button>
                   */}
                  {/* <button 
                    onClick={refreshLeetCodeStatus}
                    disabled={loading}
                    className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{loading ? 'Syncing...' : 'Sync LC'}</span>
                  </button> */}

                  <button
                    onClick={refreshAllStatus}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{loading ? 'Syncing...' : 'Sync All'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="questions-grid-horizontal">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="question-card-skeleton">
                  <div className="skeleton-header"></div>
                  <div className="skeleton-content"></div>
                  <div className="skeleton-footer"></div>
                </div>
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="no-questions">
              <div className="no-questions-icon"></div>
              <h3>No questions found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {paginate(filteredQuestions).map((question) => {
                const progressRecord = userProgress[String(question.id)];
                const isSolvedValue = progressRecord?.is_solved || false;
                
                console.log(
                  `🎯 RENDERING QuestionCard for "${question.question_name}":`
                );
                console.log(
                  `   - question.id: ${question.id} (type: ${typeof question.id})`
                );
                console.log(
                  `   - String(question.id): "${String(question.id)}"`
                );
                console.log(
                  `   - progressRecord:`, progressRecord
                );
                console.log(
                  `   - progressRecord?.is_solved: ${progressRecord?.is_solved}`
                );
                console.log(
                  `   - final isSolved prop: ${isSolvedValue}`
                );
                console.log(
                  `   - userProgress keys:`, Object.keys(userProgress).slice(0, 5)
                );

                return (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    isSolved={isSolvedValue}
                    isBookmarked={bookmarkedQuestions[question.id] || false}
                    onToggleBookmark={() => toggleBookmark(question.id)}
                  />
                );
              })}
            </div>
          )}

          {/* Pagination controls */}
          {filteredQuestions.length > itemsPerPage && (
            <div className="flex justify-between items-center mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 font-medium">
                  Page <span className="text-blue-600 font-bold">{currentPage}</span> of <span className="text-blue-600 font-bold">{Math.ceil(filteredQuestions.length / itemsPerPage)}</span>
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500 text-sm">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredQuestions.length)} of {filteredQuestions.length}
                </span>
              </div>
              <button
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                onClick={handleNextPage}
                disabled={currentPage * itemsPerPage >= filteredQuestions.length}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </section>

      <footer className="user-footer">
        <div className="footer-content">
          <p className="flex items-center justify-center">
            &copy; 2025 DSA Samurai. Keep practicing and keep growing!
            <RocketLaunchIcon className="inline-block w-5 h-5 ml-1" />
          </p>
        </div>
      </footer>
    </div>
  );
};

export default UserHomePage;
