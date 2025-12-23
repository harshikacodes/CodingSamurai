import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { BookmarkIcon, ClipboardDocumentListIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import QuestionCard from '../components/QuestionCard';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL, API_ENDPOINTS } from '../config/config';

const BookmarksPage = () => {
  const { user, accessToken, isInitialized } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState({});
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);


  // Save bookmarks to local storage
  const saveBookmarks = (bookmarks) => {
    localStorage.setItem(`bookmarks_${user?.id}`, JSON.stringify(bookmarks));
  };

  // Get bookmarked questions from local storage or state
  const getBookmarkedQuestions = useCallback(() => {
    const saved = localStorage.getItem(`bookmarks_${user?.id}`);
    return saved ? JSON.parse(saved) : {};
  }, [user?.id]);

  // Fetch all questions
  const fetchQuestions = useCallback(async () => {
    if (!user || !accessToken) return;
    
    try {
      const response = await axios.get(API_ENDPOINTS.QUESTIONS);
      setQuestions(response.data);
      
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
      const response = await axios.get(`${API_BASE_URL}/api/users/${user.id}/progress`);
      const progressMap = {};
      response.data.forEach(progress => {
        // Map by question_id which is the actual foreign key to questions table
        progressMap[String(progress.question_id)] = progress;
      });
      setUserProgress(progressMap);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  }, [user, accessToken]);

  // Note: Manual toggle removed - progress is now tracked via API sync only

  // Toggle bookmark
  const toggleBookmark = (questionId) => {
    if (!user?.id) return;
    
    try {
      console.log('🔖 BookmarksPage - Toggling bookmark for question:', questionId);
      
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
      
      console.log('🔖 BookmarksPage - Bookmark toggled successfully');
      
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (isInitialized && user && accessToken) {
        // Initialize bookmarks from localStorage
        const storedBookmarks = getBookmarkedQuestions();
        setBookmarkedQuestions(storedBookmarks);
        
        await fetchQuestions();
        await fetchUserProgress();
      } else if (isInitialized) {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [user, accessToken, isInitialized, getBookmarkedQuestions]);

  // Filter only bookmarked questions
  const bookmarkedQuestionsList = questions.filter(question => 
    bookmarkedQuestions[question.id]
  );

  return (
    <div className="bookmarks-page max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center">
          <BookmarkIcon className="w-8 h-8 mr-3" />
          My Bookmarks
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Your saved questions for quick access
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : bookmarkedQuestionsList.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-4">
            <ClipboardDocumentListIcon className="w-24 h-24 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            No bookmarks yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Start bookmarking questions to build your collection!
          </p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Browse Questions
          </a>
        </div>
      ) : (
        <div>
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center">
                  <ChartBarIcon className="w-5 h-5 mr-2" />
                  {bookmarkedQuestionsList.length} bookmarked questions
                </span>
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                {bookmarkedQuestionsList.filter(q => userProgress[String(q.id)]?.is_solved).length} solved
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {bookmarkedQuestionsList.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                isSolved={userProgress[String(question.id)]?.is_solved || false}
                isBookmarked={bookmarkedQuestions[question.id] || false}
                onToggleBookmark={() => toggleBookmark(question.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;
