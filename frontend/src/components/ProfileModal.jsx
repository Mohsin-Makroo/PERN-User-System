import { useState } from "react";

function ProfileModal({ user, onClose, onLogout, onProfileImageUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onProfileImageUpload(selectedFile);
      setSelectedFile(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Profile Settings</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="profile-info">
            <div className="profile-avatar-large">
              {user.profile_image ? (
                <img src={user.profile_image} alt="Profile" />
              ) : (
                <span className="avatar-text">
                  {user.first_name[0]}{user.last_name[0]}
                </span>
              )}
            </div>

            <div className="profile-details">
              <h4>{user.first_name} {user.last_name}</h4>
              <p>{user.email}</p>
              {user.role === 'admin' && (
                <span className="role-badge admin-badge">Admin</span>
              )}
            </div>
          </div>

          <div className="profile-image-upload">
            <h4>Update Profile Picture</h4>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleFileSelect}
              id="profile-pic-upload"
              style={{ display: "none" }}
            />
            <label htmlFor="profile-pic-upload" className="upload-btn-label">
              Choose Image
            </label>
            {selectedFile && (
              <div className="selected-file-info">
                <span>{selectedFile.name}</span>
                <button onClick={handleUpload} className="upload-confirm-btn">
                  Upload
                </button>
              </div>
            )}
            <p className="upload-hint">Max 2MB (JPG, PNG, GIF)</p>
          </div>

          <div className="modal-actions">
            <button onClick={onLogout} className="logout-button">
              Sign Out
            </button>
            <button onClick={onClose} className="cancel-button">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;