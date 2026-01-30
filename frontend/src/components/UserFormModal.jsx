import { useState, useEffect } from "react";

function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingUser,
  initialForm,
  error: externalError,
}) {
  const [form, setForm] = useState(initialForm);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const handleSubmit = async () => {
    const result = await onSubmit(form);
    if (result && result.success) {
      setForm({
        first_name: "",
        last_name: "",
        contact: "",
        email: "",
        address: "",
        password: "",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingUser ? "Edit User" : "Add New User"}</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="modal-form">
            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input
                  placeholder="Enter first name"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm({ ...form, first_name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  placeholder="Enter last name"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm({ ...form, last_name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label>Contact Number</label>
              <input
                placeholder="Enter 10-digit contact number"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                placeholder="Enter email address"
                value={form.email}
                disabled={editingUser !== null}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={editingUser !== null ? "disabled" : ""}
              />
              {editingUser && (
                <span className="field-hint">Email cannot be changed</span>
              )}
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                placeholder="Enter address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder={
                    editingUser ? "Password cannot be edited" : "Enter password"
                  }
                  value={form.password}
                  disabled={editingUser !== null}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className={editingUser !== null ? "disabled" : ""}
                />
                {!editingUser && (
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="toggle-pwd-btn"
                  >
                    {showPwd ? "Hide" : "Show"}
                  </button>
                )}
              </div>
              {editingUser && (
                <span className="field-hint">Password cannot be changed</span>
              )}
              {!editingUser && (
                <span className="field-hint">
                  8-12 chars with upper, lower, number & special (#$&@)
                </span>
              )}
            </div>

            {externalError && <div className="form-error">{externalError}</div>}

            <div className="modal-actions">
              <button onClick={onClose} className="cancel-button">
                Cancel
              </button>
              <button onClick={handleSubmit} className="submit-button">
                {editingUser ? "Update User" : "Add User"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserFormModal;
