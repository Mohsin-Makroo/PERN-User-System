import React from "react";

function Header({ user, activeMenu, onProfileClick }) {
  const titles = { dashboard: "Dashboard", users: "User Registration" };

  return (
    <div className="header">
      <div className="header-title"><h2>{titles[activeMenu]}</h2></div>
      <button className="profile-button" onClick={onProfileClick}>
        {user.profile_image ? <img src={user.profile_image} alt="Profile" className="profile-image" /> : <div className="profile-avatar">{user.first_name.charAt(0).toUpperCase()}</div>}
        <span className="profile-name">{user.first_name} {user.last_name}</span>
      </button>
    </div>
  );
}

export default Header;