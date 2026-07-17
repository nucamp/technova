import React, { useState } from 'react';
import { login } from '../services/api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(username, password);

      if (response.success) {
        onLogin(response.user, response.token);
      } else {
        setError('Login failed');
      }
    } catch (err) {
      // VULNERABILITY: Exposing detailed error messages
      setError(err.response?.data?.error || 'Login failed');
      console.error('Login error:', err); // VULNERABILITY: Logging errors to console
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>TechNova Health Login</h2>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>Demo Accounts:</h4>
          <ul style={{ fontSize: '12px', lineHeight: '1.8' }}>
            <li>Admin: admin / admin123</li>
            <li>Doctor: dr.smith / doctor123</li>
            <li>Patient: patient001 / password123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Login;
