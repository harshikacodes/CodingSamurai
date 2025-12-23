import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CogIcon, PlusIcon, ClipboardDocumentListIcon, ArrowRightStartOnRectangleIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { AuthContext } from '../context/AuthContext';

const AdminHeader = () => {
  const location = useLocation();
  const { logout } = useContext(AuthContext);

  return (
    <header className="header admin-header">
      <div className="header-container">
        <div className="logo">
          <h1><CogIcon className="inline-block w-6 h-6 mr-2" />Admin Panel</h1>
        </div>
        <nav className="navigation">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <PlusIcon className="inline-block w-4 h-4 mr-1" />Add Question
          </Link>
          <Link 
            to="/questions" 
            className={`nav-link ${location.pathname === '/questions' ? 'active' : ''}`}
          >
            <ClipboardDocumentListIcon className="inline-block w-4 h-4 mr-1" />Manage Questions
          </Link>
          <Link 
            to="/admin/users" 
            className={`nav-link ${location.pathname === '/admin/users' ? 'active' : ''}`}
          >
            <UsersIcon className="inline-block w-4 h-4 mr-1" />All Users
          </Link>
          <Link 
            to="/admin/progress" 
            className={`nav-link ${location.pathname === '/admin/progress' ? 'active' : ''}`}
          >
            <ChartBarIcon className="inline-block w-4 h-4 mr-1" />Progress
          </Link>
          <button 
            onClick={logout}
            className="nav-link logout-btn"
          >
            <ArrowRightStartOnRectangleIcon className="inline-block w-4 h-4 mr-1" />Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default AdminHeader;
