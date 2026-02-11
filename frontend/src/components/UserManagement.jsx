import React, { useState, useMemo } from "react";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function UserManagement({ users, user, onAddUser, onEdit, onDelete, onToggleStatus, onBulkUpload }) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ firstName: "", lastName: "", email: "", contact: "", address: "", status: "all" });
  const [sort, setSort] = useState({ key: null, direction: "asc" });

  const isAdmin = user?.role === 'admin';

  const handleDownload = async (type) => {
    try {
      if (type === 'excel') {
        const data = await fetch(`http://localhost:5000/users/download/excel`).then(r => r.json());
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Users");
        XLSX.writeFile(wb, `users_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        const res = await fetch(`http://localhost:5000/users/download/${type}`);
        const blob = await res.blob();
        saveAs(blob, `users_${new Date().toISOString().split('T')[0]}.${type === 'csv' ? 'csv' : 'pdf'}`);
      }
    } catch (err) {
      alert(`Failed to download ${type.toUpperCase()}`);
    }
  };

  const filtered = useMemo(() => {
    let result = [...users];
    if (search) result = result.filter(u => `${u.first_name} ${u.last_name} ${u.email} ${u.contact} ${u.address}`.toLowerCase().includes(search.toLowerCase()));
    if (filters.firstName) result = result.filter(u => u.first_name.toLowerCase().includes(filters.firstName.toLowerCase()));
    if (filters.lastName) result = result.filter(u => u.last_name.toLowerCase().includes(filters.lastName.toLowerCase()));
    if (filters.email) result = result.filter(u => u.email.toLowerCase().includes(filters.email.toLowerCase()));
    if (filters.contact) result = result.filter(u => u.contact.includes(filters.contact));
    if (filters.address) result = result.filter(u => u.address.toLowerCase().includes(filters.address.toLowerCase()));
    if (filters.status !== "all") result = result.filter(u => filters.status === "active" ? u.is_active : !u.is_active);
    if (sort.key) {
      result.sort((a, b) => {
        let aVal = sort.key === "name" ? `${a.first_name} ${a.last_name}`.toLowerCase() : a[sort.key];
        let bVal = sort.key === "name" ? `${b.first_name} ${b.last_name}`.toLowerCase() : b[sort.key];
        return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * (sort.direction === "asc" ? 1 : -1);
      });
    }
    return result;
  }, [users, search, filters, sort]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const current = filtered.slice((page - 1) * perPage, page * perPage);
  const hasFilters = search || filters.firstName || filters.lastName || filters.email || filters.contact || filters.address || filters.status !== "all";

  const handleSort = (key) => setSort({ key, direction: sort.key === key && sort.direction === "asc" ? "desc" : "asc" });
  const getSortIcon = (key) => sort.key !== key ? "⇅" : sort.direction === "asc" ? "↑" : "↓";
  const clearFilters = () => {
    setSearch("");
    setFilters({ firstName: "", lastName: "", email: "", contact: "", address: "", status: "all" });
    setPage(1);
  };

  const columns = [
    { key: "name", label: "Name", sortable: true, filter: "firstName" },
    { key: "email", label: "Email", sortable: true, filter: "email" },
    { key: "contact", label: "Contact", sortable: true, filter: "contact" },
    { key: "address", label: "Address", sortable: true, filter: "address" },
    { key: "is_active", label: "Status", sortable: true }
  ];

  return (
    <div className="user-registration-content">
      <div className="table-header">
        <h2>Users List ({filtered.length})</h2>
        {isAdmin ? (
          <div className="header-buttons">
            <div className="download-dropdown">
              <button className="download-btn">📥 Download</button>
              <div className="download-menu">
                {['csv', 'excel', 'pdf'].map(type => <button key={type} onClick={() => handleDownload(type)}>{type.toUpperCase()} Format</button>)}
              </div>
            </div>
            <button onClick={onBulkUpload} className="bulk-upload-btn">📤 Bulk Upload</button>
            <button onClick={onAddUser} className="add-user-btn">+ Add User</button>
          </div>
        ) : (
          <div className="view-only-badge"><span className="badge-icon">👁️</span> View Only Mode</div>
        )}
      </div>

      <div className="controls-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input type="text" className="search-input" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="filter-controls">
          <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <select value={perPage} onChange={(e) => { setPage(1); setPerPage(Number(e.target.value)); }}>
            {[5, 10, 25, 50, 100].map(n => <option key={n} value={n}>{n} per page</option>)}
          </select>
          {hasFilters && <button onClick={clearFilters} className="clear-filters-btn">Clear Filters</button>}
        </div>
      </div>

      <div className="results-info">
        <p>Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length} users{filtered.length !== users.length && ` (filtered from ${users.length} total)`}</p>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state-table">
          <div className="empty-icon">{hasFilters ? "🔍" : "👥"}</div>
          <div className="empty-title">{hasFilters ? "No Users Found" : "No Users Yet"}</div>
          <div className="empty-text">{hasFilters ? "Try adjusting your search or filters" : "Click 'Add User' to register your first user!"}</div>
          {hasFilters && <button onClick={clearFilters} className="clear-filters-btn">Clear All Filters</button>}
        </div>
      ) : (
        <>
          <table className="users-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key} className={col.sortable ? "sortable" : ""} onClick={col.sortable ? () => handleSort(col.key) : undefined}>
                    <div className="th-content"><span>{col.label}</span>{col.sortable && <span className="sort-icon">{getSortIcon(col.key)}</span>}</div>
                    {col.filter && <input type="text" className="column-filter" placeholder="Filter..." value={filters[col.filter]} onChange={(e) => { setFilters({ ...filters, [col.filter]: e.target.value }); setPage(1); }} onClick={(e) => e.stopPropagation()} />}
                  </th>
                ))}
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {current.map(u => (
                <tr key={u.id}>
                  <td className="name-cell">
                    <div className="user-avatar">{u.profile_image ? <img src={u.profile_image} alt="Avatar" className="avatar-img" /> : <div className="avatar-placeholder">{u.first_name.charAt(0).toUpperCase()}</div>}</div>
                    <span>{u.first_name} {u.last_name}</span>
                    {u.role === "admin" && <span className="admin-badge">Admin</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>{u.contact}</td>
                  <td>{u.address}</td>
                  <td><span className={`status-badge ${u.is_active ? "active" : "inactive"}`}>{u.is_active ? "Active" : "Inactive"}</span></td>
                  {isAdmin && (
                    <td className="actions-cell">
                      <button className="icon-btn edit-btn" onClick={() => onEdit(u)} title="Edit">✏️</button>
                      <button className="icon-btn toggle-btn" onClick={() => onToggleStatus(u.id)} title="Toggle">🔄</button>
                      <button className="icon-btn delete-btn" onClick={() => onDelete(u.id)} title="Delete">🗑️</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(1)} disabled={page === 1} className="pagination-btn">⏮ First</button>
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="pagination-btn">← Prev</button>
              <div className="pagination-pages">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return <button key={pageNum} onClick={() => setPage(pageNum)} className={`pagination-page ${page === pageNum ? "active" : ""}`}>{pageNum}</button>;
                })}
              </div>
              <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="pagination-btn">Next →</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="pagination-btn">Last ⏭</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default UserManagement;