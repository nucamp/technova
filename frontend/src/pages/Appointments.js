import React, { useState, useEffect } from 'react';
import { getAppointments, createAppointment } from '../services/api';

function Appointments({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    duration_minutes: 30,
    reason: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const params = {};

      if (user.role === 'patient') {
        params.patientId = user.id - 8; // Patient ID offset
      } else if (user.role === 'doctor') {
        params.doctorId = user.id;
      }

      const data = await getAppointments(params);
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();

    try {
      await createAppointment(formData);
      alert('Appointment created successfully!');
      setShowCreateForm(false);
      setFormData({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        duration_minutes: 30,
        reason: ''
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to create appointment: ' + error.message);
    }
  };

  const upcomingAppointments = appointments.filter(
    a => new Date(a.appointment_date) > new Date()
  );

  const pastAppointments = appointments.filter(
    a => new Date(a.appointment_date) <= new Date()
  );

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Appointments</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          {showCreateForm ? 'Cancel' : 'Book Appointment'}
        </button>
      </div>

      {showCreateForm && (
        <div className="card">
          <h3>Book New Appointment</h3>
          <form onSubmit={handleCreateAppointment}>
            <div className="form-group">
              <label>Patient ID</label>
              <input
                type="number"
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Doctor ID</label>
              <input
                type="number"
                value={formData.doctor_id}
                onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                required
              />
              <small>Doctor IDs: 3 (Dr. Smith), 4 (Dr. Johnson), 5 (Dr. Williams), 6 (Dr. Brown)</small>
            </div>

            <div className="form-group">
              <label>Date & Time</label>
              <input
                type="datetime-local"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Reason for Visit</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows="3"
              />
            </div>

            <button type="submit" className="btn btn-success">
              Book Appointment
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="card">Loading appointments...</div>
      ) : (
        <>
          <div className="card">
            <h3>Upcoming Appointments ({upcomingAppointments.length})</h3>
            {upcomingAppointments.length === 0 ? (
              <p>No upcoming appointments.</p>
            ) : (
              <div className="appointments-list">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="appointment-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h4>{new Date(appointment.appointment_date).toLocaleString()}</h4>
                        <p><strong>Patient:</strong> {appointment.patient_first_name} {appointment.patient_last_name}</p>
                        <p><strong>Doctor:</strong> Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}</p>
                        <p><strong>Duration:</strong> {appointment.duration_minutes} minutes</p>
                        {appointment.reason && <p><strong>Reason:</strong> {appointment.reason}</p>}
                      </div>
                      <span className={`badge badge-${appointment.status === 'scheduled' ? 'success' : 'warning'}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {pastAppointments.length > 0 && (
            <div className="card">
              <h3>Past Appointments ({pastAppointments.length})</h3>
              <div className="appointments-list">
                {pastAppointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="appointment-item" style={{ opacity: 0.7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h4>{new Date(appointment.appointment_date).toLocaleString()}</h4>
                        <p><strong>Patient:</strong> {appointment.patient_first_name} {appointment.patient_last_name}</p>
                        <p><strong>Doctor:</strong> Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}</p>
                        {appointment.reason && <p><strong>Reason:</strong> {appointment.reason}</p>}
                      </div>
                      <span className="badge badge-info">
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Appointments;
