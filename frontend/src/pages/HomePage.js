import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/config';
import QuestionForm from '../components/QuestionForm';

const HomePage = () => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Show message to user
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  // Add new question
  const addQuestion = async (questionData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/submit-question`, questionData);
      showMessage('✅ Question added successfully!', 'success');
      return response.data;
    } catch (error) {
      showMessage('❌ Failed to add question. Please try again.', 'error');
      console.error('Error adding question:', error);
      throw error;
    }
  };

  return (
    <div className="page-container">
      <div className="welcome-section">
        <h1>📝 Add New Question</h1>
        <p className="welcome-text">
          Welcome to the Question Management System! Add your coding questions and organize them by type and difficulty.
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Question Form */}
      <QuestionForm onSubmit={addQuestion} />

      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Organize</h3>
            <p>Keep your questions organized by type and difficulty</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>Quick Access</h3>
            <p>Add questions quickly with our simple form</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Track Progress</h3>
            <p>Monitor your coding practice progress</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
