import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ClipboardDocumentListIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import EditModal from '../components/EditModal';
import SearchAndFilter from '../components/SearchAndFilter';

const API_BASE_URL = 'http://localhost:3001';

// Helper function to identify platform based on URL
const identifyPlatform = (url) => {
  if (url.includes('geeksforgeeks.org') || url.includes('practice.geeksforgeeks.org')) {
    return 'gfg';
  } else if (url.includes('leetcode.com')) {
    return 'leetcode';
  } else if (url.includes('interviewbit.com')) {
    return 'interviewbit';
  }
  return 'unknown';
};

const QuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Show message to user
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  // Fetch all questions
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/questions`);
      setQuestions(response.data);
      setFilteredQuestions(response.data);
    } catch (error) {
      showMessage('Failed to fetch questions', 'error');
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update question
  const updateQuestion = async (id, questionData) => {
    try {
      await axios.put(`${API_BASE_URL}/questions/${id}`, questionData);
      showMessage('Question updated successfully!', 'success');
      fetchQuestions();
      setEditingQuestion(null);
    } catch (error) {
      showMessage('Failed to update question', 'error');
      console.error('Error updating question:', error);
    }
  };

  // Delete question
  const deleteQuestion = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await axios.delete(`${API_BASE_URL}/questions/${id}`);
        showMessage('Question deleted successfully!', 'success');
        fetchQuestions();
      } catch (error) {
        showMessage('Failed to delete question', 'error');
        console.error('Error deleting question:', error);
      }
    }
  };

  // Filter and search questions
  useEffect(() => {
    let filtered = questions.filter(question => {
      const matchesSearch = question.question_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === '' || question.type === filterType;
      const matchesDifficulty = filterDifficulty === '' || question.difficulty === filterDifficulty;
      
      return matchesSearch && matchesType && matchesDifficulty;
    });
    
    setFilteredQuestions(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [questions, searchTerm, filterType, filterDifficulty]);

  // Load questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

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

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="page-container">
      <div className="questions-header">
        <h1>
          <ClipboardDocumentListIcon className="inline-block w-8 h-8 mr-2" />
           All Questions
        </h1>
        <p className="page-description">
          Overview of all questions in the database
        </p>
      </div>

      {/* Statistics Cards */}
      {loading ? (
        <div className="loading-message">Loading questions...</div>
      ) : (
        <div className="stats-row">
          <div className="stat-card-small total">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Questions</div>
          </div>
          <div className="stat-card-small homework">
            <div className="stat-number">{stats.homework}</div>
            <div className="stat-label">Homework</div>
          </div>
          <div className="stat-card-small classwork">
            <div className="stat-number">{stats.classwork}</div>
            <div className="stat-label">Classwork</div>
          </div>
          <div className="stat-card-small easy">
            <div className="stat-number">{stats.easy}</div>
            <div className="stat-label">Easy</div>
          </div>
          <div className="stat-card-small medium">
            <div className="stat-number">{stats.medium}</div>
            <div className="stat-label">Medium</div>
          </div>
          <div className="stat-card-small hard">
            <div className="stat-number">{stats.hard}</div>
            <div className="stat-label">Hard</div>
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Search and Filter */}
      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        filterDifficulty={filterDifficulty}
        setFilterDifficulty={setFilterDifficulty}
        totalResults={filteredQuestions.length}
      />

      {/* Questions List */}
      <div className="questions-section">
        <div className="questions-container">
          <div className="section-header">
            <h2 className="section-title">
              All Questions - Manage
            </h2>
            <div className="results-count">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredQuestions.length)} of {filteredQuestions.length} questions
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
              {paginatedQuestions.map((question) => {
                return (
                  <div 
                    key={question.id}
                    className="w-full h-24 p-4 mb-4 flex items-center justify-between rounded-lg shadow-lg transition-all duration-300 border-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:shadow-xl hover:transform hover:scale-[1.02]"
                  >
                    {/* Left side - Question name */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                        {question.question_name}
                      </h3>
                    </div>
                    
                    {/* Right side - Actions and badges */}
                    <div className="flex items-center space-x-3">
                      {/* Type badge */}
                      <span className="px-3 py-1 bg-gray-600 dark:bg-gray-500 text-white text-xs rounded-full capitalize">
                        {question.type}
                      </span>
                      
                      {/* Difficulty badge */}
                      <span 
                        className={`px-3 py-1 text-xs rounded-full capitalize ${
                          question.difficulty === 'easy' 
                            ? 'bg-green-500 text-white' 
                            : question.difficulty === 'medium' 
                            ? 'bg-yellow-400 text-black' 
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {question.difficulty}
                      </span>
                      
                      {/* Solve link (same as main page) */}
                      <a 
                        href={question.question_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-primary-900 hover:bg-primary-800 text-white text-xs rounded transition-colors duration-200"
                      >
                        Solve Problem
                      </a>
                      
                      {/* Edit button (replacing bookmark) */}
                      <button 
                        onClick={() => setEditingQuestion(question)}
                        className="px-3 py-2 text-sm rounded transition-colors duration-200 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      
                      {/* Delete button (replacing solved status) */}
                      <button 
                        onClick={() => deleteQuestion(question.id)}
                        className="px-3 py-2 text-sm rounded transition-colors duration-200 bg-red-500 hover:bg-red-600 text-white flex items-center"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredQuestions.length > itemsPerPage && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-primary-900 text-white rounded hover:bg-primary-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Previous
            </button>
            
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-primary-900 text-white rounded hover:bg-primary-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingQuestion && (
        <EditModal
          question={editingQuestion}
          onUpdate={updateQuestion}
          onClose={() => setEditingQuestion(null)}
        />
      )}
    </div>
  );
};

export default QuestionsPage;
