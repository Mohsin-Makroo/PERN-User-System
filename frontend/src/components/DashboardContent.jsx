import React from "react";

function DashboardContent({ users }) {
  const stats = [
    { icon: "👥", value: users.length, label: "Total Users" },
    { icon: "✅", value: users.filter(u => u.is_active).length, label: "Active Users" },
    { icon: "👑", value: users.filter(u => u.role === 'admin').length, label: "Admin Users" }
  ];

  return (
    <div className="dashboard-content">
      <div className="welcome-section"><h1>Welcome Back!</h1><p>Here's what's happening with your users today.</p></div>
      <div className="stats-grid">
        {stats.map((stat, i) => <div key={i} className="stat-card"><div className="stat-icon">{stat.icon}</div><div><div className="stat-value">{stat.value}</div><div className="stat-label">{stat.label}</div></div></div>)}
      </div>
    </div>
  );
}

export default DashboardContent;