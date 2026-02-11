import React, { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const handleProfileUpdate = (u) => {
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  };

  return <div className="app">{user ? <Dashboard user={user} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} /> : <Login onLogin={handleLogin} />}</div>;
}

export default App;