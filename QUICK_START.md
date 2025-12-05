# TechNova Health - Quick Start Guide

## Get Up and Running in 5 Minutes

### 1. Start the Lab

```bash
cd technova
docker-compose up -d
```

Wait 30 seconds for services to initialize.

### 2. Access the Application

Open your browser to: **http://localhost:3000**

### 3. Login

Try these accounts:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Doctor | `dr.smith` | `doctor123` |
| Patient | `patient001` | `password123` |

### 4. Try Your First Exploit

**SQL Injection Login Bypass:**

1. Go to http://localhost:3000
2. Username: `admin' OR '1'='1'--`
3. Password: `anything`
4. Click Login
5. You're in! 🎉

### 5. Explore More

- **Admin Panel**: See all users and their plaintext passwords
- **Messages**: Try XSS with `<script>alert('XSS')</script>`
- **Medical Records**: Change patient ID to see other patients' data
- **API Docs**: http://localhost:3001/api/health

## Quick Reference

### Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:3001 | - |
| MinIO Console | http://localhost:9001 | minioadmin/minioadmin |
| PostgreSQL | localhost:5432 | technova_admin/TechN0va2024! |
| Redis | localhost:6379 | Password: redis123 |
| SSH | localhost:2222 | Key: ssh-keys/id_rsa |
| OpenVAS | http://localhost:9392 | admin/admin |

### Common Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop everything
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Access database
docker exec -it technova-db psql -U technova_admin technova_health

# SSH into backend
ssh -i ssh-keys/id_rsa technova@localhost -p 2222
```

### Quick Wins (Easy Vulnerabilities)

1. **SQL Injection** - Login page
   - Payload: `' OR '1'='1'--`

2. **Exposed Secrets** - Check the repo
   - File: `ssh-keys/id_rsa`

3. **Debug Endpoint** - Exposed config
   - URL: http://localhost:3001/api/debug/config

4. **IDOR** - View any user
   - URL: http://localhost:3001/api/users/1

5. **XSS** - Messages
   - Payload: `<img src=x onerror=alert(1)>`

6. **Command Injection** - Admin backup
   - Payload: `backup.sql; whoami`

## Tools to Use

### Browser Tools
- Chrome/Firefox DevTools
- EditThisCookie extension
- FoxyProxy for proxying

### Security Tools
```bash
# Install common tools
sudo apt install nmap nikto sqlmap

# Run Burp Suite
java -jar burpsuite.jar

# Scan for vulnerabilities
npm audit
```

### Reconnaissance

```bash
# Port scan
nmap -sV localhost -p 3000,3001,5432,6379,9000,2222

# Directory enumeration
dirb http://localhost:3001

# Find secrets in Git
trufflehog git file://. --only-verified
```

## Need Help?

- **Documentation**: See README.md
- **Vulnerabilities**: See VULNERABILITIES.md
- **Instructors**: See INSTRUCTOR_GUIDE.md

## Stop the Lab

```bash
docker-compose down
```

To completely remove all data:
```bash
docker-compose down -v
```

---

**Remember**: This is a learning environment. Everything here is intentionally vulnerable!
