import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Header band */}
        <div className="auth-header">
          <div className="auth-title-row">
            <svg className="auth-logo-svg" viewBox="0 0 100 140" width="55" height="77" xmlns="http://www.w3.org/2000/svg">
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
              <rect x="20" y="40" width="60" height="50" rx="6" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="2" />
              <polygon points="54,48 44,68 50,68 46,85 56,62 50,62" fill="white" />
              <rect x="40" y="93" width="6" height="10" rx="1" fill="white" />
              <rect x="54" y="93" width="6" height="10" rx="1" fill="white" />
              <rect x="38" y="103" width="24" height="10" rx="3" fill="white" />
              <line x1="50" y1="113" x2="50" y2="130" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div>
              <div className="auth-title">Electrolyte Solutions</div>
              <div className="auth-sub">CREATE YOUR ACCOUNT</div>
            </div>
          </div>
        </div>

        {/* Form body */}
        <div className="auth-body">
          <h3 className="auth-h">Register New Operator</h3>

          <form onSubmit={handleRegister} className="auth-form">
            <label className="field-label">Name</label>
            <div className="input-with-icon">
              <span className="icon">👤</span>
              <input
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
              />
            </div>

            <label className="field-label">Email</label>
            <div className="input-with-icon">
              <span className="icon">📧</span>
              <input
                placeholder="john.doe@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
            </div>

            <label className="field-label">Password</label>
            <div className="input-with-icon">
              <span className="icon">🔒</span>
              <input
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
              />
            </div>

            <label className="field-label">Confirm Password</label>
            <div className="input-with-icon">
              <span className="icon">🔒</span>
              <input
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
              />
            </div>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <div className="back-link">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <div className="notice">
            BY REGISTERING YOU AGREE TO THE TERMS OF SERVICE AND PRIVACY POLICY.
            ALL ACTIONS ARE LOGGED FOR COMPLIANCE AUDITING.
          </div>
          <div className="footer-meta">
            <span className="status ok">● INVENTORY ENGINE: ONLINE</span>
            <span className="muted">&nbsp;&nbsp;|&nbsp;&nbsp; SUPPORT ID: 0800-PCB-HELP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
