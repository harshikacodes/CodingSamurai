import React, { useState } from 'react';
import axios from 'axios';
import { 
  PlusIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:3001';

const AdminDashboard = () => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // New Question Form State
  const [newQuestion, setNewQuestion] = useState({
    questionName: '',
    questionLink: '',
    type: 'homework',
    difficulty: 'easy'
  });



  // Show message to user
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  // Handle new question form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit new question
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/submit-question`, newQuestion);
      showMessage('Question added successfully!', 'success');
      setNewQuestion({
        questionName: '',
        questionLink: '',
        type: 'homework',
        difficulty: 'easy'
      });
    } catch (error) {
      showMessage('Failed to add question', 'error');
      console.error('Error adding question:', error);
    }
  };



  return (
    <div className="admin-dashboard">
      {/* Message Display */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Add New Question Form */}
      <div className="admin-section">
        <div className="flex justify-center">
          <form onSubmit={handleSubmit} className="question-form max-w-4xl w-full">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="questionName">Question Name</label>
              <input
                type="text"
                id="questionName"
                name="questionName"
                value={newQuestion.questionName}
                onChange={handleInputChange}
                placeholder="Enter question name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="questionLink">Question Link</label>
              <input
                type="url"
                id="questionLink"
                name="questionLink"
                value={newQuestion.questionLink}
                onChange={handleInputChange}
                placeholder="https://example.com/question"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={newQuestion.type}
                onChange={handleInputChange}
                required
              >
                <option value="homework">Homework</option>
                <option value="classwork">Classwork</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                name="difficulty"
                value={newQuestion.difficulty}
                onChange={handleInputChange}
                required
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          
            <div className="flex justify-center">
              <button type="submit" className="submit-btn max-w-xs">
                <PlusIcon className="inline-block w-4 h-4 mr-1" />
                Add Question
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
