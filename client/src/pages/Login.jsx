import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, role, name } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('name', name);

      if (role === 'parent') {
        navigate('/dashboard/parent');
      } else {
        navigate('/dashboard/admin');
      }
    } catch (err) {
      setError('Invalid email or password');
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/logo.png" alt="Crown Heights College crest" className="login-logo" />
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
          <button type="submit" className="btn-primary">Log In</button>
        </form>

        <p className="login-footer">
          Parent? <a href="/register">Register with your child's admission number</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
