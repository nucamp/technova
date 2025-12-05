import React, { useState, useEffect } from 'react';
import { getAllUsers, createBackup, getConfig, getEnvVars, updateUser } from '../services/api';

function AdminPortal({ user }) {
  const [users, setUsers] = useState([]);
  const [config, setConfig] = useState(null);
  const [envVars, setEnvVars] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backupFilename, setBackupFilename] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      // VULNERABILITY: Command injection possible
      await createBackup(backupFilename);
      alert('Backup created successfully!');
      setBackupFilename('');
    } catch (error) {
      console.error('Backup error:', error);
      alert('Backup failed: ' + error.message);
    }
  };

  const handleShowConfig = async () => {
    try {
      // VULNERABILITY: Exposing sensitive configuration
      const [configData, envData] = await Promise.all([
        getConfig(),
        getEnvVars()
      ]);
      setConfig(configData);
      setEnvVars(envData);
      setShowConfig(true);
    } catch (error) {
      console.error('Config error:', error);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      // VULNERABILITY: Mass assignment - can update any field including role
      await updateUser(userId, updates);
      alert('User updated successfully!');
      fetchUsers();
      setEditingUser(null);
    } catch (error) {
      console.error('Update error:', error);
      alert('Update failed: ' + error.message);
    }
  };

  const handleRoleChange = (userId, currentRole) => {
    const newRole = prompt(`Change role from ${currentRole} to:`, currentRole);
    if (newRole && newRole !== currentRole) {
      handleUpdateUser(userId, { role: newRole });
    }
  };

  return (
    <div className="container">
      <h2>Admin Portal</h2>

      <div className="card">
        <h3>Database Backup</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Backup filename (e.g., backup.sql)"
            value={backupFilename}
            onChange={(e) => setBackupFilename(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={handleBackup} className="btn btn-success">
            Create Backup
          </button>
        </div>
        <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          💡 Try entering: backup.sql; cat /etc/passwd
        </p>
      </div>

      <div className="card">
        <h3>System Configuration</h3>
        <button onClick={handleShowConfig} className="btn btn-primary">
          Show Config (Debug)
        </button>

        {showConfig && config && (
          <div style={{ marginTop: '15px', background: '#f8f9fa', padding: '15px', borderRadius: '4px' }}>
            <h4 style={{ color: 'red' }}>⚠️ SENSITIVE CONFIGURATION</h4>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="card">
        <h3>User Management</h3>
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Name</th>
                <th>Password</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge badge-${u.role === 'admin' ? 'danger' : u.role === 'doctor' ? 'info' : 'success'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.first_name} {u.last_name}</td>
                  {/* VULNERABILITY: Displaying plaintext passwords */}
                  <td style={{ color: 'red', fontFamily: 'monospace' }}>{u.password}</td>
                  <td>
                    <button
                      onClick={() => handleRoleChange(u.id, u.role)}
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                    >
                      Change Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Security Issues</h3>
        <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '4px' }}>
          <h4 style={{ color: '#856404', marginBottom: '10px' }}>⚠️ Intentional Vulnerabilities</h4>
          <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
            <li>Plaintext passwords stored in database</li>
            <li>Passwords visible in admin panel</li>
            <li>Command injection in backup functionality</li>
            <li>Exposed debug endpoints</li>
            <li>Mass assignment vulnerability in user update</li>
            <li>No rate limiting on API endpoints</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminPortal;
