import React, { useContext } from 'react';
import { StarIcon, CheckIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { AuthContext } from '../context/AuthContext';

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

const QuestionCard = ({ question, isSolved, isBookmarked, onToggleBookmark }) => {
  const { user } = useContext(AuthContext);
  const platform = identifyPlatform(question.question_link);
  

  return (
    <div 
      className={`w-full h-24 p-4 mb-4 flex items-center justify-between rounded-lg shadow-lg transition-all duration-300 border-2 ${
        isSolved 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-500' 
          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
      } hover:shadow-xl hover:transform hover:scale-[1.02]`}
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
        
        {/* Solve link */}
        <a 
          href={question.question_link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-4 py-2 bg-primary-900 hover:bg-primary-800 text-white text-xs rounded transition-colors duration-200"
        >
          Solve Problem
        </a>
        
        {/* Bookmark button */}
        {user && (
          <button 
            onClick={onToggleBookmark}
            className={`px-3 py-2 text-sm rounded transition-colors duration-200 ${
              isBookmarked 
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500'
            }`}
          >
            {isBookmarked ? <StarIconSolid className="w-4 h-4" /> : <StarIcon className="w-4 h-4" />}
          </button>
        )}
        
        {/* API-based solved status indicator */}
        {user && (
          <div className={`px-4 py-2 text-sm rounded flex items-center font-semibold transition-colors duration-200 ${
            isSolved 
              ? 'bg-green-500 hover:bg-green-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
          }`}>
            {isSolved ? (
              <>
                <CheckIconSolid className="inline-block w-4 h-4 mr-1" />
                <span>Solved</span>
              </>
            ) : (
              <>
                <span>Not Solved</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;
