import React from 'react';

const SearchAndFilter = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterDifficulty,
  setFilterDifficulty,
  totalResults
}) => {
  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterDifficulty('');
  };

  return (
    <div className="search-filter-container">
      <div className="search-section">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="🔍 Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      <div className="filter-section">
        <div className="filter-group">
          <label>Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="homework">Homework</option>
            <option value="classwork">Classwork</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Difficulty:</label>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="filter-select"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        
        <button onClick={clearFilters} className="clear-filters-btn">
          🧹 Clear Filters
        </button>
      </div>
      
      <div className="results-info">
        <span className="results-count">
          {totalResults} question{totalResults !== 1 ? 's' : ''} found
        </span>
      </div>
    </div>
  );
};

export default SearchAndFilter;
