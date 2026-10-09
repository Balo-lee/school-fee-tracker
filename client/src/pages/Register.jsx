import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import "../pages/Login.css";
import "./Register.css";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    admissionNumber: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", formData);
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card register-card">
          <div className="register-success">
            <h2>Registration Successful 🎉</h2>
            <p>
              Your account has been created. You can now log in to view your
              child's fees.
            </p>
            <Link
              to="/login"
              className="btn-primary"
              style={{ textDecoration: "none" }}
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card register-card">
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
        <h1>Parent Registration</h1>
        <p className="tagline">Register using your child's admission number</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Choose a Password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
          <input
            type="text"
            name="admissionNumber"
            placeholder="Child's Admission Number (e.g. CHC/1001)"
            value={formData.admissionNumber}
            onChange={handleChange}
            required
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="login-footer">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
