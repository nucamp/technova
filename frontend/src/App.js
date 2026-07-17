import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientPortal from './pages/PatientPortal';
import DoctorPortal from './pages/DoctorPortal';
import AdminPortal from './pages/AdminPortal';
import MedicalRecords from './pages/MedicalRecords';
import Appointments from './pages/Appointments';
import Messages from './pages/Messages';
import Header from './components/Header';
import './App.css';
import { logClientEvent } from './services/api'; // Import the new logging function

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Log application startup
    logClientEvent('info', 'Frontend App loaded', { path: window.location.pathname });

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      // VULNERABILITY: Trusting client-side data without server verification
      setUser(JSON.parse(userData));
      logClientEvent('info', 'User session restored', { userId: JSON.parse(userData).id });
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    // VULNERABILITY: Storing sensitive data in localStorage (not httpOnly cookies)
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    logClientEvent('info', 'User logged in successfully', { userId: userData.id, username: userData.username });
    // VULNERABILITY: Logging full user object including sensitive fields for teaching
    logClientEvent('warn', 'Sensitive user data logged during login (for teaching)', { userData });
  };

  const handleLogout = () => {
    logClientEvent('info', 'User logged out', { userId: user?.id });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // VULNERABILITY: Example of logging sensitive data that should NOT be logged
  const handleViewSensitiveData = () => {
    const sensitiveInfo = {
      patientId: 'PAT-001',
      ssn: 'XXX-XX-1234', // This should never be logged
      creditCard: 'XXXX-XXXX-XXXX-1111' // This should never be logged
    };
    logClientEvent('warn', 'User accessed sensitive patient data (for teaching)', {
      userId: user?.id,
      sensitiveInfo: sensitiveInfo,
      action: 'view_patient_details'
    });
    alert('Sensitive data simulated and logged (check logs)!');
  };


  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        {user && <Header user={user} onLogout={handleLogout} />}

        <Switch>
          <Route exact path="/login">
            {user ? <Redirect to="/dashboard" /> : <Login onLogin={handleLogin} />}
          </Route>

          <Route exact path="/dashboard">
            {!user ? (
              <Redirect to="/login" />
            ) : (
              <Dashboard user={user}>
                {/* Adding a button to simulate logging sensitive data for teaching */}
                <button onClick={handleViewSensitiveData} style={{ margin: '20px', padding: '10px', backgroundColor: 'red', color: 'white' }}>
                  Simulate Sensitive Data Access (Logs to backend)
                </button>
              </Dashboard>
            )}
          </Route>

          <Route exact path="/patient">
            {!user || user.role !== 'patient' ? <Redirect to="/dashboard" /> : <PatientPortal user={user} />}
          </Route>

          <Route exact path="/doctor">
            {!user || user.role !== 'doctor' ? <Redirect to="/dashboard" /> : <DoctorPortal user={user} />}
          </Route>

          <Route exact path="/admin">
            {!user || user.role !== 'admin' ? <Redirect to="/dashboard" /> : <AdminPortal user={user} />}
          </Route>

          <Route exact path="/records">
            {!user ? <Redirect to="/login" /> : <MedicalRecords user={user} />}
          </Route>

          <Route exact path="/appointments">
            {!user ? <Redirect to="/login" /> : <Appointments user={user} />}
          </Route>

          <Route exact path="/messages">
            {!user ? <Redirect to="/login" /> : <Messages user={user} />}
          </Route>

          <Route exact path="/">
            <Redirect to={user ? "/dashboard" : "/login"} />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
