import React from 'react';

// Helper function to identify platform based on URL
const identifyPlatform = (url) => {
  if (url.includes('geeksforgeeks.org') || url.includes('practice.geeksforgeeks.org')) {
    return 'GeeksforGeeks';
  } else if (url.includes('leetcode.com')) {
    return 'LeetCode';
  } else if (url.includes('interviewbit.com')) {
    return 'InterviewBit';
  }
  return 'Other';
};

const QuestionList = ({ questions, loading, onEdit, onDelete }) => {
  if (loading) {
    return <div className="loading-message">Loading questions...</div>;
  }

  if (questions.length === 0) {
    return <div className="no-questions-message">No questions found.</div>;
  }

  return (
    <div className="question-list-container">
      <h2>All Questions</h2>
      <table className="question-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Link</th>
            <th>Type</th>
            <th>Difficulty</th>
            <th>Platform</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {questions.map(q => (
            <tr key={q.id}>
              <td>{q.question_name}</td>
              <td>
                <a href={q.question_link} target="_blank" rel="noopener noreferrer">
                  View Link
                </a>
              </td>
              <td className={`type-${q.type}`}>{q.type}</td>
              <td className={`difficulty-${q.difficulty}`}>{q.difficulty}</td>
              <td className="platform-cell">
                <span className={`platform-badge ${
                  identifyPlatform(q.question_link) === 'GeeksforGeeks' ? 'gfg' :
                  identifyPlatform(q.question_link) === 'LeetCode' ? 'leetcode' :
                  identifyPlatform(q.question_link) === 'InterviewBit' ? 'interviewbit' : 'other'
                }`}>
                  {identifyPlatform(q.question_link)}
                </span>
              </td>
              <td>
                <button 
                  className="edit-btn" 
                  onClick={() => onEdit(q)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => onDelete(q.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QuestionList;
