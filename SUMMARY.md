# TechNova Health - Complete Lab Summary

## 🎯 **What You Have:**

A fully-functional, intentionally vulnerable telehealth web application for cybersecurity education, complete with:

### ✅ **Auto-Seeding from Cold Boot**
- PostgreSQL with 18 users, patients, appointments, medical records
- MinIO S3 with 5 medical record files (including exposed credentials)
- All data seeds automatically on first startup

### ✅ **Complete Web Application**
- React frontend with patient, doctor, and admin portals
- Node.js/Express backend API
- Real medical records, appointments, and messaging
- File upload/download functionality

### ✅ **Security Appliances (That Don't Work!)**
- ModSecurity WAF with OWASP Core Rule Set
- Running in DetectionOnly mode (logs but doesn't block)
- Perfect for teaching "security theater" vs real security

### ✅ **30+ Documented Vulnerabilities**
- SQL Injection
- XSS (Cross-Site Scripting)
- IDOR (Insecure Direct Object References)
- Command Injection
- Mass Assignment
- Broken Access Control
- Plaintext passwords
- Weak secrets
- Public S3 bucket
- SSH keys in Git
- And many more!

---

## 🚀 **Quick Start**

```bash
# Start everything (auto-seeds database AND MinIO)
docker-compose up -d

# Wait 30 seconds, then access:
# - Through WAF:  http://localhost:80
# - Bypass WAF:   http://localhost:3000
```

### Login Credentials:
| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Doctor | `dr.smith` | `doctor123` |
| Patient | `patient001` | `password123` |

---

## 🌐 **Access Points**

| Service | URL | Purpose |
|---------|-----|---------|
| **WAF-Protected** | http://localhost:80 | Main access (through WAF) |
| **Direct Frontend** | http://localhost:3000 | Bypass WAF (teaching) |
| **Direct API** | http://localhost:3001/api | Bypass WAF (teaching) |
| **MinIO Console** | http://localhost:9001 | View S3 files |
| **PostgreSQL** | localhost:5433 | Database access |
| **SSH (Vulnerable)** | localhost:2222 | Use exposed key |

---

## 🎓 **Key Teaching Scenarios**

### 1. **WAF Bypass** (NEW!)
**Lesson**: Security appliances don't fix bad code

**Demo**:
- Show SQL injection works through WAF (port 80)
- Show IDOR works through WAF
- Show WAF logs the attack but doesn't block it
- Show direct access (port 3000) completely bypasses WAF

**Files**: `WAF_BYPASS_GUIDE.md`

### 2. **S3 Bucket Misconfiguration**
**Lesson**: Public cloud storage = massive data breach

**Demo**:
- Access medical records without authentication:
  `http://localhost:9000/patient-records/record_1_patient001_20240115.txt`
- Download exposed credentials:
  `http://localhost:9000/patient-records/.admin_credentials_backup.txt`
- Show files in web app with download buttons

**Files**: `S3_VULNERABILITIES.md`

### 3. **SQL Injection**
**Lesson**: Never concatenate user input into SQL

**Demo**:
- Username: `admin' OR '1'='1'--`
- Password: `anything`
- Logged in as admin!

**Location**: `backend/server.js:58`

### 4. **IDOR (Access Other Users' Data)**
**Lesson**: Authorization must check every request

**Demo**:
- Login as patient001
- GET `/api/records/patient/1` - your records
- GET `/api/records/patient/2` - someone else's records!
- No error, full access

**Location**: `backend/server.js:152-169`

### 5. **Privilege Escalation**
**Lesson**: Whitelist allowed fields in updates

**Demo**:
```bash
curl -X PUT http://localhost:3001/api/users/9 \
  -H "Authorization: Bearer <token>" \
  -d '{"role":"admin"}'
```
- You're now admin!

**Location**: `backend/server.js:150-167`

### 6. **XSS (Stored)**
**Lesson**: Sanitize output, not just input

**Demo**:
- Send message with: `<script>alert('XSS')</script>`
- View message - JavaScript executes!
- Works through WAF with encoding

**Location**: `frontend/src/pages/Messages.js:106`

### 7. **Command Injection**
**Lesson**: Never execute user input as shell commands

**Demo**:
- Login as admin
- Backup filename: `backup.sql; cat /etc/passwd`
- System command executes!

**Location**: `backend/server.js:287-296`

### 8. **Secrets in Git**
**Lesson**: Never commit credentials

**Demo**:
```bash
# SSH private key is in the repo!
ssh -i ssh-keys/id_rsa technova@localhost -p 2222
```

**Location**: `ssh-keys/id_rsa`

---

## 📚 **Documentation**

### For Students:
- **README.md** - Complete overview and setup
- **QUICK_START.md** - Fast reference guide
- **VULNERABILITIES.md** - All 30+ vulnerabilities cataloged
- **S3_VULNERABILITIES.md** - Cloud storage security
- **WAF_BYPASS_GUIDE.md** - Why appliances fail

### For Instructors:
- **INSTRUCTOR_GUIDE.md** - 5-week curriculum
  - Week-by-week lesson plans
  - Learning objectives
  - Grading rubrics
  - Red vs Blue team exercises

---

## 🔍 **Architecture Highlights**

```
Internet → WAF → Frontend ← Direct Access (Bypass)
             ↓
         Backend ← Direct Access (Bypass)
             ↓
    ┌────────┼────────┐
    ↓        ↓        ↓
Postgres  Redis   MinIO (PUBLIC!)
```

**Key Points**:
- WAF in front for teaching (but attacks work anyway!)
- Direct access available to show bypasses
- Public S3 bucket (intentional breach)
- SSH exposed with key in repo
- All services dockerized

---

## 🎯 **Lab Exercises**

### Exercise 1: WAF is Useless Against IDOR
1. Login through WAF (http://localhost:80)
2. Access `/api/records/patient/1` (your records)
3. Change to `/api/records/patient/2` (not yours)
4. WAF logs nothing - request looks legitimate!
5. **Takeaway**: Application authorization is the only defense

### Exercise 2: SQL Injection Through Security Layers
1. Try through WAF: `admin' OR '1'='1'--`
2. WAF logs it but doesn't block (DetectionOnly mode)
3. Login succeeds!
4. Check logs: `docker logs technova-waf`
5. **Takeaway**: Misconfigured WAF = false security

### Exercise 3: Mass Data Exfiltration from S3
1. Enumerate bucket: `curl http://localhost:9000/patient-records/`
2. Download all files (no auth required!)
3. Find credentials in `.admin_credentials_backup.txt`
4. Use credentials to access database
5. **Takeaway**: Public buckets = instant breach

### Exercise 4: Privilege Escalation Chain
1. SQL inject to get admin JWT
2. Mass assign yourself admin role
3. Access admin panel
4. Run command injection backup
5. **Takeaway**: Vulnerabilities compound

### Exercise 5: Direct WAF Bypass
1. Port scan: `nmap localhost -p 3000-3002`
2. Find backend exposed on 3001
3. Attack directly, bypassing WAF entirely
4. **Takeaway**: Network segmentation matters

---

## 💡 **Core Lessons**

### 1. **Security Appliances ≠ Security**
- WAFs don't fix code
- Firewalls don't stop application attacks
- "We have a WAF" is not a security strategy
- Defense in depth starts with secure code

### 2. **Cloud Misconfiguration = Breach**
- Public S3 buckets leak millions of records
- Default permissions are often wrong
- One mistake = complete data exposure
- Encryption and access control are mandatory

### 3. **Secrets in Git = Game Over**
- Git history is immutable
- Anyone with repo access gets secrets
- Credential rotation after exposure
- Use `.gitignore` and secret scanning

### 4. **Input Validation ≠ Output Encoding**
- SQL injection: use parameterized queries
- XSS: encode output for context
- Command injection: avoid shell execution
- Each requires specific defenses

### 5. **Authorization on Every Request**
- Authentication ≠ Authorization
- Check permissions server-side
- Never trust client-side checks
- IDOR is everywhere in poorly designed APIs

---

## 🔄 **Common Workflows**

### Fresh Start:
```bash
docker-compose down -v
docker-compose up -d
# Everything auto-seeds!
```

### View Logs:
```bash
# WAF logs
docker logs -f technova-waf

# Backend logs
docker logs -f technova-backend

# All logs
docker-compose logs -f
```

### Test Public S3:
```bash
curl http://localhost:9000/patient-records/record_1_patient001_20240115.txt
```

### SSH Access:
```bash
ssh -i ssh-keys/id_rsa technova@localhost -p 2222
```

### Database Access:
```bash
docker exec -it technova-db psql -U technova_admin technova_health
# Password: TechN0va2024!
```

---

## 📊 **Vulnerability Distribution**

| OWASP Category | Count | Severity |
|----------------|-------|----------|
| Broken Access Control | 5 | Critical |
| Cryptographic Failures | 4 | Critical |
| Injection | 5 | Critical |
| Insecure Design | 3 | High |
| Security Misconfiguration | 6 | High |
| Vulnerable Components | 2 | High |
| Authentication Failures | 4 | Critical |
| Logging Failures | 2 | Medium |

**Total: 30+ intentional vulnerabilities**

---

## 🎓 **Course Integration**

### Week 1: Reconnaissance
- Port scanning
- Service enumeration
- Finding secrets in Git
- Discovering exposed endpoints

### Week 2: Authentication Attacks
- SQL injection
- Weak passwords
- Session management
- JWT manipulation

### Week 3: Authorization Bypass
- IDOR
- Mass assignment
- Privilege escalation
- Horizontal/vertical access control

### Week 4: Injection & XSS
- SQL, command, path injection
- Stored and reflected XSS
- Encoding evasion
- WAF bypasses

### Week 5: Cloud Security
- S3 misconfiguration
- Credential exposure
- Encryption failures
- Proper remediation

---

## 🛠️ **Customization**

### Add More Users:
Edit `database/init/02-seed-data.sql`

### Add More Vulnerabilities:
- Backend: `backend/server.js`
- Frontend: `frontend/src/pages/*.js`

### Change WAF Mode to Blocking:
Edit `waf/modsecurity-override.conf`:
```conf
SecRuleEngine On  # Change from DetectionOnly
```

### Add More S3 Files:
Edit `backend/seed-minio.js`

---

## 📈 **Metrics & Assessment**

### Success Criteria:
- [ ] Students find 15+ vulnerabilities
- [ ] Students exploit SQL injection
- [ ] Students demonstrate IDOR
- [ ] Students bypass WAF
- [ ] Students write vulnerability reports
- [ ] Students propose proper fixes

### Grading Rubric:
- 30% - Vulnerability discovery
- 25% - Successful exploitation
- 20% - Impact assessment
- 20% - Remediation proposals
- 5% - Documentation quality

---

## 🚨 **Important Reminders**

1. **NEVER deploy to production or public internet**
2. **Only use in isolated lab environment**
3. **Teach ethical hacking and responsible disclosure**
4. **Emphasize legal and ethical boundaries**
5. **Use for authorized education only**

---

## 🎉 **You're Ready!**

Everything is built, documented, and ready to teach. Just run:

```bash
docker-compose up -d
```

Wait 30 seconds, then point students to http://localhost:80

They now have:
- A realistic vulnerable web app
- Complete documentation
- Hands-on exercises
- Real-world scenarios
- Defense lessons

**Happy teaching! Make the internet safer, one student at a time.** 🛡️
