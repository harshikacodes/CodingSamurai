import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  UsersIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  SyncIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:3001';

const UsersPage = () => {
  const { accessToken } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [syncingProgress, setSyncingProgress] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [progressStats, setProgressStats] = useState({});


  // New user form state
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'user',
    leetcodeUsername: '',
    geeksforgeeksUsername: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchProgressStats();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/debug/users`);
      setUsers(response.data.users || response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/leaderboard`);
      const stats = {};
      response.data.forEach(user => {
        stats[user.id] = {
          solved_count: user.solved_count,
          success_rate: user.success_rate
        };
      });
      setProgressStats(stats);
    } catch (error) {
      console.error('Error fetching progress stats:', error);
    }
  };


  const syncAllUsersProgress = async () => {
    if (window.confirm('This will sync progress for all users and update profile photos. This may take a while. Continue?')) {
      setSyncingProgress(true);
      try {
        const response = await axios.post(`${API_BASE_URL}/api/sync-all-users-progress`);
        
        if (response.data.success) {
          console.log(`✅ Sync completed! ${response.data.results.success.length} users synced successfully. ${response.data.results.profiles_updated} profile photos updated.`);
          fetchUsers(); // Refresh users data
          fetchProgressStats(); // Refresh progress stats
        } else {
          console.error('Sync completed with some errors');
        }
      } catch (error) {
        console.error('Failed to sync users progress');
        console.error('Sync error:', error);
      } finally {
        setSyncingProgress(false);
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users`, newUser);
      alert('User added successfully!');
      setNewUser({
        username: '',
        password: '',
        fullName: '',
        role: 'user',
        leetcodeUsername: '',
        geeksforgeeksUsername: ''
      });
      setShowAddModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to add user');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/api/users/${selectedUser.id}`, {
        fullName: selectedUser.full_name,
        leetcodeUsername: selectedUser.leetcode_username,
        geeksforgeeksUsername: selectedUser.geeksforgeeks_username
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      alert('User updated successfully!');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      if (error.response?.status === 401) {
        alert('You are not authorized to update users. Please log in again.');
      } else {
        alert(`Failed to update user: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  const openEditModal = (user) => {
    setSelectedUser({ ...user });
    setShowEditModal(true);
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      try {
        await axios.delete(`${API_BASE_URL}/api/users/${user.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        alert('User deleted successfully!');
        fetchUsers(); // Refresh users list
      } catch (error) {
        console.error('Failed to delete user:', error);
        if (error.response?.status === 401) {
          alert('You are not authorized to delete users. Please log in again.');
        } else {
          alert(`Failed to delete user: ${error.response?.data?.error || error.message}`);
        }
      }
    }
  };

  return (
    <div className="users-page-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <UsersIcon className="title-icon" />
            All Users Management
          </h1>
          <p className="page-subtitle">Manage users, view progress, and sync data</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlusIcon className="btn-icon" />
            Add User
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={syncAllUsersProgress}
            disabled={syncingProgress}
          >
            {syncingProgress ? (
              <ClockIcon className="btn-icon animate-spin" />
            ) : (
              <ChartBarIcon className="btn-icon" />
            )}
            {syncingProgress ? 'Syncing...' : 'Sync All Progress'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search users by username or full name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Users Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-number">{users.filter(u => u.role === 'user').length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{users.filter(u => u.role === 'admin').length}</div>
          <div className="stat-label">Admin Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {Object.values(progressStats).reduce((sum, stat) => sum + (stat.solved_count || 0), 0)}
          </div>
          <div className="stat-label">Total Questions Solved</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <ClockIcon className="loading-icon animate-spin" />
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <UsersIcon className="empty-icon" />
            <p>No users found</p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>LeetCode</th>
                <th>GeeksforGeeks</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="username-cell">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.username}</span>
                    </div>
                  </td>
                  <td className="font-medium text-gray-900 dark:text-white">
                    {user.full_name || <span className="text-gray-400 italic">Not set</span>}
                  </td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </span>
                  </td>
                  <td className="platform-cell">
                    {user.leetcode_username ? (
                      <div className="flex items-center space-x-1">
                        <span className="text-orange-500">🔗</span>
                        <span className="truncate">{user.leetcode_username}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Not set</span>
                    )}
                  </td>
                  <td className="platform-cell">
                    {user.geeksforgeeks_username ? (
                      <div className="flex items-center space-x-1">
                        <span className="text-green-500">🔗</span>
                        <span className="truncate">{user.geeksforgeeks_username}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Not set</span>
                    )}
                  </td>
                  <td className="progress-cell">
                    <div className="progress-info">
                      <span className="solved-count">
                        {progressStats[user.id]?.solved_count || 0} solved
                      </span>
                      <span className="success-rate">
                        ({progressStats[user.id]?.success_rate || 0}% success)
                      </span>
                    </div>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        className="btn-icon-small btn-edit"
                        onClick={() => openEditModal(user)}
                        title="Edit User"
                      >
                        <PencilIcon className="icon-sm" />
                      </button>
                      <button
                        className="btn-icon-small btn-delete"
                        onClick={() => handleDeleteUser(user)}
                        title="Delete User"
                      >
                        <TrashIcon className="icon-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New User</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddUser} className="modal-form">
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>LeetCode Username</label>
                <input
                  type="text"
                  value={newUser.leetcodeUsername}
                  onChange={(e) => setNewUser({...newUser, leetcodeUsername: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>GeeksforGeeks Username</label>
                <input
                  type="text"
                  value={newUser.geeksforgeeksUsername}
                  onChange={(e) => setNewUser({...newUser, geeksforgeeksUsername: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit User: {selectedUser.username}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditUser} className="modal-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={selectedUser.full_name || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, full_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>LeetCode Username</label>
                <input
                  type="text"
                  value={selectedUser.leetcode_username || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, leetcode_username: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>GeeksforGeeks Username</label>
                <input
                  type="text"
                  value={selectedUser.geeksforgeeks_username || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, geeksforgeeks_username: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
