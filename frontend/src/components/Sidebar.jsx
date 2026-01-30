function Sidebar({ activeMenu, setActiveMenu }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">UM</div>
          <span>UserMgmt</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activeMenu === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveMenu("dashboard")}
        >
          <span className="nav-icon">📊</span>
          <span>Dashboard</span>
        </button>
        <button
          className={`nav-item ${activeMenu === "users" ? "active" : ""}`}
          onClick={() => setActiveMenu("users")}
        >
          <span className="nav-icon">👥</span>
          <span>User Registration</span>
        </button>
      </nav>
    </div>
  );
}

export default Sidebar;