# TechNova Health - Cybersecurity Training Lab

![Warning](https://img.shields.io/badge/WARNING-Intentionally%20Vulnerable-red)
![Educational](https://img.shields.io/badge/Purpose-Educational-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-brightgreen)

## ⚠️ IMPORTANT NOTICE

**THIS APPLICATION CONTAINS INTENTIONAL SECURITY VULNERABILITIES**

TechNova Health is a deliberately vulnerable telehealth web application designed for cybersecurity education. It is similar to OWASP Juice Shop and WebGoat, built specifically for teaching:

- Network defense and security
- Vulnerability identification and exploitation
- Secure coding practices
- Incident response
- Security testing methodologies

**NEVER deploy this application on a public network or production environment!**

---

## 🏥 About TechNova Health

TechNova is a fictional telehealth company. This lab environment simulates a complete healthcare web application with multiple services, user roles, and realistic features - all intentionally designed with security flaws for educational purposes.

## 🎯 Learning Objectives

Students will learn to:

1. **Identify Vulnerabilities**: Discover common web application vulnerabilities (OWASP Top 10)
2. **Exploit Weaknesses**: Understand how attackers exploit security flaws
3. **Defend Systems**: Implement proper security controls and best practices
4. **Test Security**: Use security testing tools and methodologies
5. **Secure Development**: Learn secure coding practices through examples of what NOT to do

## 🏗️ Architecture

```
                        ┌──────────────┐
                        │   Internet   │
                        └──────┬───────┘
                               │
                  ┌────────────▼──────────────┐
                  │   WAF (Port 80/8080)      │
                  │   ModSecurity +           │
                  │   OWASP Core Rule Set     │
                  │   ⚠️ DetectionOnly Mode    │
                  └────────────┬──────────────┘
                               │
        ┌──────────────────────┼───────────────────────┐
        │                      │                       │
    ┌───▼────────┐      ┌─────▼─────┐        ┌───────▼──────┐
    │  Frontend  │      │  Backend  │        │  PostgreSQL  │
    │  (React)   │◄────▶│ (Node.js) │◄──────▶│   Database   │
    │ Port: 3000 │      │Port: 3001 │        │  Port: 5433  │
    └────────────┘      └─────┬─────┘        └──────────────┘
       Direct Access           │
       (Bypass WAF)     ┌──────┴──────┐
                        │             │
                 ┌──────▼────┐  ┌────▼─────┐
                 │   Redis   │  │  MinIO   │
                 │  (Cache)  │  │  (S3)    │
                 │ Port:6379 │  │Port:9000 │
                 └───────────┘  └──────────┘
                                     │
                        PUBLIC BUCKET (Vuln!)

       SSH Access: Port 2222 (Exposed Private Key!)
```

### Services

1. **WAF (ModSecurity + OWASP CRS)** - Port 80, 8080
   - Web Application Firewall
   - ⚠️ Running in DetectionOnly mode (logs but doesn't block)
   - Demonstrates that WAFs don't fix bad code
   - All attacks still work through the WAF!

2. **Frontend (React)** - Port 3000
   - Patient portal
   - Doctor interface
   - Admin panel
   - Messaging system
   - Direct access available (WAF bypass for teaching)

3. **Backend (Node.js/Express)** - Port 3001
   - REST API
   - Authentication
   - Business logic
   - SSH access on port 2222

4. **PostgreSQL** - Port 5432
   - User data
   - Medical records
   - Appointments
   - Messages

5. **Redis** - Port 6379
   - Session storage
   - Caching layer

6. **MinIO** - Ports 9000, 9001
   - S3-compatible storage
   - Medical record attachments

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Git
- 8GB RAM recommended
- Ports 3000, 3001, 5432, 6379, 9000, 9001, 2222 available

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd technova

# Start all services
docker-compose up -d

# Wait for services to initialize (about 30 seconds)

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# MinIO Console: http://localhost:9001
```

### Default Credentials

#### Admin Account
- Username: `admin`
- Password: `admin123`

#### Doctor Accounts
- Username: `dr.smith` / Password: `doctor123`
- Username: `dr.johnson` / Password: `medical2024`

#### Patient Accounts
- Username: `patient001` / Password: `password123`
- Username: `patient002` / Password: `123456`
- Username: `patient003` / Password: `qwerty`

See `database/init/02-seed-data.sql` for all accounts.

## 🎓 Educational Modules

### Module 1: Reconnaissance & Information Gathering
- Discover exposed debug endpoints
- Find sensitive information in client-side code
- Identify exposed SSH keys in Git repository
- Enumerate users and roles

### Module 2: Authentication & Session Management
- SQL Injection in login form
- Weak password policies
- Session hijacking opportunities
- JWT vulnerabilities

### Module 3: Broken Access Control
- Insecure Direct Object References (IDOR)
- Privilege escalation via mass assignment
- Missing authorization checks
- Role-based access control bypasses

### Module 4: Injection Attacks
- SQL Injection (multiple endpoints)
- Command Injection in backup functionality
- XSS in messaging system
- Path traversal in file download

### Module 5: Sensitive Data Exposure
- Plaintext password storage
- SSN exposure in API responses
- Exposed configuration and secrets
- Unencrypted data transmission

### Module 6: Security Misconfiguration
- SSH keys in Git repository
- Debug endpoints in production
- Overly permissive CORS
- Missing security headers
- Weak credentials

### Module 7: Vulnerable Dependencies
- Outdated npm packages with known CVEs
- Using deprecated libraries
- Missing security patches

## 🔍 Vulnerability Catalog

See [VULNERABILITIES.md](VULNERABILITIES.md) for a complete list of intentional vulnerabilities, organized by:
- OWASP Top 10 category
- Severity level
- Location in code
- Exploitation steps
- Remediation guidance

## 🛠️ Tools for Testing

Recommended tools for students:

### Reconnaissance
- Nmap
- Nikto
- dirb/dirbuster

### Web Testing
- Burp Suite (Community Edition)
- OWASP ZAP
- Browser DevTools

### Database Testing
- SQLMap
- Manual SQL injection

### Secret Scanning
- TruffleHog
- git-secrets
- GitLeaks

### Dependency Scanning
- npm audit
- Snyk
- OWASP Dependency-Check

### Network Analysis
- Wireshark
- tcpdump

## 📝 Lab Exercises

### Exercise 1: SQL Injection
**Objective**: Bypass authentication and access unauthorized data

1. Navigate to the login page
2. Attempt SQL injection in username field
3. Try payloads like: `admin' OR '1'='1'--`
4. Document successful payloads
5. Extract data using UNION-based injection

### Exercise 2: Broken Access Control
**Objective**: Access other users' medical records

1. Log in as a patient
2. Navigate to Medical Records
3. Identify the patient ID in API requests
4. Modify the ID to access other patients' records
5. Document the IDOR vulnerability

### Exercise 3: XSS Attack
**Objective**: Execute JavaScript in another user's context

1. Log in to the messaging system
2. Craft an XSS payload
3. Send a message with `<script>alert('XSS')</script>`
4. View the message as the recipient
5. Demonstrate persistent XSS

### Exercise 4: Secret Discovery
**Objective**: Find exposed secrets in the repository

1. Clone the repository
2. Use git-secrets or TruffleHog
3. Locate SSH private key
4. Attempt SSH access: `ssh -i ssh-keys/id_rsa technova@localhost -p 2222`
5. Document findings

### Exercise 5: Privilege Escalation
**Objective**: Elevate privileges from patient to admin

1. Log in as a patient
2. Intercept user update requests
3. Modify the role field to 'admin'
4. Document the mass assignment vulnerability

### Exercise 6: Command Injection
**Objective**: Execute system commands via backup functionality

1. Log in as admin
2. Navigate to Admin Portal
3. Use the backup feature with payload: `backup.sql; cat /etc/passwd`
4. Observe command execution
5. Document the vulnerability

## 🔒 Security Remediation

After identifying vulnerabilities, students should:

1. **Document Findings**: Create detailed vulnerability reports
2. **Assess Risk**: Determine severity and impact
3. **Propose Fixes**: Suggest secure code alternatives
4. **Implement Solutions**: Fix vulnerabilities (create a "secure" branch)
5. **Verify Fixes**: Test that vulnerabilities are patched
6. **Best Practices**: Document security best practices

### Example Remediations

#### SQL Injection Fix
```javascript
// VULNERABLE
const query = `SELECT * FROM users WHERE username = '${username}'`;

// SECURE
const query = 'SELECT * FROM users WHERE username = $1';
const result = await pool.query(query, [username]);
```

#### XSS Prevention
```javascript
// VULNERABLE
dangerouslySetInnerHTML={{ __html: message.body }}

// SECURE
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.body) }}
```

## 🧪 Testing the Lab

### Unit Tests
```bash
cd backend
npm test
```

### Security Scans
```bash
# Dependency vulnerabilities
npm audit

# Container scanning
docker scan technova-backend

# Secret scanning
trufflehog git file://. --only-verified
```

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## 🤝 Contributing

This is an educational project. To contribute:

1. Fork the repository
2. Create a feature branch
3. Add new vulnerabilities or exercises
4. Update documentation
5. Submit a pull request

## ⚖️ Legal Disclaimer

This application is for **authorized educational purposes only**.

- Only use in controlled lab environments
- Do not deploy on public networks
- Do not use techniques learned here for unauthorized access
- Obtain proper authorization before security testing
- Follow responsible disclosure practices

The creators assume no liability for misuse of this educational material.

## 📧 Support

For questions or issues:
- Review the documentation
- Check [VULNERABILITIES.md](VULNERABILITIES.md)
- Contact your instructor

## 📄 License

This project is licensed for educational use only.

---

**Remember: With great power comes great responsibility. Use these skills ethically!**
