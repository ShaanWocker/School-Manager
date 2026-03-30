import React, { useState } from 'react';
import { authService } from '../services/authService';

export default function SettingsView({ currentUser, setCurrentUser }) {
  const storedUser = currentUser || authService.getStoredUser() || {};

  // --- Edit Profile state ---
  const [profile, setProfile] = useState({
    firstName: storedUser.firstName || storedUser.name?.split(' ')[0] || '',
    lastName: storedUser.lastName || storedUser.name?.split(' ').slice(1).join(' ') || '',
    phone: storedUser.phone || '',
    avatar: storedUser.avatar || '',
  });
  const [profileMsg, setProfileMsg] = useState(null); // { type: 'success'|'error', text }
  const [profileLoading, setProfileLoading] = useState(false);

  // --- Change Password state ---
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // --- Handlers ---
  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const updated = await authService.updateProfile(profile);
      const updatedUser = { ...storedUser, ...profile, ...(updated.user || {}) };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (setCurrentUser) setCurrentUser(updatedUser);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (passwords.newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    setPasswordLoading(true);
    try {
      await authService.updatePassword(passwords.currentPassword, passwords.newPassword);
      setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to change password.',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '24px' }}>

        {/* Edit Profile */}
        <div className="chart-card">
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748' }}>Edit Profile</h2>
          </div>
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                className="form-input"
                type="text"
                name="firstName"
                value={profile.firstName}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                className="form-input"
                type="text"
                name="lastName"
                value={profile.lastName}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-input"
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Avatar (emoji or URL)</label>
              <input
                className="form-input"
                type="text"
                name="avatar"
                value={profile.avatar}
                onChange={handleProfileChange}
              />
            </div>
            {profileMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                background: profileMsg.type === 'success' ? '#f0fff4' : '#fff5f5',
                color: profileMsg.type === 'success' ? '#276749' : '#c53030',
                border: `1px solid ${profileMsg.type === 'success' ? '#9ae6b4' : '#feb2b2'}`,
              }}>
                {profileMsg.text}
              </div>
            )}
            <button
              className="action-button primary"
              type="submit"
              disabled={profileLoading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {profileLoading ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="chart-card">
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#2d3748' }}>Change Password</h2>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                className="form-input"
                type="password"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type="password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                className="form-input"
                type="password"
                name="confirmNewPassword"
                value={passwords.confirmNewPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            {passwordMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                background: passwordMsg.type === 'success' ? '#f0fff4' : '#fff5f5',
                color: passwordMsg.type === 'success' ? '#276749' : '#c53030',
                border: `1px solid ${passwordMsg.type === 'success' ? '#9ae6b4' : '#feb2b2'}`,
              }}>
                {passwordMsg.text}
              </div>
            )}
            <button
              className="action-button primary"
              type="submit"
              disabled={passwordLoading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {passwordLoading ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
