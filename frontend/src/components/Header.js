import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const UserHeader = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="header user-header">
      <div className="header-container">
        <div className="logo">
          <h1> DSA Samurai</h1>
          <p className="logo-subtitle">Welcome back, {user?.fullName}!</p>
        </div>
        <nav className="navigation">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/dashboard"
            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            to="/leaderboard"
            className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}
          >
             Leaderboard
          </Link>
          <Link
            to="/profile"
            className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
          >
            Profile
          </Link>
          <button
            onClick={logout}
            className="nav-link logout-btn"
         >
             Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default UserHeader;
