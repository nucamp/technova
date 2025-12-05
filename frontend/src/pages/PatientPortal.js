import React, { useState, useEffect } from 'react';
import { getPatient, getPatientRecords, getAppointments } from '../services/api';

function PatientPortal({ user }) {
  const [patientData, setPatientData] = useState(null);
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // VULNERABILITY: Trusting user-provided patient ID from localStorage
        const patientId = user.id - 8; // Assuming patient IDs start at patient001 (user_id 9, patient_id 1)

        const [patient, patientRecords, patientAppointments] = await Promise.all([
          getPatient(patientId),
          getPatientRecords(patientId),
          getAppointments({ patientId })
        ]);

        setPatientData(patient);
        setRecords(patientRecords);
        setAppointments(patientAppointments);
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h2>Patient Portal</h2>

      {patientData && (
        <div className="patient-info">
          <h3>Personal Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Name</label>
              <span>{patientData.first_name} {patientData.last_name}</span>
            </div>
            <div className="info-item">
              <label>Date of Birth</label>
              <span>{new Date(patientData.date_of_birth).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <label>Gender</label>
              <span>{patientData.gender}</span>
            </div>
            {/* VULNERABILITY: Displaying SSN in the UI */}
            <div className="info-item">
              <label>SSN</label>
              <span style={{ color: 'red' }}>{patientData.ssn} ⚠️</span>
            </div>
            <div className="info-item">
              <label>Blood Type</label>
              <span>{patientData.blood_type}</span>
            </div>
            <div className="info-item">
              <label>Insurance</label>
              <span>{patientData.insurance_provider} - {patientData.insurance_id}</span>
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <div className="info-item">
              <label>Address</label>
              <span>{patientData.address}</span>
            </div>
            <div className="info-item" style={{ marginTop: '10px' }}>
              <label>Allergies</label>
              <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                {patientData.allergies || 'None'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Recent Medical Records</h3>
        {records.length === 0 ? (
          <p>No medical records found.</p>
        ) : (
          <div className="records-list">
            {records.slice(0, 5).map((record) => (
              <div key={record.id} className="record-item">
                <h4>{record.diagnosis}</h4>
                <p><strong>Date:</strong> {new Date(record.visit_date).toLocaleDateString()}</p>
                <p><strong>Doctor:</strong> Dr. {record.doctor_first_name} {record.doctor_last_name}</p>
                <p><strong>Prescription:</strong> {record.prescription}</p>
                {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
                {record.file_path && (
                  <div style={{ marginTop: '10px' }}>
                    <a
                      href={`http://localhost:9000/patient-records/${record.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '8px 15px', textDecoration: 'none' }}
                    >
                      📄 Download Medical Record
                    </a>
                    <p style={{ fontSize: '11px', color: '#856404', marginTop: '5px', backgroundColor: '#fff3cd', padding: '5px', borderRadius: '3px' }}>
                      ⚠️ VULNERABILITY: Direct S3 URL - No authentication required!
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Upcoming Appointments</h3>
        {appointments.filter(a => new Date(a.appointment_date) > new Date()).length === 0 ? (
          <p>No upcoming appointments.</p>
        ) : (
          <div className="appointments-list">
            {appointments
              .filter(a => new Date(a.appointment_date) > new Date())
              .map((appointment) => (
                <div key={appointment.id} className="appointment-item">
                  <h4>{new Date(appointment.appointment_date).toLocaleString()}</h4>
                  <p><strong>Doctor:</strong> Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}</p>
                  <p><strong>Reason:</strong> {appointment.reason}</p>
                  <span className={`badge badge-${appointment.status === 'scheduled' ? 'success' : 'warning'}`}>
                    {appointment.status}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientPortal;
