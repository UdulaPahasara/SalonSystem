import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login } from "../api/usersApi";
import { getDashboardPathForRole } from "../utils/authRoutes";
import { SALON_INFO } from "../utils/salonInfo";
import heroImage from "../images/salon-hero.jpg";
import "./Login.css";

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 21a8 8 0 1 0-16 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 11V8a4 4 0 1 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12C4.5 7.5 8 5 12 5s7.5 2.5 9.5 7c-2 4.5-5.5 7-9.5 7s-7.5-2.5-9.5-7Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M10.58 10.58A2.75 2.75 0 0 0 12 15a2.75 2.75 0 0 0 1.42-.42M6.7 6.7C8.3 5.6 10.1 5 12 5c4 0 7.5 2.5 9.5 7a10.6 10.6 0 0 1-2.1 3.1M9.9 4.24A10.73 10.73 0 0 1 12 4c4 0 7.5 2.5 9.5 7-.73 1.64-1.67 3.05-2.75 4.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login: setAuthUser, user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.role?.roleName) {
      const path = getDashboardPathForRole(user.role.roleName);
      if (path) navigate(path, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await login({ username: username.trim(), password });
      const dashboardPath = getDashboardPathForRole(response.role?.roleName);

      if (!dashboardPath) {
        setError("Your account role is not configured. Please contact the salon owner.");
        return;
      }

      setAuthUser(response);
      navigate(dashboardPath, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      const status = err.response?.status;
      if (!err.response) {
        setError("Cannot reach the server. Start the backend with: npm run start:api");
      } else if (status === 401) {
        setError("Invalid username or password. Please try again.");
      } else {
        setError("Login failed on the server. Restart the backend and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <aside className="login-visual" aria-hidden="true">
        <img src={heroImage} alt="" className="login-visual-image" />
        <div className="login-visual-overlay">
          <p className="login-visual-tag">{SALON_INFO.tagline}</p>
          <h2>{SALON_INFO.name}</h2>
          <p>Elegant salon management for your team — appointments, services, and more.</p>
        </div>
      </aside>

      <main className="login-main">
        <div className="login-card">
          <Link to="/" className="login-back-link">
            ← Back to website
          </Link>

          <div className="login-brand">
            <span className="login-brand-icon">✦</span>
            <div>
              <p className="login-brand-tag">Staff Portal</p>
              <h1>Welcome back</h1>
            </div>
          </div>

          <p className="login-lead">
            Sign in with your username and password. You&apos;ll be taken to your dashboard automatically.
          </p>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="username">Username</label>
              <div className="login-input-shell">
                <span className="login-input-icon">
                  <UserIcon />
                </span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="login-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="login-input-shell">
                <span className="login-input-icon">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="login-input login-input-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="login-help">
            Need an account? Ask your salon owner or branch manager to create one for you.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;
