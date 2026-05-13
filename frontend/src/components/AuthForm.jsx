import { useState } from "react";
import { api } from "../api";

export default function AuthForm({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        await api.register(username, password);
        setMode("login");
        setError("Account created — please log in.");
      } else {
        const data = await api.login(username, password);
        localStorage.setItem("token", data.token);
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1>Transcendence</h1>
      <form className="auth-form" onSubmit={submit}>
        <h2>{mode === "login" ? "Login" : "Register"}</h2>
        {error && <p className="auth-error">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoFocus
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "..." : mode === "login" ? "Login" : "Create account"}
        </button>
        <button
          type="button"
          className="auth-switch"
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
        >
          {mode === "login" ? "No account? Register" : "Already registered? Login"}
        </button>
      </form>
    </div>
  );
}
