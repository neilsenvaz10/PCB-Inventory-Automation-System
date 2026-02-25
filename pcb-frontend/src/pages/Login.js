import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      nav("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="auth-header">
          <div className="auth-title-row">
            <svg className="auth-logo-svg" viewBox="0 0 100 140" width="55" height="77" xmlns="http://www.w3.org/2000/svg">
              {/* Circuit traces */}
              <line x1="30" y1="40" x2="30" y2="10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <circle cx="30" cy="8" r="4" fill="white" />
              <line x1="42" y1="40" x2="38" y2="5" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <circle cx="38" cy="3" r="4" fill="white" />
              <line x1="50" y1="40" x2="50" y2="0" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <circle cx="50" cy="0" r="4" fill="white" />
              <line x1="58" y1="40" x2="62" y2="5" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <circle cx="62" cy="3" r="4" fill="white" />
              <line x1="70" y1="40" x2="70" y2="10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <circle cx="70" cy="8" r="4" fill="white" />
              {/* Box */}
              <rect x="20" y="40" width="60" height="50" rx="6" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="2" />
              {/* Lightning bolt */}
              <polygon points="54,48 44,68 50,68 46,85 56,62 50,62" fill="white" />
              {/* Plug */}
              <rect x="40" y="93" width="6" height="10" rx="1" fill="white" />
              <rect x="54" y="93" width="6" height="10" rx="1" fill="white" />
              <rect x="38" y="103" width="24" height="10" rx="3" fill="white" />
              <line x1="50" y1="113" x2="50" y2="130" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div>
              <div className="auth-title">Electrolyte Solutions</div>
              <div className="auth-sub">OPERATIONS PORTAL V4.2.0</div>
            </div>
          </div>
        </div>

        <div className="auth-body">
          <h3 className="auth-h">Secure Terminal Access</h3>

          <form onSubmit={handleLogin} className="auth-form">
            <label className="field-label">Email</label>
            <div className="input-with-icon">
              <span className="icon">📧</span>
              <input placeholder="john.doe@company.com" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>

            <label className="field-label">Password</label>
            <div className="input-with-icon">
              <span className="icon">🔒</span>
              <input placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="back-link">
            Don't have an account? <Link to="/register">Register</Link>
          </div>
        </div>

        <div className="auth-footer">
          <div className="notice">AUTHORIZED ACCESS FOR MANUFACTURING OPERATIONS ONLY. ALL ACTIONS, INCLUDING IP ADDRESS AND TIMESTAMPS, ARE LOGGED FOR COMPLIANCE AUDITING.</div>
          <div className="footer-meta"><span className="status ok">● INVENTORY ENGINE: ONLINE</span><span className="muted">&nbsp;&nbsp;|&nbsp;&nbsp; SUPPORT ID: 0800-PCB-HELP</span></div>
        </div>
      </div>
    </div>
  );
}
