import React, { useState, useEffect } from 'react';

const EditModal = ({ question, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    questionName: '',
    questionLink: '',
    type: '',
    difficulty: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (question) {
      setFormData({
        questionName: question.question_name,
        questionLink: question.question_link,
        type: question.type,
        difficulty: question.difficulty
      });
    }
  }, [question]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onUpdate(question.id, formData);
    } catch (error) {
      console.error('Error updating question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Question</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="editQuestionName">Question Name:</label>
            <input
              type="text"
              id="editQuestionName"
              name="questionName"
              value={formData.questionName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="editQuestionLink">Question Link:</label>
            <input
              type="url"
              id="editQuestionLink"
              name="questionLink"
              value={formData.questionLink}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Type:</label>
            <div className="radio-group">
              <div className="radio-option">
                <input
                  type="radio"
                  id="editHomework"
                  name="type"
                  value="homework"
                  checked={formData.type === 'homework'}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="editHomework">Homework</label>
              </div>
              <div className="radio-option">
                <input
                  type="radio"
                  id="editClasswork"
                  name="type"
                  value="classwork"
                  checked={formData.type === 'classwork'}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="editClasswork">Classwork</label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Difficulty:</label>
            <div className="radio-group">
              <div className="radio-option">
                <input
                  type="radio"
                  id="editEasy"
                  name="difficulty"
                  value="easy"
                  checked={formData.difficulty === 'easy'}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="editEasy">Easy</label>
              </div>
              <div className="radio-option">
                <input
                  type="radio"
                  id="editMedium"
                  name="difficulty"
                  value="medium"
                  checked={formData.difficulty === 'medium'}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="editMedium">Medium</label>
              </div>
              <div className="radio-option">
                <input
                  type="radio"
                  id="editHard"
                  name="difficulty"
                  value="hard"
                  checked={formData.difficulty === 'hard'}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="editHard">Hard</label>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="update-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
