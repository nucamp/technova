import React, { useState } from 'react';
import { searchPatients, getPatientRecords } from '../services/api';

function DoctorPortal({ user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // VULNERABILITY: No input validation - SQL injection possible
      const results = await searchPatients(searchQuery);
      setPatients(results);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);

    try {
      const patientRecords = await getPatientRecords(patient.id);
      setRecords(patientRecords);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  return (
    <div className="container">
      <h2>Doctor Portal</h2>

      <div className="card">
        <h3>Patient Search</h3>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* VULNERABILITY: Hint for SQL injection */}
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <p>💡 Try searching: Alice, Bob, or try special characters like ' or 1=1--</p>
        </div>
      </div>

      {patients.length > 0 && (
        <div className="card">
          <h3>Search Results</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>DOB</th>
                <th>SSN</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.first_name} {patient.last_name}</td>
                  <td>{patient.email}</td>
                  <td>{patient.phone}</td>
                  <td>{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</td>
                  {/* VULNERABILITY: Displaying SSN */}
                  <td style={{ color: 'red' }}>{patient.ssn}</td>
                  <td>
                    <button
                      onClick={() => handleSelectPatient(patient)}
                      className="btn btn-primary"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedPatient && (
        <div className="card">
          <h3>Patient: {selectedPatient.first_name} {selectedPatient.last_name}</h3>

          <div className="patient-info">
            <div className="info-grid">
              <div className="info-item">
                <label>Gender</label>
                <span>{selectedPatient.gender}</span>
              </div>
              <div className="info-item">
                <label>Blood Type</label>
                <span>{selectedPatient.blood_type}</span>
              </div>
              <div className="info-item">
                <label>Insurance</label>
                <span>{selectedPatient.insurance_provider}</span>
              </div>
              <div className="info-item">
                <label>Allergies</label>
                <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                  {selectedPatient.allergies || 'None'}
                </span>
              </div>
            </div>
          </div>

          <h4 style={{ marginTop: '20px' }}>Medical Records</h4>
          {records.length === 0 ? (
            <p>No medical records found.</p>
          ) : (
            <div className="records-list">
              {records.map((record) => (
                <div key={record.id} className="record-item">
                  <h4>{record.diagnosis}</h4>
                  <p><strong>Date:</strong> {new Date(record.visit_date).toLocaleDateString()}</p>
                  <p><strong>Prescription:</strong> {record.prescription}</p>
                  <p><strong>Notes:</strong> {record.notes}</p>
                  {record.file_path && (
                    <span className="badge badge-info">Has Attachment</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DoctorPortal;
