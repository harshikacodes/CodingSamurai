import React, { useState } from 'react';

const QuestionForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    questionName: '',
    questionLink: '',
    type: '',
    difficulty: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await onSubmit(formData);
      // Reset form on successful submission
      setFormData({
        questionName: '',
        questionLink: '',
        type: '',
        difficulty: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Add New Question</h2>
      <form onSubmit={handleSubmit} className="question-form">
        <div className="form-group">
          <label htmlFor="questionName">Question Name:</label>
          <input
            type="text"
            id="questionName"
            name="questionName"
            value={formData.questionName}
            onChange={handleChange}
            required
            placeholder="Enter question name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="questionLink">Question Link:</label>
          <input
            type="url"
            id="questionLink"
            name="questionLink"
            value={formData.questionLink}
            onChange={handleChange}
            required
            placeholder="https://example.com"
          />
        </div>

        <div className="form-group">
          <label>Type:</label>
          <div className="radio-group">
            <div className="radio-option">
              <input
                type="radio"
                id="homework"
                name="type"
                value="homework"
                checked={formData.type === 'homework'}
                onChange={handleChange}
                required
              />
              <label htmlFor="homework">Homework</label>
            </div>
            <div className="radio-option">
              <input
                type="radio"
                id="classwork"
                name="type"
                value="classwork"
                checked={formData.type === 'classwork'}
                onChange={handleChange}
                required
              />
              <label htmlFor="classwork">Classwork</label>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Difficulty:</label>
          <div className="radio-group">
            <div className="radio-option">
              <input
                type="radio"
                id="easy"
                name="difficulty"
                value="easy"
                checked={formData.difficulty === 'easy'}
                onChange={handleChange}
                required
              />
              <label htmlFor="easy">Easy</label>
            </div>
            <div className="radio-option">
              <input
                type="radio"
                id="medium"
                name="difficulty"
                value="medium"
                checked={formData.difficulty === 'medium'}
                onChange={handleChange}
                required
              />
              <label htmlFor="medium">Medium</label>
            </div>
            <div className="radio-option">
              <input
                type="radio"
                id="hard"
                name="difficulty"
                value="hard"
                checked={formData.difficulty === 'hard'}
                onChange={handleChange}
                required
              />
              <label htmlFor="hard">Hard</label>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding Question...' : 'Add Question'}
        </button>
      </form>
    </div>
  );
};

export default QuestionForm;
