const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { Pool } = require('pg');
const redis = require('redis');
const Minio = require('minio');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const winston = require('winston'); // Import winston
const fs = require('fs'); // Import fs to ensure log directory exists

// Ensure log directory exists
const LOG_DIR = '/var/log/shared';
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Configure Winston loggers
const appLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: path.join(LOG_DIR, 'backend_app.log') })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(LOG_DIR, 'backend_exceptions.log') })
  ]
});

const clientLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: path.join(LOG_DIR, 'frontend_client.log') })
  ]
});

// If we're not in production, log to the console too
if (process.env.NODE_ENV !== 'production') {
  appLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
  clientLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}


// Auto-seed MinIO with medical records on startup
require('./seed-minio');

const app = express();
const PORT = process.env.PORT || 3001;

// VULNERABILITY: Overly permissive CORS
app.use(cors({
  origin: '*',  // Should restrict to specific origins
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
// Replace console.log based morgan with winston integration for HTTP requests
// Custom Morgan format to include request details in appLogger
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      appLogger.info(message.trim());
    },
  },
}));

// VULNERABILITY: No helmet or security headers
// app.use(helmet()); // Commented out for "testing"

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://technova_admin:TechN0va2024!@postgres:5432/technova_health',
});

// Redis connection
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://:redis123@redis:6379'
});

redisClient.on('error', (err) => appLogger.error('Redis Client Error', { error: err }));
redisClient.on('connect', () => appLogger.info('Connected to Redis'));

// MinIO connection
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

// Ensure bucket exists
const BUCKET_NAME = 'patient-records';
minioClient.bucketExists(BUCKET_NAME, (err, exists) => {
  if (err) {
    appLogger.error('Error checking MinIO bucket:', { error: err });
  } else if (!exists) {
    minioClient.makeBucket(BUCKET_NAME, 'us-east-1', (err) => {
      if (err) appLogger.error('Error creating MinIO bucket:', { error: err });
      else appLogger.info('MinIO bucket created successfully', { bucket: BUCKET_NAME });
    });
  } else {
    appLogger.info('MinIO bucket already exists', { bucket: BUCKET_NAME });
  }
});

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB - VULNERABILITY: No file type validation
  }
});

// JWT Secret (VULNERABILITY: Weak secret)
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// VULNERABILITY: No rate limiting on sensitive endpoints
// const limiter = rateLimit({ ... }); // Commented out

// ==================== AUTHENTICATION ====================

// VULNERABILITY: SQL Injection - Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  appLogger.info('Login attempt received', { username, ip: req.ip, userAgent: req.headers['user-agent'] });
  // VULNERABILITY: Logging full request body and sensitive info
  appLogger.warn('Sensitive login details logged (for teaching):', { body: req.body });


  try {
    // VULNERABILITY: SQL Injection - Direct string concatenation
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    appLogger.warn('Executing query (sensitive for teaching):', { query }); // VULNERABILITY: Logging sensitive queries

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      appLogger.info('Login failed: Invalid credentials', { username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    appLogger.info('User authenticated successfully', { userId: user.id, username: user.username });

    // VULNERABILITY: Weak JWT with no expiration
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET
      // No expiration set!
    );
    appLogger.warn('JWT generated (sensitive for teaching):', { token }); // VULNERABILITY: Logging JWT

    // VULNERABILITY: Storing session in DB with predictable token
    const sessionToken = `sess_${user.id}_${Date.now()}`;
    await pool.query(
      'INSERT INTO sessions (user_id, session_token, ip_address, user_agent, expires_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL \'24 hours\')',
      [user.id, sessionToken, req.ip, req.headers['user-agent']]
    );
    appLogger.warn('Session token generated (sensitive for teaching):', { sessionToken }); // VULNERABILITY: Logging session token

    // Cache session in Redis (using setex for expiration)
    redisClient.setex(sessionToken, 86400, JSON.stringify(user), (err) => {
      if (err) appLogger.error('Redis cache error:', { error: err });
      else appLogger.info('Session cached in Redis', { key: sessionToken });
    });

    // Send back sensitive user info
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        password: user.password  // VULNERABILITY: Sending password back!
      }
    });
    appLogger.warn('Login response sent, including user password (sensitive for teaching):', { userId: user.id });

  } catch (error) {
    appLogger.error('Login error:', { error: error.message, stack: error.stack, username });
    // VULNERABILITY: Exposing internal error details
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// VULNERABILITY: Weak authentication middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    appLogger.warn('Authentication failed: No token provided', { ip: req.ip });
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // VULNERABILITY: No token blacklist check
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    appLogger.info('User authenticated', { userId: req.user.id, username: req.user.username });
    next();
  } catch (error) {
    appLogger.warn('Authentication failed: Invalid token', { error: error.message, token });
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ==================== USER ENDPOINTS ====================

// VULNERABILITY: IDOR - Get any user by ID without authorization check
app.get('/api/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    appLogger.info('Attempting to fetch user by ID', { requestedUserId: id, authenticatedUserId: req.user.id });


    // VULNERABILITY: No check if user should have access to this user's data
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      appLogger.info('User not found', { userId: id });
      return res.status(404).json({ error: 'User not found' });
    }

    // VULNERABILITY: Returning password
    res.json(result.rows[0]);
    appLogger.warn('Returned user data including password (sensitive for teaching):', { userId: id, userData: result.rows[0] });

  } catch (error) {
    appLogger.error('Error fetching user by ID:', { error: error.message, stack: error.stack, requestedUserId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY: Mass assignment - Update user profile
app.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    appLogger.info('Attempting to update user profile', { targetUserId: id, updaterUserId: req.user.id, updates });


    // VULNERABILITY: No validation of what fields can be updated
    // User could update their role to 'admin'!
    const fields = Object.keys(updates);
    const values = Object.values(updates);

    const setClause = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
    const query = `UPDATE users SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;

    const result = await pool.query(query, [...values, id]);
    res.json(result.rows[0]);
    appLogger.warn('User profile updated, potential mass assignment vulnerability:', { targetUserId: id, updatedFields: fields });

  } catch (error) {
    appLogger.error('Error updating user profile:', { error: error.message, stack: error.stack, targetUserId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

// ==================== PATIENT ENDPOINTS ====================

// VULNERABILITY: SQL Injection - Search patients
app.get('/api/patients/search', authenticate, async (req, res) => {
  try {
    const { query } = req.query;
    appLogger.info('Patient search initiated', { searchTerm: query, authenticatedUserId: req.user.id });


    // VULNERABILITY: SQL Injection via string concatenation
    const sql = `
      SELECT p.*, u.first_name, u.last_name, u.email, u.phone
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE u.first_name LIKE '%${query}%' OR u.last_name LIKE '%${query}%'
    `;

    const result = await pool.query(sql);
    // VULNERABILITY: Exposing SSN in response
    res.json(result.rows);
    appLogger.warn('Patient search results returned, potentially exposing SSN:', { searchTerm: query, count: result.rows.length, results: result.rows });

  } catch (error) {
    appLogger.error('Error during patient search:', { error: error.message, stack: error.stack, searchTerm: req.query.query });
    res.status(500).json({ error: error.message });
  }
});

// Get patient details
app.get('/api/patients/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    appLogger.info('Attempting to fetch patient details', { patientId: id, authenticatedUserId: req.user.id });


    // VULNERABILITY: No authorization check
    const result = await pool.query(
      `SELECT p.*, u.first_name, u.last_name, u.email, u.phone, u.username
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      appLogger.info('Patient not found', { patientId: id });
      return res.status(404).json({ error: 'Patient not found' });
    }

    // VULNERABILITY: Exposing sensitive data (SSN, etc.)
    res.json(result.rows[0]);
    appLogger.warn('Patient details returned, exposing sensitive data (SSN, etc.) (sensitive for teaching):', { patientId: id, patientData: result.rows[0] });

  } catch (error) {
    appLogger.error('Error fetching patient details:', { error: error.message, stack: error.stack, patientId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

// ==================== MEDICAL RECORDS ENDPOINTS ====================

// VULNERABILITY: IDOR - Access any patient's records
app.get('/api/records/patient/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    appLogger.info('Attempting to fetch medical records for patient', { patientId, authenticatedUserId: req.user.id });


    // VULNERABILITY: No check if authenticated user should access these records
    const result = await pool.query(
      `SELECT r.*, u.first_name as doctor_first_name, u.last_name as doctor_last_name
       FROM medical_records r
       JOIN users u ON r.doctor_id = u.id
       WHERE r.patient_id = $1
       ORDER BY r.visit_date DESC`,
      [patientId]
    );

    res.json(result.rows);
    appLogger.warn('Medical records returned without authorization check (IDOR vulnerability):', { patientId, recordCount: result.rows.length });

  } catch (error) {
    appLogger.error('Error fetching medical records:', { error: error.message, stack: error.stack, patientId: req.params.patientId });
    res.status(500).json({ error: error.message });
  }
});

// Upload medical record file
app.post('/api/records/:recordId/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { recordId } = req.params;
    const file = req.file;
    appLogger.info('Attempting to upload medical record file', { recordId, authenticatedUserId: req.user.id, originalname: file?.originalname });


    if (!file) {
      appLogger.warn('File upload failed: No file uploaded', { recordId, authenticatedUserId: req.user.id });
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // VULNERABILITY: No file type validation - could upload executable files
    const fileName = `record_${recordId}_${Date.now()}_${file.originalname}`;

    // Upload to MinIO
    await minioClient.putObject(
      BUCKET_NAME,
      fileName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype }
    );
    appLogger.info('File uploaded to MinIO', { recordId, fileName, bucket: BUCKET_NAME });

    // Update record with file path
    await pool.query(
      'UPDATE medical_records SET file_path = $1 WHERE id = $2',
      [fileName, recordId]
    );
    appLogger.info('Medical record updated with file path', { recordId, fileName });

    res.json({ success: true, fileName });
  } catch (error) {
    appLogger.error('Error uploading medical record file:', { error: error.message, stack: error.stack, recordId: req.params.recordId });
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY: Path traversal - Download file
app.get('/api/records/download/:fileName', authenticate, async (req, res) => {
  try {
    const { fileName } = req.params;
    appLogger.info('Attempting to download file', { fileName, authenticatedUserId: req.user.id });


    // VULNERABILITY: No validation of fileName - path traversal possible
    minioClient.getObject(BUCKET_NAME, fileName, (err, dataStream) => {
      if (err) {
        appLogger.warn('File download failed: File not found or MinIO error', { error: err.message, fileName });
        return res.status(404).json({ error: 'File not found' });
      }
      dataStream.pipe(res);
      appLogger.info('File sent for download', { fileName });
    });
  } catch (error) {
    appLogger.error('Error downloading file:', { error: error.message, stack: error.stack, fileName: req.params.fileName });
    res.status(500).json({ error: error.message });
  }
});

// ==================== APPOINTMENTS ENDPOINTS ====================

// Get appointments
app.get('/api/appointments', authenticate, async (req, res) => {
  try {
    const { patientId, doctorId } = req.query;
    appLogger.info('Fetching appointments', { patientId, doctorId, authenticatedUserId: req.user.id });


    let query = `
      SELECT a.*,
             p_user.first_name as patient_first_name, p_user.last_name as patient_last_name,
             d_user.first_name as doctor_first_name, d_user.last_name as doctor_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users p_user ON p.user_id = p_user.id
      JOIN users d_user ON a.doctor_id = d_user.id
      WHERE 1=1
    `;

    const params = [];

    if (patientId) {
      params.push(patientId);
      query += ` AND a.patient_id = $${params.length}`;
    }

    if (doctorId) {
      params.push(doctorId);
      query += ` AND a.doctor_id = $${params.length}`;
    }

    query += ' ORDER BY a.appointment_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
    appLogger.info('Appointments fetched successfully', { count: result.rows.length });

  } catch (error) {
    appLogger.error('Error fetching appointments:', { error: error.message, stack: error.stack, queryParams: req.query });
    res.status(500).json({ error: error.message });
  }
});

// Create appointment
app.post('/api/appointments', authenticate, async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, duration_minutes, reason } = req.body;
    appLogger.info('Creating new appointment', { patient_id, doctor_id, appointment_date, authenticatedUserId: req.user.id, body: req.body });


    // VULNERABILITY: No validation of input
    const result = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, duration_minutes, reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patient_id, doctor_id, appointment_date, duration_minutes || 30, reason]
    );

    res.status(201).json(result.rows[0]);
    appLogger.info('Appointment created successfully', { appointmentId: result.rows[0].id });

  } catch (error) {
    appLogger.error('Error creating appointment:', { error: error.message, stack: error.stack, body: req.body });
    res.status(500).json({ error: error.message });
  }
});

// ==================== MESSAGES ENDPOINTS ====================

// VULNERABILITY: XSS - Messages not sanitized
app.get('/api/messages/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    appLogger.info('Fetching messages for user', { targetUserId: userId, authenticatedUserId: req.user.id });


    const result = await pool.query(
      `SELECT m.*,
              from_user.first_name as from_first_name, from_user.last_name as from_last_name,
              to_user.first_name as to_first_name, to_user.last_name as to_last_name
       FROM messages m
       JOIN users from_user ON m.from_user_id = from_user.id
       JOIN users to_user ON m.to_user_id = to_user.id
       WHERE m.to_user_id = $1 OR m.from_user_id = $1
       ORDER BY m.sent_at DESC`,
      [userId]
    );

    // VULNERABILITY: Returning raw HTML/script content that will be rendered
    res.json(result.rows);
    appLogger.warn('Messages returned, potential XSS vulnerability detected:', { targetUserId: userId, count: result.rows.length });

  } catch (error) {
    appLogger.error('Error fetching messages:', { error: error.message, stack: error.stack, targetUserId: req.params.userId });
    res.status(500).json({ error: error.message });
  }
});

// Send message
app.post('/api/messages', authenticate, async (req, res) => {
  try {
    const { to_user_id, subject, body } = req.body;
    const from_user_id = req.user.id;
    appLogger.info('Sending new message', { from_user_id, to_user_id, subject, bodyLength: body.length });


    // VULNERABILITY: No sanitization of message content
    const result = await pool.query(
      'INSERT INTO messages (from_user_id, to_user_id, subject, body) VALUES ($1, $2, $3, $4) RETURNING *',
      [from_user_id, to_user_id, subject, body]
    );

    res.status(201).json(result.rows[0]);
    appLogger.info('Message sent successfully', { messageId: result.rows[0].id });

  } catch (error) {
    appLogger.error('Error sending message:', { error: error.message, stack: error.stack, from_user_id: req.user.id, to_user_id: req.body.to_user_id });
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN ENDPOINTS ====================

// VULNERABILITY: Broken access control - Admin endpoint with weak check
app.get('/api/admin/users', authenticate, async (req, res) => {
  try {
    appLogger.info('Accessing admin users endpoint', { authenticatedUserId: req.user.id, role: req.user.role });

    // VULNERABILITY: Checking role from JWT which can be tampered
    if (req.user.role !== 'admin') {
      appLogger.warn('Admin access denied: Insufficient role', { authenticatedUserId: req.user.id, role: req.user.role });
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
    appLogger.info('Admin users list retrieved', { count: result.rows.length });

  } catch (error) {
    appLogger.error('Error accessing admin users endpoint:', { error: error.message, stack: error.stack, authenticatedUserId: req.user.id });
    res.status(500).json({ error: error.message });
  }
});

// VULNERABILITY: Command injection - Backup endpoint
app.post('/api/admin/backup', authenticate, async (req, res) => {
  try {
    appLogger.info('Attempting to create backup', { authenticatedUserId: req.user.id, role: req.user.role });
    if (req.user.role !== 'admin') {
      appLogger.warn('Backup creation denied: Insufficient role', { authenticatedUserId: req.user.id, role: req.user.role });
      return res.status(403).json({ error: 'Access denied' });
    }

    const { filename } = req.body;
    appLogger.warn('Backup filename received (potential command injection):', { filename });


    // VULNERABILITY: Command injection via exec
    const { exec } = require('child_process');
    exec(`pg_dump technova_health > /backups/${filename}`, (error, stdout, stderr) => {
      if (error) {
        appLogger.error('Backup creation failed:', { error: error.message, stack: stderr, filename });
        return res.status(500).json({ error: error.message });
      }
      appLogger.info('Backup created successfully', { filename });
      res.json({ success: true, message: 'Backup created' });
    });
  } catch (error) {
    appLogger.error('Error in backup endpoint:', { error: error.message, stack: error.stack, authenticatedUserId: req.user.id });
    res.status(500).json({ error: error.message });
  }
});

// ==================== DEBUG ENDPOINTS ====================

// VULNERABILITY: Information disclosure - Debug endpoint in production
app.get('/api/debug/env', (req, res) => {
  appLogger.warn('Environment variables exposed via debug endpoint (sensitive for teaching):', { env: process.env });
  // VULNERABILITY: Exposing environment variables
  res.json(process.env);
});

app.get('/api/debug/config', (req, res) => {
  appLogger.warn('Configuration details exposed via debug endpoint (sensitive for teaching):', { config: {
    database: process.env.DATABASE_URL,
    redis: process.env.REDIS_URL,
    jwt_secret: JWT_SECRET,
    minio: {
      endpoint: process.env.MINIO_ENDPOINT,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY
    }
  }});
  // VULNERABILITY: Exposing configuration
  res.json({
    database: process.env.DATABASE_URL,
    redis: process.env.REDIS_URL,
    jwt_secret: JWT_SECRET,
    minio: {
      endpoint: process.env.MINIO_ENDPOINT,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY
    }
  });
});

// ==================== CLIENT LOGGING ENDPOINT ====================
app.post('/api/client-logs', (req, res) => {
  const { level, message, ...meta } = req.body;
  if (level && message) {
    clientLogger.log(level, message, { ...meta, ip: req.ip, userAgent: req.headers['user-agent'] });
    return res.status(200).send('Log received');
  }
  return res.status(400).send('Invalid log format');
});


// Health check
app.get('/api/health', (req, res) => {
  appLogger.info('Health check endpoint accessed');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  appLogger.info(`TechNova Health API running on port ${PORT}`);
  appLogger.warn('⚠️  WARNING: This application contains intentional security vulnerabilities for educational purposes only!');
  appLogger.warn('Logging sensitive information to /var/log/shared/backend_app.log for demonstration purposes.');
  appLogger.warn('Frontend client logs will be written to /var/log/shared/frontend_client.log.');
});

module.exports = app;
