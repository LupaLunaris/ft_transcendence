import { useState } from "react";
import AuthForm from "./components/AuthForm";
import MapEditor from "./components/MapEditor";
import "./App.css";

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return null;
      }
      return { id: payload.id, username: payload.username };
    } catch {
      return null;
    }
  });

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (!user) return <AuthForm onLogin={setUser} />;

  return (
    <div>
      <MapEditor user={user} />
      <button className="logout-btn" onClick={logout}>Logout</button>
    </div>
  );
}

export default App;
