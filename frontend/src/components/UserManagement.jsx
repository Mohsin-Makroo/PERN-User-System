import { useState, useMemo } from "react";

function UserManagement({ users, onAddUser, onBulkUpload, onEditUser, onToggleStatus, onDeleteUser, userRole }) {
  const [pagination, setPagination] = useState({ page: 1, perPage: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    firstName: "", lastName: "", email: "", contact: "", address: "", status: "all"
  });
  const [sort, setSort] = useState({ key: null, direction: "asc" });

  const isAdmin = userRole === 'admin';

  const handleSort = (key) => {
    setSort({ key, direction: sort.key === key && sort.direction === "asc" ? "desc" : "asc" });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({ firstName: "", lastName: "", email: "", contact: "", address: "", status: "all" });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getSortIcon = (key) => {
    if (sort.key !== key) return "⇅";
    return sort.direction === "asc" ? "↑" : "↓";
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...users];

    // Global search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(u =>
        u.first_name.toLowerCase().includes(lower) ||
        u.last_name.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        u.contact.includes(searchTerm) ||
        u.address.toLowerCase().includes(lower)
      );
    }

    // Column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (!value || value === "all") return;
      if (key === "status") {
        result = result.filter(u => value === "active" ? u.is_active : !u.is_active);
      } else {
        const field = key === "firstName" ? "first_name" : key === "lastName" ? "last_name" : key;
        result = result.filter(u => u[field].toLowerCase().includes(value.toLowerCase()));
      }
    });

    // Sorting
    if (sort.key) {
      result.sort((a, b) => {
        let aVal = sort.key === "name" ? `${a.first_name} ${a.last_name}` : a[sort.key];
        let bVal = sort.key === "name" ? `${b.first_name} ${b.last_name}` : b[sort.key];
        if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
        return sort.direction === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
    }

    return result;
  }, [users, searchTerm, filters, sort]);

  const totalPages = Math.ceil(filteredAndSorted.length / pagination.perPage);
  const currentUsers = filteredAndSorted.slice(
    (pagination.page - 1) * pagination.perPage,
    pagination.page * pagination.perPage
  );

  const hasActiveFilters = searchTerm || Object.values(filters).some(v => v && v !== "all");

  return (
    <div className="user-registration-content">
      {/* HEADER */}
      <div className="table-header">
        <h3>User Management</h3>
        {isAdmin && (
          <div className="header-buttons">
            <button className="bulk-upload-button" onClick={onBulkUpload}>
              <span className="bulk-icon">📤</span> Bulk Upload
            </button>
            <button className="add-user-button" onClick={onAddUser}>
              <span className="add-icon">+</span> Add User
            </button>
          </div>
        )}
        {!isAdmin && (
          <div className="view-only-badge">
            <span className="badge-icon">👁️</span> View Only Mode
          </div>
        )}
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search users..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          />
        </div>
        <div className="filter-controls">
          <select value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <select value={pagination.perPage} onChange={(e) => setPagination({ page: 1, perPage: Number(e.target.value) })}>
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="clear-filters-btn">Clear Filters</button>
          )}
        </div>
      </div>

      {/* RESULTS INFO */}
      <div className="results-info">
        Showing {filteredAndSorted.length > 0 ? (pagination.page - 1) * pagination.perPage + 1 : 0} to {Math.min(pagination.page * pagination.perPage, filteredAndSorted.length)} of {filteredAndSorted.length} users
        {filteredAndSorted.length !== users.length && ` (filtered from ${users.length} total)`}
      </div>

      {/* TABLE - ALWAYS SHOW WITH COLUMN FILTERS */}
      <table className="users-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => handleSort("name")}>
              <div className="th-content">
                <span>Name</span>
                <span className="sort-icon">{getSortIcon("name")}</span>
              </div>
              <input
                type="text"
                className="column-filter"
                placeholder="Filter name..."
                value={filters.firstName}
                onChange={(e) => handleFilterChange("firstName", e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </th>
            <th className="sortable" onClick={() => handleSort("email")}>
              <div className="th-content">
                <span>Email</span>
                <span className="sort-icon">{getSortIcon("email")}</span>
              </div>
              <input
                type="text"
                className="column-filter"
                placeholder="Filter email..."
                value={filters.email}
                onChange={(e) => handleFilterChange("email", e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </th>
            <th>
              <div className="th-content"><span>Contact</span></div>
              <input
                type="text"
                className="column-filter"
                placeholder="Filter contact..."
                value={filters.contact}
                onChange={(e) => handleFilterChange("contact", e.target.value)}
              />
            </th>
            <th>
              <div className="th-content"><span>Address</span></div>
              <input
                type="text"
                className="column-filter"
                placeholder="Filter address..."
                value={filters.address}
                onChange={(e) => handleFilterChange("address", e.target.value)}
              />
            </th>
            <th className="sortable" onClick={() => handleSort("is_active")}>
              <div className="th-content">
                <span>Status</span>
                <span className="sort-icon">{getSortIcon("is_active")}</span>
              </div>
            </th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredAndSorted.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 6 : 5} style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
                  {hasActiveFilters ? "🔍" : "👥"}
                </div>
                <div className="empty-title" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                  {hasActiveFilters ? "No Users Found" : "No Users Yet"}
                </div>
                <div className="empty-subtitle" style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
                  {hasActiveFilters ? "Try adjusting your search or filters" : "Click 'Add User' to register your first user!"}
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="empty-action-btn">Clear All Filters</button>
                )}
              </td>
            </tr>
          ) : (
            currentUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">
                      {user.first_name && user.last_name ? `${user.first_name[0]}${user.last_name[0]}` : 'U'}
                    </div>
                    <span>{user.first_name} {user.last_name}</span>
                    {user.role === 'admin' && <span className="role-badge admin-badge">Admin</span>}
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.contact}</td>
                <td>{user.address}</td>
                <td>
                  <span className={`status-badge ${user.is_active ? "active" : "inactive"}`}>
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                {isAdmin && (
                  <td className="action-buttons">
                    <button className="action-btn edit-btn" onClick={() => onEditUser(user)} title="Edit User">✏️</button>
                    <button className="action-btn toggle-btn" onClick={() => onToggleStatus(user.id)} title="Toggle Status">🔄</button>
                    <button className="action-btn delete-btn" onClick={() => onDeleteUser(user.id)} title="Delete User">🗑️</button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* PAGINATION - ONLY IF RESULTS */}
      {filteredAndSorted.length > 0 && (
        <div className="pagination">
          <button onClick={() => setPagination(p => ({ ...p, page: 1 }))} disabled={pagination.page === 1} className="pagination-btn">⏮ First</button>
          <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1} className="pagination-btn">← Prev</button>
          <div className="pagination-pages">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                  className={`pagination-btn ${pagination.page === pageNum ? "active" : ""}`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && <span>...</span>}
          </div>
          <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === totalPages} className="pagination-btn">Next →</button>
          <button onClick={() => setPagination(p => ({ ...p, page: totalPages }))} disabled={pagination.page === totalPages} className="pagination-btn">Last ⏭</button>
        </div>
      )}
    </div>
  );
}

export default UserManagement;