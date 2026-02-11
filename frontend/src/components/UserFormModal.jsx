import React, { useState, useEffect } from "react";

function UserFormModal({ isOpen, onClose, onSubmit, editingUser, initialForm, error }) {
  const [form, setForm] = useState(initialForm);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => setForm(initialForm), [initialForm]);

  if (!isOpen) return null;

  const fields = [
    { label: "First Name", name: "first_name", type: "text", maxLength: 50, half: true },
    { label: "Last Name", name: "last_name", type: "text", maxLength: 50, half: true },
    { label: "Contact Number", name: "contact", type: "text", pattern: "\\d{10}", maxLength: 10, hint: "Exactly 10 digits" },
    { label: "Email Address", name: "email", type: "email", disabled: editingUser, hint: "Must be @gmail.com" },
    { label: "Address", name: "address", type: "textarea", rows: 3 },
    { label: "Role", name: "role", type: "select", options: [{ value: "user", label: "User (View Only)" }, { value: "admin", label: "Admin (Full Access)" }] }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{editingUser ? "Edit User" : "Add New User"}</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
          <div className="form-row">
            {fields.filter(f => f.half).map(f => (
              <div key={f.name} className="form-group">
                <label>{f.label} *</label>
                <input type={f.type} value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} required maxLength={f.maxLength} />
              </div>
            ))}
          </div>
          {fields.filter(f => !f.half).map(f => (
            <div key={f.name} className="form-group">
              <label>{f.label} *</label>
              {f.type === "textarea" ? <textarea value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} rows={f.rows} required /> :
               f.type === "select" ? <select value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} required>{f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> :
               <input type={f.type} value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} pattern={f.pattern} maxLength={f.maxLength} disabled={f.disabled} required />}
              {f.hint && <small className="field-hint">{f.hint}</small>}
            </div>
          ))}
          {!editingUser && (
            <div className="form-group">
              <label>Password *</label>
              <div className="password-input-wrapper">
                <input type={showPwd ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength="8" maxLength="12" required />
                <button type="button" className="toggle-password" onClick={() => setShowPwd(!showPwd)}>{showPwd ? "🙈" : "👁️"}</button>
              </div>
              <small className="field-hint">8-12 chars, uppercase, lowercase, number, special (#,$,&,@)</small>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
            <button type="submit" className="submit-btn">{editingUser ? "Update User" : "Add User"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;