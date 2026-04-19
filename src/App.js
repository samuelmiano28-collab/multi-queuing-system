import { useState, useEffect } from "react";
import Login from "./Login";
import Registration from "./Registration";
import GlamStudio from "./GlamStudio";
import Toga from "./Toga";
import OJT from "./OJT";
import Profile from "./Profile";
import { logActivity } from "./mockDatabase";

export default function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [newEntry, setNewEntry] = useState(null);

  useEffect(() => {
    console.log("Page changed to:", page);
  }, [page]);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
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