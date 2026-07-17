import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard({ user }) {
  return (
    <div className="container dashboard">
      <h2>Welcome, {user.first_name} {user.last_name}!</h2>

      <div className="card">
        <h3>Dashboard Overview</h3>
        <p>Role: <strong>{user.role}</strong></p>
        <p>Email: {user.email}</p>
        <p>Phone: {user.phone}</p>

        {/* VULNERABILITY: Displaying password in UI */}
        {user.password && (
          <p style={{ color: 'red' }}>
            {user.password}
          </p>
        )}
      </div>

      <div className="stats-grid">
        {user.role === 'patient' && (
          <>
            <div className="stat-card">
              <h3>Upcoming Appointments</h3>
              <div className="value">2</div>
              <Link to="/appointments" style={{ marginTop: '10px', display: 'inline-block' }}>
                View All
              </Link>
            </div>

            <div className="stat-card">
              <h3>Medical Records</h3>
              <div className="value">5</div>
              <Link to="/records" style={{ marginTop: '10px', display: 'inline-block' }}>
                View All
              </Link>
            </div>

            <div className="stat-card">
              <h3>Unread Messages</h3>
              <div className="value">1</div>
              <Link to="/messages" style={{ marginTop: '10px', display: 'inline-block' }}>
                View All
              </Link>
            </div>
          </>
        )}

        {user.role === 'doctor' && (
          <>
            <div className="stat-card">
              <h3>Today's Appointments</h3>
              <div className="value">4</div>
              <Link to="/appointments" style={{ marginTop: '10px', display: 'inline-block' }}>
                View Schedule
              </Link>
            </div>

            <div className="stat-card">
              <h3>Total Patients</h3>
              <div className="value">32</div>
              <Link to="/doctor" style={{ marginTop: '10px', display: 'inline-block' }}>
                View Patients
              </Link>
            </div>

            <div className="stat-card">
              <h3>Pending Reviews</h3>
              <div className="value">7</div>
            </div>
          </>
        )}

        {user.role === 'admin' && (
          <>
            <div className="stat-card">
              <h3>Total Users</h3>
              <div className="value">18</div>
              <Link to="/admin" style={{ marginTop: '10px', display: 'inline-block' }}>
                Manage Users
              </Link>
            </div>

            <div className="stat-card">
              <h3>Active Sessions</h3>
              <div className="value">12</div>
            </div>

            <div className="stat-card">
              <h3>System Health</h3>
              <div className="value" style={{ color: '#28a745' }}>OK</div>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          {user.role === 'patient' && (
            <>
              <Link to="/appointments" className="btn btn-primary">Book Appointment</Link>
              <Link to="/messages" className="btn btn-primary">Send Message</Link>
            </>
          )}

          {user.role === 'doctor' && (
            <>
              <Link to="/doctor" className="btn btn-primary">Search Patients</Link>
              <Link to="/appointments" className="btn btn-primary">View Schedule</Link>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <Link to="/admin" className="btn btn-primary">User Management</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
