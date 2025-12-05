# TechNova Health - S3/MinIO Security Vulnerabilities Guide

## Overview

This lab demonstrates **critical cloud storage security vulnerabilities** commonly found in real-world applications using S3 or S3-compatible storage (MinIO).

---

## 🚨 Intentional Vulnerabilities

### 1. **Publicly Accessible Bucket**

**Severity**: 🔴 **CRITICAL**

**Description**: The `patient-records` bucket is configured with public read access, allowing anyone to download files without authentication.

**Exploitation**:
```bash
# No authentication required!
curl http://localhost:9000/patient-records/record_1_patient001_20240115.txt

# Download via browser (no login needed)
http://localhost:9000/patient-records/record_1_patient001_20240115.txt
```

**Impact**:
- Complete data breach of all medical records
- HIPAA violation - massive fines
- Patient privacy compromise
- Legal liability

**Real-World Examples**:
- Capital One breach (2019) - 100M+ customer records
- Imperva breach (2019) - customer data exposed
- GoDaddy AWS buckets (2020) - source code exposed

---

### 2. **No Encryption at Rest**

**Severity**: 🔴 **CRITICAL**

**Description**: Medical records are stored in MinIO without server-side encryption.

**Risk**: If an attacker gains physical access to the storage, files are readable in plaintext.

**Remediation**:
```bash
# Enable SSE-S3 encryption
mc encrypt set sse-s3 minio/patient-records
```

---

### 3. **Exposed Credentials in S3**

**Severity**: 🔴 **CRITICAL**

**Description**: Admin credentials accidentally stored in the bucket as a "backup."

**Exploitation**:
```bash
# Download the credentials file
curl http://localhost:9000/patient-records/.admin_credentials_backup.txt

# Contents include:
# - Database passwords
# - MinIO access keys
# - Redis password
# - SSH passwords
# - JWT secrets
```

**Impact**: Complete system compromise

**Real-World Pattern**: Developers often store config backups, secrets, or environment files in S3 "temporarily" and forget about them.

---

### 4. **No Access Logging**

**Severity**: 🟠 **HIGH**

**Description**: Bucket has no access logs enabled - impossible to detect unauthorized access.

**Impact**:
- Can't detect data breaches
- No audit trail
- Compliance violations

**Remediation**:
```bash
mc admin trace minio
mc event add minio/patient-records arn:minio:sqs::audit:kafka
```

---

### 5. **Direct Object Access (No Presigned URLs)**

**Severity**: 🟠 **HIGH**

**Description**: Application uses direct S3 URLs instead of presigned URLs with expiration.

**Current (Vulnerable)**:
```
http://localhost:9000/patient-records/record_1_patient001_20240115.txt
```

**Secure Alternative**:
```javascript
// Generate presigned URL that expires in 1 hour
const presignedUrl = await minioClient.presignedGetObject(
  'patient-records',
  'record_1_patient001_20240115.txt',
  60 * 60 // 1 hour
);
```

**Impact**: URLs can be shared indefinitely, bookmarked, indexed by search engines.

---

### 6. **No Content-Type Validation**

**Severity**: 🟠 **HIGH**

**Description**: Bucket accepts any file type - could be used to host malware.

**Exploitation**:
```bash
# Upload malicious executable
echo "malicious content" > malware.exe
mc cp malware.exe minio/patient-records/malware.exe
```

**Remediation**: Validate file types and use content scanning.

---

### 7. **Missing Lifecycle Policies**

**Severity**: 🟡 **MEDIUM**

**Description**: Old medical records never expire or move to cheaper storage tiers.

**Impact**:
- Increased storage costs
- Data retention compliance issues
- Larger attack surface

**Remediation**:
```bash
# Archive old files to cold storage after 90 days
mc ilm add minio/patient-records --transition-days 90 --storage-class GLACIER
```

---

### 8. **No Versioning**

**Severity**: 🟡 **MEDIUM**

**Description**: File versioning is not enabled - deleted/overwritten files are lost forever.

**Remediation**:
```bash
mc version enable minio/patient-records
```

---

## 📋 Lab Exercises

### Exercise 1: Enumerate Public Buckets

**Objective**: Discover publicly accessible buckets and enumerate contents.

**Steps**:
1. Access MinIO console at http://localhost:9001
2. Login with `minioadmin` / `minioadmin`
3. Browse `patient-records` bucket
4. Note the public access policy

**Discovery via CLI**:
```bash
# List all buckets (requires credentials)
mc ls minio/

# Check bucket policy
mc anonymous get minio/patient-records
```

---

### Exercise 2: Download Medical Records Without Authentication

**Objective**: Demonstrate public data breach.

**Steps**:
1. Open browser in **incognito/private mode**
2. Navigate to: `http://localhost:9000/patient-records/record_1_patient001_20240115.txt`
3. File downloads without any login!
4. Try other files:
   - `record_3_patient002_20240120.txt`
   - `record_6_patient005_20240205.txt`
   - `record_10_patient009_20240222.txt`

**Automation**:
```bash
# Download all medical records
for file in record_1_patient001_20240115.txt \
            record_3_patient002_20240120.txt \
            record_6_patient005_20240205.txt \
            record_10_patient009_20240222.txt; do
  curl -O http://localhost:9000/patient-records/$file
done
```

---

### Exercise 3: Discover Hidden Credentials

**Objective**: Find sensitive files in the bucket.

**Steps**:
```bash
# List all files including hidden ones
mc ls minio/patient-records/ --recursive

# Look for unusual files
# Found: .admin_credentials_backup.txt

# Download it
curl http://localhost:9000/patient-records/.admin_credentials_backup.txt

# Use the discovered credentials
psql -h localhost -p 5433 -U technova_admin -d technova_health
# Password from file: TechN0va2024!
```

**Impact**: Now you have full database access, MinIO admin access, and more!

---

### Exercise 4: Search Engine Discovery

**Objective**: Demonstrate how public buckets get indexed by search engines.

**Simulation**:
```bash
# Google Dorks for S3 buckets:
site:s3.amazonaws.com "patient" "medical"
site:s3.amazonaws.com confidential filetype:pdf

# For MinIO (if exposed to internet):
site:yourdomain.com:9000 inurl:patient-records
```

**Impact**: Medical records can be discovered via Google!

---

### Exercise 5: Abuse for Malware Hosting

**Objective**: Demonstrate how misconfigured buckets can host malware.

**Steps**:
```bash
# Create a fake malware file
echo '<script>alert("XSS")</script>' > malicious.html

# Upload to public bucket
mc cp malicious.html minio/patient-records/malicious.html

# Now attackers can host phishing/malware at:
http://localhost:9000/patient-records/malicious.html
```

---

## 🔒 Remediation Strategies

### Step 1: Remove Public Access

```bash
# Remove public access
mc anonymous set none minio/patient-records

# Verify
mc anonymous get minio/patient-records
# Should return: Access permission for 'minio/patient-records' is 'none'
```

### Step 2: Implement IAM Policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": ["arn:aws:iam::ACCOUNT:user/doctor"]
      },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::patient-records/*"],
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": "10.0.0.0/8"
        }
      }
    }
  ]
}
```

### Step 3: Enable Encryption

```bash
# Enable server-side encryption
mc encrypt set sse-s3 minio/patient-records
```

### Step 4: Use Presigned URLs

```javascript
// Backend API - generate presigned URL
app.get('/api/records/download/:fileName', authenticate, async (req, res) => {
  const { fileName } = req.params;

  // Authorization check
  if (!userHasAccessToFile(req.user, fileName)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Generate presigned URL (expires in 5 minutes)
  const presignedUrl = await minioClient.presignedGetObject(
    'patient-records',
    fileName,
    5 * 60
  );

  res.json({ downloadUrl: presignedUrl });
});
```

### Step 5: Enable Access Logging

```bash
# Enable access logs to audit bucket
mc admin trace minio --verbose
```

### Step 6: Implement Bucket Scanning

- Use AWS Macie or similar tools to scan for sensitive data
- Implement automated alerts for new public buckets
- Regular security audits

---

## 🎓 Teaching Points

### For Students:

1. **Cloud Storage ≠ Secure by Default**: Public buckets are a leading cause of data breaches
2. **Principle of Least Privilege**: Only grant minimum necessary permissions
3. **Defense in Depth**: Use multiple layers (IAM, encryption, network controls)
4. **Audit Everything**: Enable logging and monitor access
5. **Assume Breach**: Encrypt data so breaches have less impact

### For Red Team:

1. **Enumeration**: Look for public buckets using tools like:
   - AWS CLI with `--no-sign-request`
   - Bucket stream, S3Scanner
   - Google dorks

2. **Common Mistakes**:
   - Buckets named after company
   - Default ACLs left public
   - Temp/backup buckets forgotten

3. **Automation**: Write scripts to:
   - Enumerate buckets
   - Download all files
   - Search for credentials/secrets

### For Blue Team:

1. **Prevention**:
   - Block public bucket creation via AWS Organizations SCP
   - Use CloudFormation with secure defaults
   - Implement automated remediation (AWS Config rules)

2. **Detection**:
   - AWS GuardDuty for anomalous S3 access
   - CloudTrail monitoring
   - Macie for sensitive data discovery

3. **Response**:
   - Automated alerts on public buckets
   - Incident response playbooks
   - Communication templates for breaches

---

## 📊 Real-World Statistics

- **68%** of organizations have exposed S3 buckets (2023 study)
- **$4.45M** average cost of a data breach (IBM 2023)
- **280 days** average time to identify and contain a breach
- **80%** of breaches involve cloud misconfigurations

---

## 🔗 Additional Resources

- [AWS S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [OWASP Cloud Security Top 10](https://owasp.org/www-project-cloud-security/)
- [MinIO Security Documentation](https://min.io/docs/minio/linux/administration/identity-access-management.html)
- [HHS HIPAA Guidance on Cloud](https://www.hhs.gov/hipaa/for-professionals/special-topics/cloud-computing/index.html)

---

## ⚖️ Legal & Compliance

### HIPAA Requirements:

- ✅ **Required**: Encryption at rest and in transit
- ✅ **Required**: Access controls and audit logs
- ✅ **Required**: Business Associate Agreements with cloud providers
- ✅ **Required**: Data breach notification within 60 days

### Penalties for Non-Compliance:

- Tier 1: $100-$50,000 per violation
- Tier 4: $50,000+ per violation
- Maximum annual penalty: $1.5 million

---

**Remember**: This lab demonstrates REAL vulnerabilities found in production systems. Always secure cloud storage properly!
