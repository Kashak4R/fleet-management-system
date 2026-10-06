import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("admin@fleet.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const signedInUser = await login(email, password);
      const defaultPath = signedInUser.role === "driver" ? "/driver" : "/dashboard";
      navigate(location.state?.from?.pathname || defaultPath, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to log in. Check whether the API is running.");
    }
  }

  return (
    <div className="login-page">
      <section className="login-visual">
        <div className="login-content">
          <span className="eyebrow">MERN FULL STACK PROJECT</span>
          <h1>Keep every vehicle, trip, and service record in one place.</h1>
          <p>FleetFlow helps teams monitor availability, control operating costs, and schedule maintenance on time.</p>
          <div className="feature-line"><span>01</span> Centralized fleet records</div>
          <div className="feature-line"><span>02</span> Trip and fuel monitoring</div>
          <div className="feature-line"><span>03</span> Maintenance reminders</div>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="brand login-brand">
            <span className="brand-mark">F</span>
            <div><strong>FleetFlow</strong><small>Management System</small></div>
          </div>
          <h2>Welcome back</h2>
          <p className="muted">Sign in to open the fleet dashboard.</p>
          {error && <div className="alert error">{error}</div>}
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <button className="primary-button wide" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
          <div className="demo-note"><strong>Demo account</strong><span>admin@fleet.com</span><span>Admin@123</span></div>
        </form>
      </section>
    </div>
  );
}
