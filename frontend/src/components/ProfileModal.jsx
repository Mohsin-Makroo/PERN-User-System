import React, { useState } from "react";

function ProfileModal({ user, onClose, onLogout, onImageUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("File size must be less than 2MB");
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (preview) {
      onImageUpload(preview);
      setSelectedFile(null);
      setPreview(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h3>Profile</h3><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="profile-info">
          <div className="profile-avatar-large">
            {user.profile_image ? <img src={user.profile_image} alt="Profile" /> : <div className="avatar-text">{user.first_name.charAt(0).toUpperCase()}</div>}
          </div>
          <div className="info-row"><span className="info-label">Name:</span><span className="info-value">{user.first_name} {user.last_name}</span></div>
          <div className="info-row"><span className="info-label">Email:</span><span className="info-value">{user.email}</span></div>
          <div className="info-row">
            <span className="info-label">Role:</span>
            <span className="info-value">{user.role === 'admin' ? <span className="admin-badge">Admin</span> : <span className="user-badge">User</span>}</span>
          </div>
        </div>
        <div className="profile-image-upload">
          <h4>Update Profile Picture</h4>
          <label className="upload-btn-label"><input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />Choose Image</label>
          {selectedFile && <div className="selected-file-info"><p>{selectedFile.name}</p><button onClick={handleUpload} className="upload-confirm-btn">Upload</button></div>}
          <p className="upload-hint">Max size: 2MB (JPG, PNG, GIF)</p>
        </div>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </div>
    </div>
  );
}

export default ProfileModal;