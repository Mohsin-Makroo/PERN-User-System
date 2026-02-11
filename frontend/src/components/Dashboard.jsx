import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import DashboardContent from "./DashboardContent";
import UserManagement from "./UserManagement";
import ProfileModal from "./ProfileModal";
import UserFormModal from "./UserFormModal";
import BulkUpload from "./BulkUpload";

function Dashboard({ user, onLogout, onProfileUpdate }) {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [modals, setModals] = useState({ profile: false, userForm: false, bulkUpload: false });
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ first_name: "", last_name: "", contact: "", email: "", address: "", password: "", role: "user" });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const isAdmin = () => user?.role === 'admin';
  const toggleModal = (name, state) => setModals({ ...modals, [name]: state });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/users");
      setUsers(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUser = () => {
    if (!isAdmin()) return alert("Access Denied: Admin only");
    setForm({ first_name: "", last_name: "", contact: "", email: "", address: "", password: "", role: "user" });
    setEditingId(null);
    setError("");
    toggleModal('userForm', true);
  };

  const handleEditUser = (u) => {
    if (!isAdmin()) return alert("Access Denied: Admin only");
    setForm({ first_name: u.first_name, last_name: u.last_name, contact: u.contact, email: u.email, address: u.address, password: "", role: u.role || "user" });
    setEditingId(u.id);
    setError("");
    toggleModal('userForm', true);
  };

  const addOrUpdateUser = async (formData) => {
    if (!isAdmin() && !editingId) return alert("Access Denied: Admin only");
    try {
      const res = await fetch(editingId ? `http://localhost:5000/users/${editingId}` : "http://localhost:5000/users", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userRole: user?.role })
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      await loadUsers();
      toggleModal('userForm', false);
      setEditingId(null);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteUser = async (id) => {
    if (!isAdmin() || !window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`http://localhost:5000/users/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userRole: user?.role }) });
      if (res.ok) await loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id) => {
    if (!isAdmin()) return alert("Access Denied: Admin only");
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
    try {
      const res = await fetch(`http://localhost:5000/users/status/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userRole: user?.role }) });
      if (!res.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
        alert("Failed to toggle status");
      }
    } catch (err) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
      console.error(err);
    }
  };

  const handleProfileImageUpload = async (base64Image) => {
    try {
      const res = await fetch(`http://localhost:5000/users/${user.id}/profile-image`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile_image: base64Image }) });
      if (!res.ok) return alert("Failed to upload image");
      onProfileUpdate({ ...user, profile_image: base64Image });
      toggleModal('profile', false);
    } catch (err) {
      alert("Upload failed");
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div className="main-content">
        <Header user={user} activeMenu={activeMenu} onProfileClick={() => toggleModal('profile', true)} />
        <div className="content-area">
          {activeMenu === "dashboard" ? <DashboardContent users={users} /> : <UserManagement users={users} user={user} onAddUser={handleAddUser} onEdit={handleEditUser} onDelete={deleteUser} onToggleStatus={toggleStatus} onBulkUpload={() => { if (!isAdmin()) return alert("Access Denied: Admin only"); toggleModal('bulkUpload', true); }} />}
        </div>
      </div>
      {modals.profile && <ProfileModal user={user} onClose={() => toggleModal('profile', false)} onLogout={onLogout} onImageUpload={handleProfileImageUpload} />}
      {modals.userForm && <UserFormModal isOpen={modals.userForm} onClose={() => toggleModal('userForm', false)} onSubmit={addOrUpdateUser} editingUser={editingId} initialForm={form} error={error} />}
      {modals.bulkUpload && <BulkUpload user={user} onClose={() => toggleModal('bulkUpload', false)} onComplete={() => { loadUsers(); toggleModal('bulkUpload', false); }} />}
    </div>
  );
}

export default Dashboard;