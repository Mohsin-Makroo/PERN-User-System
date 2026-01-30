import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import DashboardContent from "./DashboardContent";
import UserManagement from "./UserManagement";
import ProfileModal from "./ProfileModal";
import UserFormModal from "./UserFormModal";
import BulkUpload from "./BulkUpload";

function Dashboard({ user, onLogout, onProfileUpdate }) {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserFormModal, setShowUserFormModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    first_name: "", last_name: "", contact: "",
    email: "", address: "", password: ""
  });
  const [editingId, setEditingId] = useState(null);

  // Helper functions
  const isAdmin = () => user?.role === 'admin';
  const addUserRole = (data) => ({ ...data, userRole: user?.role });

  const loadUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/users");
      setUsers(await res.json());
    } catch (err) {
      console.error("Failed to load users");
    }
  };

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { if (activeMenu === "users") loadUsers(); }, [activeMenu]);

  const addOrUpdateUser = async (formData) => {
    setError("");
    const url = editingId ? `http://localhost:5000/users/${editingId}` : "http://localhost:5000/users";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addUserRole(formData))
      });

      if (!res.ok) {
        const data = await res.json();
        return setError(data.error);
      }

      await loadUsers();
      handleCloseUserModal();
    } catch (err) {
      setError("Operation failed");
    }
  };

  const deleteUser = async (id) => {
    if (!isAdmin()) return alert("Access Denied: Admin only");
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await fetch(`http://localhost:5000/users/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addUserRole({}))
      });
      await loadUsers();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const toggleStatus = async (id) => {
    if (!isAdmin()) return alert("Access Denied: Admin only");

    try {
      await fetch(`http://localhost:5000/users/status/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addUserRole({}))
      });
      await loadUsers();
    } catch (err) {
      alert("Failed to toggle status");
    }
  };

  const handleAddUser = () => {
    if (!isAdmin()) return alert("Access Denied: Admin only");
    setForm({ first_name: "", last_name: "", contact: "", email: "", address: "", password: "" });
    setEditingId(null);
    setError("");
    setShowUserFormModal(true);
  };

  const handleEditUser = (userData) => {
    if (!isAdmin()) return alert("Access Denied: Admin only");
    setForm({ ...userData, password: "" });
    setEditingId(userData.id);
    setError("");
    setShowUserFormModal(true);
  };

  const handleBulkUpload = () => {
    if (!isAdmin()) return alert("Access Denied: Admin only");
    setShowBulkUploadModal(true);
  };

  const handleProfileImageUpload = (file) => {
    // Simple validation - just check if file exists
    if (!file) {
      alert("Please select a file");
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const response = await fetch(`http://localhost:5000/users/${user.id}/profile-image`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_image: e.target.result })
        });

        if (response.ok) {
          onProfileUpdate({ ...user, profile_image: e.target.result });
          alert("Profile image updated successfully!");
        } else {
          alert("Failed to update profile image");
        }
      } catch (err) {
        alert("Failed to update profile image");
      }
    };

    reader.onerror = () => {
      alert("Failed to read file");
    };

    reader.readAsDataURL(file);
  };

  const handleCloseUserModal = () => {
    setShowUserFormModal(false);
    setEditingId(null);
    setForm({ first_name: "", last_name: "", contact: "", email: "", address: "", password: "" });
    setError("");
  };

  return (
    <div className="dashboard">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div className="main-content">
        <Header user={user} activeMenu={activeMenu} onProfileClick={() => setShowProfileModal(true)} />
        <div className="content">
          {activeMenu === "dashboard" ? (
            <DashboardContent user={user} users={users} />
          ) : (
            <UserManagement
              users={users}
              onAddUser={handleAddUser}
              onBulkUpload={handleBulkUpload}
              onEditUser={handleEditUser}
              onToggleStatus={toggleStatus}
              onDeleteUser={deleteUser}
              userRole={user.role}
            />
          )}
        </div>
      </div>

      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          onProfileImageUpload={handleProfileImageUpload}
        />
      )}

      {showUserFormModal && (
        <UserFormModal
          isOpen={showUserFormModal}
          onClose={handleCloseUserModal}
          onSubmit={addOrUpdateUser}
          editingUser={editingId}
          initialForm={form}
          error={error}
          isAdmin={isAdmin()}
        />
      )}

      {showBulkUploadModal && (
        <BulkUpload
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={loadUsers}
          userRole={user.role}
        />
      )}
    </div>
  );
}

export default Dashboard;