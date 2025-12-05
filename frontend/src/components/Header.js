import React from 'react';
import { Link } from 'react-router-dom';

function Header({ user, onLogout }) {
  return (
    <div className="header">
      <div className="header-content">
        <h1>🏥 TechNova Health</h1>

        <div className="header-nav">
          <Link to="/dashboard">Dashboard</Link>

          {user.role === 'patient' && (
            <>
              <Link to="/patient">My Portal</Link>
              <Link to="/appointments">Appointments</Link>
              <Link to="/records">Medical Records</Link>
            </>
          )}

          {user.role === 'doctor' && (
            <>
              <Link to="/doctor">Doctor Portal</Link>
              <Link to="/appointments">Appointments</Link>
            </>
          )}

          {user.role === 'admin' && (
            <Link to="/admin">Admin Panel</Link>
          )}

          <Link to="/messages">Messages</Link>

          <div className="user-info">
            <span>
              {user.first_name} {user.last_name} ({user.role})
            </span>
            <button onClick={onLogout} className="btn btn-danger">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
