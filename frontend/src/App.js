import { useEffect, useState } from "react";
import "./App.css";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("App mounted, checking localStorage...");
    const savedUser = localStorage.getItem("user");
    console.log("Saved user:", savedUser);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    console.log("Login successful:", userData);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    console.log("Logout triggered");
    setUser(null);
    localStorage.removeItem("user");
    console.log("User state after logout:", null);
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  console.log("Rendering App - user:", user, "loading:", loading);

  if (loading) {
    return (
      <div className="app" style={{ padding: "20px", background: "#f8fafc", minHeight: "100vh" }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="app">
      {!user ? (
        <>
          {console.log("Rendering Login component")}
          <Login onLogin={handleLogin} />
        </>
      ) : (
        <>
          {console.log("Rendering Dashboard component")}
          <Dashboard
            user={user}
            onLogout={handleLogout}
            onProfileUpdate={handleProfileUpdate}
          />
        </>
      )}
    </div>
  );
}

export default App;