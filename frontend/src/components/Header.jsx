function Header({ user, activeMenu, onProfileClick }) {
  return (
    <header className="header">
      <div className="header-title">
        <h2>
          {activeMenu === "dashboard" ? "Dashboard" : "User Registration"}
        </h2>
      </div>

      <div className="header-actions">
        <button className="profile-button" onClick={onProfileClick}>
          {user.profile_image ? (
            <img
              src={user.profile_image}
              alt="Profile"
              className="profile-image"
            />
          ) : (
            <div className="profile-avatar">
              {user.first_name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="profile-name">
            {user.first_name} {user.last_name}
          </span>
        </button>
      </div>
    </header>
  );
}

export default Header;