import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, ChartBarIcon, TrophyIcon, BookmarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { AuthContext } from '../context/AuthContext';

const UserHeader = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  return (
    <header className="header user-header">
      <div className="header-container">
        <div className="logo">
          <h1>DSA Samurai</h1>
          <p className="logo-subtitle">Hello Ninja {user?.fullName?.split(' ')[0]}!</p>
        </div>
        <nav className="navigation">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <HomeIcon className="inline-block w-4 h-4 mr-1" />Home
          </Link>
          <Link 
            to="/dashboard" 
            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            <ChartBarIcon className="inline-block w-4 h-4 mr-1" />Dashboard
          </Link>
          <Link 
            to="/leaderboard" 
            className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}
          >
            <TrophyIcon className="inline-block w-4 h-4 mr-1" />Leaderboard
          </Link>
          <Link 
            to="/bookmarks" 
            className={`nav-link ${location.pathname === '/bookmarks' ? 'active' : ''}`}
          >
            <BookmarkIcon className="inline-block w-4 h-4 mr-1" />Bookmarks
          </Link>
          <Link 
            to="/profile" 
            className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
          >
            <UserIcon className="inline-block w-4 h-4 mr-1" />Profile
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default UserHeader;
