import { useState, useEffect } from "react";
import Login from "./Login";
import Registration from "./Registration";
import GlamStudio from "./GlamStudio";
import Toga from "./Toga";
import OJT from "./OJT";
import Profile from "./Profile";
import { logActivity } from "./mockDatabase";

export default function App() {
  // Restore user from localStorage on first load
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("mqs_session");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [page, setPage] = useState(() => {
    try {
      const saved = localStorage.getItem("mqs_session");
      return saved ? "registration" : "login";
    } catch { return "login"; }
  });

  const [newEntry, setNewEntry] = useState(null);

  useEffect(() => {
    console.log("Page changed to:", page);
  }, [page]);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem("mqs_session", JSON.stringify(loggedInUser));
    logActivity(
      loggedInUser.id,
      loggedInUser.username,
      "Login",
      "Login",
      `User ${loggedInUser.username} logged in`
    );
    setPage("registration");
  };

  const handleLogout = () => {
    if (user) {
      logActivity(
        user.id,
        user.username,
        "Logout",
        "All Pages",
        "User logged out"
      );
    }
    setUser(null);
    setNewEntry(null);
    localStorage.removeItem("mqs_session");
    setPage("login");
  };

  const handleSubmit = (entry) => {
    setNewEntry(entry);
    setPage("glamstudio");
  };

  const handleTogaSubmit = () => {
    setPage("toga");
  };

  const handleGlamSubmit = () => {
    setPage("glamstudio");
  };

  const handleOJTSubmit = () => {
    setPage("ojt");
  };

  const handleProfileSubmit = () => {
    console.log("handleProfileSubmit called, setting page to 'profile'");
    setPage("profile");
  };

  const handleBack = () => {
    setNewEntry(null);
    setPage("registration");
  };

  console.log("Current page:", page);

  if (page === "login") return <Login onLogin={handleLogin} />;
  if (page === "registration") return <Registration user={user} onLogout={handleLogout} onSubmit={handleSubmit} onTogaSubmit={handleTogaSubmit} onOJTSubmit={handleOJTSubmit} onProfileSubmit={handleProfileSubmit} />;
  if (page === "glamstudio") return <GlamStudio newEntry={newEntry} onBack={handleBack} onLogout={handleLogout} user={user} onTogaSubmit={handleTogaSubmit} onOJTSubmit={handleOJTSubmit} onProfileSubmit={handleProfileSubmit} />;
  if (page === "toga") return <Toga newEntry={newEntry} onBack={handleBack} onLogout={handleLogout} user={user} onGlamSubmit={handleGlamSubmit} onOJTSubmit={handleOJTSubmit} onProfileSubmit={handleProfileSubmit} />;
  if (page === "ojt") return <OJT newEntry={newEntry} onBack={handleBack} onLogout={handleLogout} user={user} onGlamSubmit={handleGlamSubmit} onTogaSubmit={handleTogaSubmit} onProfileSubmit={handleProfileSubmit} />;
  if (page === "profile") return <Profile user={user} onBack={handleBack} onLogout={handleLogout} onGlamSubmit={handleGlamSubmit} onTogaSubmit={handleTogaSubmit} onOJTSubmit={handleOJTSubmit} />;
}