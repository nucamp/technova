import React, { useState, useEffect } from 'react';
import { getPatientRecords } from '../services/api';

function MedicalRecords({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [manualFetch, setManualFetch] = useState(false);

  useEffect(() => {
    if (user.role === 'patient') {
      fetchRecords(user.id - 8); // Patient ID offset
    } else {
      setManualFetch(true);
      setLoading(false);
    }
  }, [user]);

  const fetchRecords = async (pid) => {
    setLoading(true);
    try {
      // VULNERABILITY: IDOR - can access any patient's records
      const data = await getPatientRecords(pid);
      setRecords(data);
    } catch (error) {
      console.error('Error fetching records:', error);
      alert('Failed to fetch records: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualFetch = (e) => {
    e.preventDefault();
    fetchRecords(patientId);
  };

  return (
    <div className="container">
      <h2>Medical Records</h2>

      {manualFetch && (
        <div className="card">
          <h3>View Patient Records (Doctors/Admin)</h3>
          <form onSubmit={handleManualFetch}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                placeholder="Patient ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary">
                Fetch Records
              </button>
            </div>
          </form>
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          </p>
        </div>
      )}

      {loading ? (
        <div className="card">Loading...</div>
      ) : records.length === 0 ? (
        <div className="card">
          <p>No medical records found.</p>
        </div>
      ) : (
        <div>
          {records.map((record) => (
            <div key={record.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3>{record.diagnosis}</h3>
                  <p><strong>Visit Date:</strong> {new Date(record.visit_date).toLocaleString()}</p>
                  <p><strong>Doctor:</strong> Dr. {record.doctor_first_name} {record.doctor_last_name}</p>

                  <div style={{ marginTop: '15px' }}>
                    <h4>Prescription</h4>
                    <p>{record.prescription}</p>
                  </div>

                  {record.notes && (
                    <div style={{ marginTop: '15px' }}>
                      <h4>Clinical Notes</h4>
                      <p>{record.notes}</p>
                    </div>
                  )}

                  {record.file_path && (
                    <div style={{ marginTop: '15px' }}>
                      <span className="badge badge-info" style={{ marginRight: '10px' }}>
                        📎 Attachment: {record.file_path}
                      </span>
                      <br />
                      <a
                        href={`http://localhost:9000/patient-records/${record.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-success"
                        style={{ fontSize: '12px', padding: '8px 15px', marginTop: '10px', textDecoration: 'none', display: 'inline-block' }}
                      >
                        📄 Download File
                      </a>
                    </div>
                  )}

                  {record.is_confidential && (
                    <div style={{ marginTop: '15px' }}>
                      <span className="badge badge-danger">
                        🔒 Confidential
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MedicalRecords;
