import React from "react";

function Sidebar({ activeMenu, setActiveMenu }) {
  const items = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "users", icon: "👥", label: "User Registration" }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header"><div className="logo"><div className="logo-icon">UM</div><span>UserMgmt</span></div></div>
      <nav className="sidebar-nav">
        {items.map(item => <button key={item.id} className={`nav-item ${activeMenu === item.id ? "active" : ""}`} onClick={() => setActiveMenu(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}
      </nav>
    </div>
  );
}

export default Sidebar;