import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon, 
  AcademicCapIcon, 
  GlobeAltIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  LinkIcon,
  ArrowRightStartOnRectangleIcon
} from '@heroicons/react/24/outline';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/config';

const ProfilePage = () => {
  const { user, logout } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    education: '',
    leetcode_username: '',
    geeksforgeeks_username: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/users/${user.id}`);
        setProfileData(response.data);
        setFormData({
          full_name: response.data.full_name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          location: response.data.location || '',
          education: response.data.education || '',
          leetcode_username: response.data.leetcode_username || '',
          geeksforgeeks_username: response.data.geeksforgeeks_username || ''
        });
      } catch (err) {
        setError('Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(`${API_BASE_URL}/api/users/${user.id}`, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        education: formData.education,
        leetcode_username: formData.leetcode_username,
        geeksforgeeks_username: formData.geeksforgeeks_username
      });

      setSuccess('Profile updated successfully!');
      setError('');
      
      // Refresh user data
      const response = await axios.get(`${API_BASE_URL}/api/users/${user.id}`);
      const updatedUser = response.data;
      // Update context with new user data
      // You might need to add an updateUser function to your AuthContext
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Re-fetch profile to discard changes
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/${user.id}`);
        setProfileData(response.data);
        setFormData({
          full_name: response.data.full_name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          location: response.data.location || '',
          education: response.data.education || '',
          leetcode_username: response.data.leetcode_username || '',
          geeksforgeeks_username: response.data.geeksforgeeks_username || ''
        });
      } catch (err) {
        setError('Failed to reload profile data');
      }
    };
    fetchProfile();
    setIsEditing(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!profileData) {
    return <div>No profile data found.</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1><UserIcon className="inline-block w-6 h-6 mr-2" />Profile</h1>
          <p>Manage your account information</p>
        </div>

        <div className="profile-content">
          <div className="profile-form">
            <div className="form-header">
              <h2>Personal Information</h2>
              {!isEditing ? (
                <button 
                  className="edit-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <PencilIcon className="inline-block w-4 h-4 mr-1" />Edit
                </button>
              ) : (
                <div className="edit-actions">
                  <button 
                    className="save-btn"
                    onClick={handleSave}
                  >
                    <CheckIcon className="inline-block w-4 h-4 mr-1" />Save
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={handleCancel}
                  >
                    <XMarkIcon className="inline-block w-4 h-4 mr-1" />Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="form-fields">
                <div className="field-group">
                    <label htmlFor="username">Username:</label>
                    <span className="field-value">{profileData.username}</span>
                </div>

                <div className="field-group">
                    <label htmlFor="fullName">Full Name:</label>
                    {isEditing ? (
                    <input
                        type="text"
                        id="fullName"
                        name="full_name"
                        value={formData.full_name || ''}
                        onChange={handleInputChange}
                        className="profile-input"
                    />
                    ) : (
                    <span className="field-value">{profileData.full_name}</span>
                    )}
              </div>

              <div className="field-group">
                <label htmlFor="leetcode_username">LeetCode ID:</label>
                {isEditing ? (
                  <input
                    type="text"
                    id="leetcode_username"
                    name="leetcode_username"
                    value={formData.leetcode_username || ''}
                    onChange={handleInputChange}
                    className="profile-input"
                  />
                ) : (
                  <div className="field-with-link">
                    <span className="field-value">{profileData.leetcode_username}</span>
                    {profileData.leetcode_username && (
                      <a 
                        href={`https://leetcode.com/${profileData.leetcode_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="platform-link"
                      >
                        <LinkIcon className="inline-block w-4 h-4 mr-1" />Visit LeetCode
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="field-group">
                <label htmlFor="geeksforgeeks_username">GeeksforGeeks ID:</label>
                {isEditing ? (
                  <input
                    type="text"
                    id="geeksforgeeks_username"
                    name="geeksforgeeks_username"
                    value={formData.geeksforgeeks_username || ''}
                    onChange={handleInputChange}
                    className="profile-input"
                  />
                ) : (
                  <div className="field-with-link">
                    <span className="field-value">{profileData.geeksforgeeks_username}</span>
                    {profileData.geeksforgeeks_username && (
                      <a 
                        href={`https://auth.geeksforgeeks.org/user/${profileData.geeksforgeeks_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="platform-link"
                      >
                        <LinkIcon className="inline-block w-4 h-4 mr-1" />Visit GFG
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Logout Section */}
          <div className="logout-section">
            <div className="logout-container">
              <div className="logout-header">
                <h3>Account Actions</h3>
                <p>Need to switch accounts or take a break?</p>
              </div>
              <div className="logout-button-wrapper">
                <button 
                  onClick={logout}
                  className="logout-btn"
                >
                  <ArrowRightStartOnRectangleIcon className="inline-block w-4 h-4 mr-1" />Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
