function DashboardContent({ user, users }) {
  return (
    <div className="dashboard-content">
      <div className="welcome-section">
        <h1>Welcome back, {user.first_name}!</h1>
        <p>Here's what's happening with your users today.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">
              {users.filter((u) => u.is_active).length}
            </div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏸️</div>
          <div className="stat-content">
            <div className="stat-value">
              {users.filter((u) => !u.is_active).length}
            </div>
            <div className="stat-label">Inactive Users</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardContent;