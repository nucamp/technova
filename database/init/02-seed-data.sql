-- TechNova Health Seed Data
-- Sample data for training purposes

-- Insert users (VULNERABILITY: plaintext passwords!)
INSERT INTO users (username, password, email, role, first_name, last_name, phone) VALUES
-- Admin users
('admin', 'admin123', 'admin@technova-health.com', 'admin', 'System', 'Administrator', '555-0000'),
('dbadmin', 'password', 'dbadmin@technova-health.com', 'admin', 'Database', 'Admin', '555-0001'),

-- Doctors
('dr.smith', 'doctor123', 'j.smith@technova-health.com', 'doctor', 'John', 'Smith', '555-0100'),
('dr.johnson', 'medical2024', 'e.johnson@technova-health.com', 'doctor', 'Emily', 'Johnson', '555-0101'),
('dr.williams', 'pass1234', 'm.williams@technova-health.com', 'doctor', 'Michael', 'Williams', '555-0102'),
('dr.brown', 'brown123', 's.brown@technova-health.com', 'doctor', 'Sarah', 'Brown', '555-0103'),

-- Nurses
('nurse.davis', 'nurse123', 'l.davis@technova-health.com', 'nurse', 'Linda', 'Davis', '555-0200'),
('nurse.wilson', 'nursing2024', 'r.wilson@technova-health.com', 'nurse', 'Robert', 'Wilson', '555-0201'),

-- Patients
('patient001', 'password123', 'alice.anderson@email.com', 'patient', 'Alice', 'Anderson', '555-1001'),
('patient002', '123456', 'bob.baker@email.com', 'patient', 'Bob', 'Baker', '555-1002'),
('patient003', 'qwerty', 'carol.clark@email.com', 'patient', 'Carol', 'Clark', '555-1003'),
('patient004', 'letmein', 'david.davis@email.com', 'patient', 'David', 'Davis', '555-1004'),
('patient005', 'password', 'eve.evans@email.com', 'patient', 'Eve', 'Evans', '555-1005'),
('patient006', 'welcome', 'frank.fisher@email.com', 'patient', 'Frank', 'Fisher', '555-1006'),
('patient007', 'abc123', 'grace.garcia@email.com', 'patient', 'Grace', 'Garcia', '555-1007'),
('patient008', 'patient', 'henry.harris@email.com', 'patient', 'Henry', 'Harris', '555-1008'),
('patient009', 'test123', 'iris.ibrahim@email.com', 'patient', 'Iris', 'Ibrahim', '555-1009'),
('patient010', 'demo123', 'jack.jackson@email.com', 'patient', 'Jack', 'Jackson', '555-1010');

-- Insert patient details (VULNERABILITY: SSN stored in plaintext!)
INSERT INTO patients (user_id, date_of_birth, gender, ssn, address, emergency_contact_name, emergency_contact_phone, insurance_provider, insurance_id, blood_type, allergies) VALUES
(9, '1985-03-15', 'Female', '123-45-6789', '123 Main St, Boston, MA 02101', 'Tom Anderson', '555-2001', 'BlueCross', 'BC123456', 'A+', 'Penicillin'),
(10, '1990-07-22', 'Male', '234-56-7890', '456 Oak Ave, Boston, MA 02102', 'Jane Baker', '555-2002', 'Aetna', 'AET234567', 'O+', 'None'),
(11, '1978-11-30', 'Female', '345-67-8901', '789 Pine Rd, Cambridge, MA 02138', 'Mike Clark', '555-2003', 'Cigna', 'CIG345678', 'B-', 'Latex, Peanuts'),
(12, '1995-01-18', 'Male', '456-78-9012', '321 Elm St, Somerville, MA 02143', 'Lisa Davis', '555-2004', 'UnitedHealth', 'UH456789', 'AB+', 'Shellfish'),
(13, '1982-09-05', 'Female', '567-89-0123', '654 Birch Ln, Brookline, MA 02445', 'Paul Evans', '555-2005', 'BlueCross', 'BC567890', 'A-', 'Sulfa drugs'),
(14, '1988-12-12', 'Male', '678-90-1234', '987 Cedar Dr, Newton, MA 02458', 'Mary Fisher', '555-2006', 'Aetna', 'AET678901', 'O-', 'None'),
(15, '1992-04-25', 'Female', '789-01-2345', '147 Maple Ave, Waltham, MA 02451', 'Carlos Garcia', '555-2007', 'Cigna', 'CIG789012', 'B+', 'Aspirin'),
(16, '1975-08-08', 'Male', '890-12-3456', '258 Spruce St, Medford, MA 02155', 'Nancy Harris', '555-2008', 'UnitedHealth', 'UH890123', 'A+', 'Iodine'),
(17, '1987-06-17', 'Female', '901-23-4567', '369 Willow Way, Arlington, MA 02474', 'Omar Ibrahim', '555-2009', 'BlueCross', 'BC901234', 'O+', 'None'),
(18, '1993-10-29', 'Male', '012-34-5678', '741 Aspen Ct, Lexington, MA 02420', 'Kate Jackson', '555-2010', 'Aetna', 'AET012345', 'AB-', 'Codeine');

-- Insert medical records
INSERT INTO medical_records (patient_id, doctor_id, diagnosis, prescription, notes, visit_date, file_path, is_confidential) VALUES
(1, 3, 'Hypertension', 'Lisinopril 10mg daily', 'Patient presents with elevated BP. Started on ACE inhibitor.', '2024-01-15 10:00:00', 'record_1_patient001_20240115.txt', true),
(1, 3, 'Follow-up visit', 'Continue Lisinopril', 'BP improved. Continue current medication.', '2024-02-15 10:00:00', NULL, true),
(2, 4, 'Type 2 Diabetes', 'Metformin 500mg twice daily', 'HbA1c elevated at 7.8%. Starting metformin.', '2024-01-20 14:30:00', 'record_3_patient002_20240120.txt', true),
(3, 3, 'Annual Physical', 'Vitamin D supplement', 'Overall health good. Low vitamin D levels.', '2024-01-25 09:00:00', NULL, false),
(4, 5, 'Migraine', 'Sumatriptan 50mg as needed', 'Recurrent migraines. Prescribed triptan.', '2024-02-01 11:15:00', NULL, true),
(5, 4, 'Anxiety Disorder', 'Sertraline 50mg daily', 'Started on SSRI for anxiety management.', '2024-02-05 15:45:00', 'record_6_patient005_20240205.txt', true),
(6, 3, 'Lower back pain', 'Physical therapy, Ibuprofen 400mg PRN', 'Muscle strain. No red flags.', '2024-02-10 13:20:00', NULL, false),
(7, 6, 'Allergic Rhinitis', 'Cetirizine 10mg daily', 'Seasonal allergies. Started antihistamine.', '2024-02-14 10:30:00', NULL, false),
(8, 5, 'Insomnia', 'Sleep hygiene counseling, Melatonin 3mg', 'Non-pharmacological approach first.', '2024-02-18 16:00:00', NULL, true),
(9, 4, 'Asthma', 'Albuterol inhaler PRN, Fluticasone daily', 'Mild persistent asthma. Started controller.', '2024-02-22 09:45:00', 'record_10_patient009_20240222.txt', true);

-- Insert appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, duration_minutes, status, reason, notes) VALUES
-- Past appointments
(1, 3, '2024-01-15 10:00:00', 30, 'completed', 'High blood pressure consultation', 'Completed'),
(2, 4, '2024-01-20 14:30:00', 45, 'completed', 'Diabetes management', 'Completed'),
(3, 3, '2024-01-25 09:00:00', 60, 'completed', 'Annual physical exam', 'Completed'),

-- Upcoming appointments
(1, 3, '2024-12-10 10:00:00', 30, 'scheduled', 'Follow-up for hypertension', NULL),
(4, 5, '2024-12-11 14:00:00', 30, 'scheduled', 'Migraine follow-up', NULL),
(5, 4, '2024-12-12 11:30:00', 45, 'scheduled', 'Anxiety management check-in', NULL),
(6, 3, '2024-12-13 15:00:00', 30, 'scheduled', 'Back pain follow-up', NULL),
(7, 6, '2024-12-15 09:30:00', 30, 'scheduled', 'Allergy review', NULL),
(8, 5, '2024-12-16 13:00:00', 30, 'scheduled', 'Sleep issues consultation', NULL),
(9, 4, '2024-12-17 10:30:00', 45, 'scheduled', 'Asthma check-up', NULL),
(2, 4, '2024-12-18 16:00:00', 30, 'scheduled', 'Diabetes follow-up', NULL),
(10, 3, '2024-12-19 14:00:00', 60, 'scheduled', 'New patient consultation', NULL);

-- Insert messages (VULNERABILITY: No XSS protection!)
INSERT INTO messages (from_user_id, to_user_id, subject, body, sent_at, is_read) VALUES
(9, 3, 'Question about medication', 'Dr. Smith, I have a question about my Lisinopril dosage. Should I take it in the morning or evening?', '2024-02-20 08:30:00', true),
(3, 9, 'Re: Question about medication', 'Hi Alice, you can take Lisinopril at any time, but try to be consistent. Morning is often easier to remember.', '2024-02-20 14:15:00', true),
(10, 4, 'Blood sugar readings', 'Dr. Johnson, my morning readings have been around 140-150. Is this ok?<script>alert("XSS")</script>', '2024-02-21 19:45:00', false),
(1, 3, 'System Maintenance', 'Dear Dr. Smith, the system will undergo maintenance on Saturday. <img src=x onerror=alert("XSS")>', '2024-02-22 09:00:00', false);

-- Insert sessions (some expired, for teaching session management)
INSERT INTO sessions (user_id, session_token, ip_address, user_agent, created_at, expires_at, is_active) VALUES
(9, 'sess_abc123xyz789', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-02-25 08:00:00', '2024-02-25 20:00:00', false),
(10, 'sess_def456uvw012', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '2024-02-25 09:30:00', '2024-02-25 21:30:00', false),
(3, 'sess_ghi789rst345', '10.0.0.50', 'Mozilla/5.0 (X11; Linux x86_64)', '2024-02-25 10:00:00', '2024-03-10 22:00:00', true);

-- Insert API keys (VULNERABILITY: stored in plaintext!)
INSERT INTO api_keys (user_id, api_key, description, is_active) VALUES
(1, 'sk_live_abc123def456ghi789', 'Admin API access for automation', true),
(3, 'sk_test_jkl012mno345pqr678', 'Dr. Smith - Lab results integration', true),
(4, 'sk_live_stu901vwx234yz5678', 'Dr. Johnson - Prescription system', true);

-- Insert some audit log entries
INSERT INTO audit_log (user_id, action, table_name, record_id, timestamp) VALUES
(1, 'LOGIN', 'users', 1, '2024-02-25 08:00:00'),
(9, 'LOGIN', 'users', 9, '2024-02-25 08:15:00'),
(3, 'VIEW_RECORD', 'medical_records', 1, '2024-02-25 09:00:00'),
(9, 'VIEW_APPOINTMENTS', 'appointments', 1, '2024-02-25 09:30:00');
