# TechNova Health - WAF Bypass Guide (Coraza + Caddy)

## ⚠️ The False Sense of Security

This lab demonstrates a critical lesson: **Security appliances don't fix insecure code.**

Many organizations deploy firewalls and WAFs thinking they're now "secure," but application-layer vulnerabilities bypass these controls completely.

**NEW**: We're using **Coraza WAF** (modern, actively maintained) with **Caddy** as the reverse proxy. ModSecurity was EOL'd, making it perfect for teaching about technical debt and unmaintained security tools.

---

## 🏗️ Updated Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Internet / User                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────▼──────────────┐
                │   WAF (Port 80)          │
                │   Caddy + Coraza         │
                │   OWASP CRS v4.15        │
                └───────────┬──────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
     ┌────▼─────┐    ┌─────▼──────┐   ┌─────▼────────┐
     │ Frontend │    │  Backend   │   │   MinIO      │
     │ (React)  │◄──▶│ (Node.js)  │◄─▶│   (S3)       │
     │ Port 3000│    │ Port 3001  │   │  Port 9000   │
     └──────────┘    └─────┬──────┘   └──────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
      ┌───▼────┐     ┌────▼────┐     ┌────▼─────┐
      │Postgres│     │  Redis  │     │   SSH    │
      │Pt 5433 │     │Pt 6379  │     │  Pt 2222 │
      └────────┘     └─────────┘     └──────────┘
```

### Access Points:

| Service | Through WAF | Direct (Bypass WAF) | Purpose |
|---------|-------------|---------------------|---------|
| Web App | http://localhost:80 | http://localhost:3000 | Show WAF vs bypass |
| API | http://localhost:80/api | http://localhost:3001/api | Test endpoints |
| WAF Health | http://localhost:80/health | N/A | Check WAF status |

---

## 🔥 What the WAF Does (And Doesn't Do)

### ✅ What Coraza + OWASP CRS v4 CAN Detect:

1. **Known Signatures**: Obvious attack patterns
   - `<script>alert(1)</script>`
   - `' OR 1=1--`
   - `../../../etc/passwd`

2. **Common Exploits**: Well-documented attacks
   - Basic SQL injection
   - Simple XSS
   - Directory traversal

3. **Protocol Violations**: HTTP spec violations
   - Invalid headers
   - Malformed requests

### ❌ What the WAF CANNOT Prevent:

1. **Business Logic Flaws**
   - Accessing other users' data via legitimate API calls
   - Privilege escalation through mass assignment
   - Race conditions

2. **Authorization Issues**
   - IDOR (Insecure Direct Object References)
   - Missing access controls
   - Horizontal/vertical privilege escalation

3. **Application-Specific Vulnerabilities**
   - Weak password policies
   - Insecure session management
   - Cryptographic failures

4. **Zero-Day Exploits**
   - Novel attack vectors
   - Custom application logic abuse

---

## 🎓 Lab Exercises

### Exercise 1: WAF Detects But Doesn't Block (DetectionOnly Mode)

**Objective**: Show that many organizations run WAFs in monitoring mode.

**Current Configuration**: The WAF is in `DetectionOnly` mode - it logs attacks but doesn't block them.

**Steps**:

1. **SQL Injection through WAF**:
   ```bash
   # This WILL be logged by WAF
   curl -X POST http://localhost:80/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin'\'' OR '\''1'\''='\''1'\''--","password":"anything"}'
   ```

2. **Check WAF logs**:
   ```bash
   # View ModSecurity audit log
   tail -f waf/logs/modsec_audit.log | grep "SQL Injection"
   ```

3. **Notice**: Attack was **logged** but the login **succeeded**!

**Teaching Point**:
> "We have a WAF!" doesn't mean you're protected. Many orgs run WAFs in detection-only mode to avoid breaking applications, providing zero actual protection.

---

### Exercise 2: IDOR Bypasses WAF Completely

**Objective**: Demonstrate business logic flaws bypass WAFs.

**Attack**: Access another user's medical records.

**Steps**:

1. **Login through WAF**:
   - Go to: http://localhost:80
   - Login as: `patient001` / `password123`

2. **Intercept request** (use Browser DevTools):
   ```
   GET http://localhost:80/api/records/patient/1
   ```

3. **Change patient ID to 2**:
   ```
   GET http://localhost:80/api/records/patient/2
   ```

4. **Result**: You see patient002's records!

**WAF Verdict**: ✅ **Request looks completely legitimate**
- Valid HTTP syntax
- Authenticated session
- No malicious patterns
- No SQL injection

**Reality**: 🔴 **Severe authorization vulnerability**

**Teaching Point**:
> The WAF sees a normal, authenticated API call. It has NO IDEA you shouldn't have access to that patient ID. Application authorization is the only defense.

---

### Exercise 3: XSS Through WAF

**Objective**: Show signature evasion techniques.

**Basic XSS (WAF might catch)**:
```javascript
<script>alert('XSS')</script>
```

**Obfuscated XSS (WAF might miss)**:
```javascript
// HTML entity encoding
<img src=x onerror="&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;">

// JavaScript encoding
<img src=x onerror="\u0061\u006c\u0065\u0072\u0074('XSS')">

// Mixed case
<sCriPt>alert('XSS')</sCriPt>

// Null bytes
<script\x00>alert('XSS')</script>
```

**Steps**:

1. **Login and go to Messages**
2. **Send message with encoded XSS**:
   ```
   <img src=x onerror="&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;">
   ```

3. **Check WAF logs** - might not detect it
4. **View message** - XSS executes!

**Teaching Point**:
> WAFs use signatures. Attackers use encoding, obfuscation, and novel techniques to evade detection. Only proper input validation and output encoding prevent XSS.

---

### Exercise 4: Mass Assignment Bypasses WAF

**Objective**: Show privilege escalation via valid JSON.

**Attack**: Elevate from patient to admin.

**Steps**:

1. **Login as patient**

2. **Intercept update request**:
   ```bash
   curl -X PUT http://localhost:80/api/users/9 \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"first_name":"Alice","role":"admin"}'
   ```

3. **WAF Analysis**:
   - ✅ Valid JSON
   - ✅ Authenticated request
   - ✅ No SQL injection
   - ✅ No XSS
   - ✅ No malicious patterns

4. **Result**: You're now admin!

**Teaching Point**:
> The request is perfectly valid HTTP/JSON. The WAF has NO IDEA which fields should be updatable. Application logic must whitelist allowed fields.

---

### Exercise 5: Directly Bypass the WAF

**Objective**: Show defense in depth principle.

**Scenario**: Attacker discovers the backend is exposed on port 3001.

**Steps**:

1. **Port scan**:
   ```bash
   nmap localhost -p 3000-3002
   ```

2. **Find port 3001 open**

3. **Attack directly** (bypassing WAF completely):
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin'\'' OR '\''1'\''='\''1'\''--","password":"x"}'
   ```

4. **Result**: WAF never sees the traffic!

**Teaching Point**:
> Network segmentation matters. Backend services shouldn't be publicly accessible. But even with perfect network security, vulnerable code is still vulnerable.

---

### Exercise 6: Command Injection Through WAF

**Objective**: Show advanced attacks bypass WAFs.

**Attack**: Execute commands via the admin backup feature.

**Steps**:

1. **Login as admin** (use SQL injection if needed)

2. **Go to Admin Panel**

3. **Use backup feature** with:
   ```
   backup.sql; cat /etc/passwd
   ```

4. **WAF sees**:
   - ✅ Authenticated admin user
   - ✅ POST to valid endpoint
   - ✅ Seemingly innocent filename

5. **Reality**: Command injection executes!

**Teaching Point**:
> The WAF can't distinguish between "backup.sql" (legitimate) and "backup.sql; cat /etc/passwd" (malicious) without deep application context. Input validation must happen in code.

---

## 📊 WAF Effectiveness Matrix

| Vulnerability | WAF Detection | WAF Prevention | Secure Code Prevention |
|---------------|---------------|----------------|------------------------|
| SQL Injection (basic) | ⚠️ Maybe | ⚠️ Maybe | ✅ Yes |
| SQL Injection (encoded) | ❌ No | ❌ No | ✅ Yes |
| IDOR | ❌ No | ❌ No | ✅ Yes |
| Mass Assignment | ❌ No | ❌ No | ✅ Yes |
| XSS (basic) | ⚠️ Maybe | ⚠️ Maybe | ✅ Yes |
| XSS (obfuscated) | ❌ No | ❌ No | ✅ Yes |
| Command Injection | ⚠️ Maybe | ⚠️ Maybe | ✅ Yes |
| Broken Access Control | ❌ No | ❌ No | ✅ Yes |
| Sensitive Data Exposure | ❌ No | ❌ No | ✅ Yes |
| Security Misconfiguration | ❌ No | ❌ No | ✅ Yes |
| Using Vulnerable Components | ❌ No | ❌ No | ✅ Yes |
| Insufficient Logging | ❌ No | ❌ No | ✅ Yes |

**Legend**:
- ✅ **Yes** = Reliably prevents
- ⚠️ **Maybe** = Signature-dependent, can be bypassed
- ❌ **No** = Cannot detect/prevent

---

## 🔍 Analyzing WAF Logs

### View Real-Time Logs

```bash
# ModSecurity audit log
tail -f waf/logs/modsec_audit.log

# Nginx access log
docker logs -f technova-waf

# Filter for attacks
docker logs technova-waf 2>&1 | grep -i "attack\|injection\|xss"
```

### What Good Logs Look Like

```
[05/Dec/2024:12:34:56] [client 172.18.0.1] ModSecurity: Warning.
Pattern match "(?i:(union|select|insert|update|delete).*from)" at ARGS:username.
[file "/etc/modsecurity.d/owasp-crs/rules/modsecurity-override.conf"]
[line "42"] [id "2000"] [msg "Potential SQL Injection Detected (NOT BLOCKED)"]
[data "Matched Data: ' OR '1'='1'--"]
[severity "CRITICAL"] [tag "OWASP_CRS"] [tag "application-multi"]
```

**Key Points**:
- ✅ Attack was **detected**
- ⚠️ But **NOT BLOCKED** (DetectionOnly mode)
- 📊 Provides forensic data
- ❌ Didn't prevent the exploit

---

## 🛡️ Proper Defense Strategy

### ❌ **Wrong Approach**:
```
"We have a firewall and WAF, we're secure!"
```

### ✅ **Correct Approach** (Defense in Depth):

1. **Secure Code** (Primary Defense)
   - Input validation
   - Output encoding
   - Parameterized queries
   - Principle of least privilege
   - Proper authorization checks

2. **WAF** (Secondary Defense)
   - Detect known attacks
   - Buy time for patching
   - Add friction for attackers
   - Forensic evidence

3. **Network Security** (Perimeter)
   - Firewall rules
   - Network segmentation
   - VPN/zero trust

4. **Monitoring** (Detection)
   - SIEM
   - Anomaly detection
   - Incident response

5. **Encryption** (Protection at Rest/Transit)
   - TLS/SSL
   - Database encryption
   - Encrypted backups

---

## 💰 Real-World Impact

### Case Study: Capital One Breach (2019)

- **Had**: Firewalls, WAFs, IDS/IPS
- **Vulnerable**: SSRF in application code
- **Result**: 100M+ customer records stolen
- **Cost**: $80M fine + $190M settlement
- **Lesson**: Security appliances didn't stop application logic flaw

### Case Study: Equifax Breach (2017)

- **Had**: Firewalls, network security
- **Vulnerable**: Unpatched Apache Struts (CVE-2017-5638)
- **Result**: 147M people's data stolen
- **Cost**: $700M settlement
- **Lesson**: Vulnerability in application framework bypassed perimeter security

---

## 🔧 Configuration Modes

### Current: DetectionOnly Mode

```conf
SecRuleEngine DetectionOnly
```

**Behavior**:
- ✅ Logs attacks
- ❌ Doesn't block
- 💼 Common in production (avoid breaking apps)

### Alternative: Blocking Mode

Edit `waf/modsecurity-override.conf`:

```conf
SecRuleEngine On
```

**Then rebuild**:
```bash
docker-compose up -d --build waf
```

**Test**: Some attacks will be blocked, but IDOR, mass assignment, and business logic flaws will still work!

---

## 📝 Discussion Questions for Students

1. **Why do organizations run WAFs in DetectionOnly mode?**
   - Fear of false positives breaking legitimate traffic
   - Lack of tuning/expertise
   - "Security theater" - looks good to auditors

2. **Can a WAF prevent zero-day exploits?**
   - No - it relies on signatures of known attacks
   - Only secure code prevents unknown vulnerabilities

3. **What's the role of a WAF in defense in depth?**
   - Secondary control, not primary
   - Buys time for patching
   - Provides attack visibility
   - But never replaces secure coding

4. **How should organizations prioritize security investments?**
   - Secure SDLC first (cheapest, most effective)
   - Security testing (SAST, DAST, pentesting)
   - Training developers
   - Then appliances as supplementary controls

---

## 🎯 Key Takeaways

1. **WAFs are NOT a silver bullet** - They catch some attacks, miss many others

2. **Application logic flaws bypass WAFs** - IDOR, broken access control, business logic issues

3. **Signature-based detection is limited** - Evasion techniques work

4. **Secure code is the only real solution** - Fix the root cause, not symptoms

5. **Defense in depth** - Use multiple layers, but start with secure code

6. **DetectionOnly mode provides false security** - Common misconfiguration

7. **Network exposure matters** - Direct backend access bypasses all appliances

---

## 📚 Additional Resources

- [OWASP ModSecurity Core Rule Set](https://owasp.org/www-project-modsecurity-core-rule-set/)
- [WAF Bypass Techniques](https://owasp.org/www-community/attacks/Web_Application_Firewall_Bypass)
- [Why WAFs Fail](https://www.darkreading.com/application-security/why-web-application-firewalls-fail)
- [Defense in Depth](https://www.nist.gov/publications/defense-depth)

---

**Bottom Line**: A WAF is like putting a security guard at the front door while leaving the back door wide open. Fix the code.
