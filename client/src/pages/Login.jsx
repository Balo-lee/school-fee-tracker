import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const demoAccounts = [
    { label: "Parent", email: "parent25@example.com", password: "Parent123!" },
    {
      label: "Principal (view-only)",
      email: "principal@crownheights.edu.ng",
      password: "Principal123!",
    },
  ];

  function fillDemo(account) {
    setEmail(account.email);
    setPassword(account.password);
  }
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, role, name } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("name", name);

      if (role === "parent") {
        navigate("/dashboard/parent");
      } else {
        navigate("/dashboard/admin");
      }
    } catch (err) {
      setError("Invalid email or password");
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <Link
          to="/"
          className="back-link"
          style={{ display: "block", marginBottom: "1rem" }}
        >
          &larr; Back to Home
        </Link>
        <img
          src="/logo.png"
          alt="Crown Heights College crest"
          className="login-logo"
        />
        <h1>Crown Heights College</h1>
        <p className="tagline">Fee Management System</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="demo-box">
          <p className="demo-title">Try a demo account</p>
          <div className="demo-buttons">
            {demoAccounts.map((a) => (
              <button
                type="button"
                key={a.label}
                className="demo-btn"
                onClick={() => fillDemo(a)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <p className="demo-note">
            Click one, then press Log In. Test mode: no real money moves. The
            first load can take up to a minute while the server wakes up.
          </p>
        </div>

        <p className="login-footer">
          Parent?{" "}
          <a href="/register">Register with your child's admission number</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
