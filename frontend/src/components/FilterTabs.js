import React from 'react';

const FilterTabs = ({ 
  activeFilter, 
  setActiveFilter, 
  difficultyFilter, 
  setDifficultyFilter, 
  stats 
}) => {
  const typeFilters = [
    { key: 'all', label: 'All Questions', count: stats.total, icon: '' },
    { key: 'homework', label: 'Homework', count: stats.homework, icon: '' },
    { key: 'classwork', label: 'Classwork', count: stats.classwork, icon: '' }
  ];

  const difficultyFilters = [
    { key: 'all', label: 'All Levels', count: stats.total, color: '#6b7280' },
    { key: 'easy', label: 'Easy', count: stats.easy, color: '#10b981' },
    { key: 'medium', label: 'Medium', count: stats.medium, color: '#ecaa37ff' },
    { key: 'hard', label: 'Hard', count: stats.hard, color: '#ef4444' }
  ];

  return (
    <div className="filter-tabs-container">
      {/* Type Filters */}
      <div className="filter-group-container">
        <h4 className="filter-group-title">Filter by Type</h4>
        <div className="filter-tabs">
          {typeFilters.map(filter => (
            <button
              key={filter.key}
              className={`filter-tab ${activeFilter === filter.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.key)}
            >
              <span className="filter-icon">{filter.icon}</span>
              <span className="filter-label">{filter.label}</span>
              <span className="filter-count">({filter.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Filters */}
      <div className="filter-group-container">
        <h4 className="filter-group-title">Filter by Difficulty</h4>
        <div className="filter-tabs difficulty-tabs">
          {difficultyFilters.map(filter => (
            <button
              key={filter.key}
              className={`filter-tab difficulty-tab ${difficultyFilter === filter.key ? 'active' : ''}`}
              onClick={() => setDifficultyFilter(filter.key)}
              style={{
                '--filter-color': filter.color,
                borderColor: difficultyFilter === filter.key ? filter.color : 'transparent'
              }}
            >
              <div 
                className="difficulty-dot"
                style={{ backgroundColor: filter.color }}
              ></div>
              <span className="filter-label">{filter.label}</span>
              <span className="filter-count">({filter.count})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterTabs;
