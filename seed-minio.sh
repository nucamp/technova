#!/bin/bash

# Script to seed MinIO with fake medical records
# Demonstrates insecure S3 bucket permissions

echo "======================================================"
echo "  Seeding MinIO with Fake Medical Records"
echo "======================================================"
echo ""

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
sleep 5

# Install MinIO client if not present
if ! docker exec technova-backend which mc > /dev/null 2>&1; then
    echo "📦 Installing MinIO client in backend container..."
    docker exec technova-backend wget -q https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc
    docker exec technova-backend chmod +x /usr/local/bin/mc
fi

# Configure MinIO client
echo "🔧 Configuring MinIO client..."
docker exec technova-backend mc alias set minio http://minio:9000 minioadmin minioadmin > /dev/null 2>&1

# Create bucket if it doesn't exist
echo "🪣 Creating patient-records bucket..."
docker exec technova-backend mc mb minio/patient-records 2>/dev/null || echo "   Bucket already exists"

# VULNERABILITY: Make bucket publicly readable!
echo "⚠️  Setting bucket to PUBLIC (VULNERABILITY!)..."
docker exec technova-backend mc anonymous set download minio/patient-records

# Create fake medical record files
echo "📄 Creating fake medical record files..."

# Patient 1 - Alice Anderson
docker exec technova-backend bash -c 'cat > /tmp/patient001_20240115.txt << EOF
==============================================
        TECHNOVA HEALTH MEDICAL RECORD
==============================================

PATIENT INFORMATION:
Name: Alice Anderson
DOB: 03/15/1985
MRN: MR-001-2024
SSN: 123-45-6789

VISIT DATE: January 15, 2024
PROVIDER: Dr. John Smith, MD

CHIEF COMPLAINT:
Patient presents with elevated blood pressure readings at home.

VITAL SIGNS:
BP: 152/94 mmHg
Pulse: 78 bpm
Temp: 98.6°F
Resp: 16/min

ASSESSMENT:
Stage 2 Hypertension

DIAGNOSIS:
ICD-10: I10 - Essential (primary) hypertension

TREATMENT PLAN:
1. Started on Lisinopril 10mg PO daily
2. Dietary modifications - DASH diet
3. Reduce sodium intake to <2000mg/day
4. Regular exercise 30min/day
5. Follow-up in 4 weeks

MEDICATIONS PRESCRIBED:
- Lisinopril 10mg, 1 tablet daily

PHYSICIAN SIGNATURE:
Dr. John Smith, MD
License: MD-12345
Date: 01/15/2024

CONFIDENTIAL - HIPAA PROTECTED
==============================================
EOF'

# Patient 2 - Bob Baker (Diabetes)
docker exec technova-backend bash -c 'cat > /tmp/patient002_20240120.txt << EOF
==============================================
        TECHNOVA HEALTH MEDICAL RECORD
==============================================

PATIENT INFORMATION:
Name: Bob Baker
DOB: 07/22/1990
MRN: MR-002-2024
SSN: 234-56-7890

VISIT DATE: January 20, 2024
PROVIDER: Dr. Emily Johnson, MD

CHIEF COMPLAINT:
Elevated HbA1c on routine screening.

LABORATORY RESULTS:
HbA1c: 7.8% (Normal: <5.7%)
Fasting Glucose: 142 mg/dL
Total Cholesterol: 215 mg/dL
LDL: 135 mg/dL
HDL: 42 mg/dL

ASSESSMENT:
Type 2 Diabetes Mellitus, newly diagnosed

DIAGNOSIS:
ICD-10: E11.9 - Type 2 diabetes mellitus without complications

TREATMENT PLAN:
1. Started Metformin 500mg PO BID
2. Diabetes education referral
3. Dietary consultation - carbohydrate counting
4. Home glucose monitoring kit provided
5. Target HbA1c <7.0%

MEDICATIONS PRESCRIBED:
- Metformin 500mg, 2 times daily with meals
- Glucose meter and test strips

LIFESTYLE MODIFICATIONS:
- Weight loss goal: 10% body weight
- Exercise: 150 min/week moderate activity
- Limit refined carbohydrates

FOLLOW-UP:
Recheck HbA1c in 3 months

PHYSICIAN SIGNATURE:
Dr. Emily Johnson, MD
License: MD-23456
Date: 01/20/2024

CONFIDENTIAL - HIPAA PROTECTED
==============================================
EOF'

# Patient 5 - Eve Evans (Anxiety)
docker exec technova-backend bash -c 'cat > /tmp/patient005_20240205.txt << EOF
==============================================
        TECHNOVA HEALTH MEDICAL RECORD
==============================================

PATIENT INFORMATION:
Name: Eve Evans
DOB: 09/05/1982
MRN: MR-005-2024
SSN: 567-89-0123

VISIT DATE: February 5, 2024
PROVIDER: Dr. Emily Johnson, MD

CHIEF COMPLAINT:
Increased anxiety, difficulty sleeping, racing thoughts.

MENTAL STATUS EXAM:
Appearance: Well-groomed, appropriate
Mood: Anxious
Affect: Congruent with mood
Thought Process: Linear, goal-directed
Thought Content: Preoccupied with work stressors
   No suicidal/homicidal ideation
Insight/Judgment: Good

ASSESSMENT:
Generalized Anxiety Disorder

DIAGNOSIS:
ICD-10: F41.1 - Generalized anxiety disorder

GAD-7 SCORE: 15 (Moderate-Severe Anxiety)

TREATMENT PLAN:
1. Started Sertraline 50mg PO daily
2. Cognitive Behavioral Therapy referral
3. Sleep hygiene education
4. Stress management techniques
5. Follow-up in 2 weeks

MEDICATIONS PRESCRIBED:
- Sertraline (Zoloft) 50mg, 1 tablet daily in AM
- May cause nausea initially - take with food

COUNSELING:
- Discussed typical 4-6 week onset of action
- Importance of medication compliance
- Warning signs requiring immediate attention

FOLLOW-UP:
2 weeks for medication tolerance
4 weeks for efficacy assessment

PHYSICIAN SIGNATURE:
Dr. Emily Johnson, MD
License: MD-23456
Date: 02/05/2024

CONFIDENTIAL - HIPAA PROTECTED
MENTAL HEALTH SENSITIVE INFORMATION
==============================================
EOF'

# Patient 9 - Iris Ibrahim (Asthma)
docker exec technova-backend bash -c 'cat > /tmp/patient009_20240222.txt << EOF
==============================================
        TECHNOVA HEALTH MEDICAL RECORD
==============================================

PATIENT INFORMATION:
Name: Iris Ibrahim
DOB: 06/17/1987
MRN: MR-009-2024
SSN: 901-23-4567

VISIT DATE: February 22, 2024
PROVIDER: Dr. Emily Johnson, MD

CHIEF COMPLAINT:
Shortness of breath, wheezing, exercise intolerance.

PULMONARY FUNCTION TEST:
FEV1: 72% predicted
FVC: 85% predicted
FEV1/FVC: 0.68

ASSESSMENT:
Mild Persistent Asthma

DIAGNOSIS:
ICD-10: J45.30 - Mild persistent asthma, uncomplicated

TREATMENT PLAN:
1. Albuterol HFA inhaler - rescue medication
2. Fluticasone 110mcg - controller medication
3. Peak flow monitoring
4. Asthma action plan provided
5. Avoid triggers (smoke, cold air, exercise-induced)

MEDICATIONS PRESCRIBED:
- Albuterol 90mcg HFA: 2 puffs Q4-6H PRN wheezing
- Fluticasone 110mcg HFA: 2 puffs BID

PATIENT EDUCATION:
- Proper inhaler technique demonstrated
- Peak flow diary instructed
- When to seek emergency care
- Environmental control measures

FOLLOW-UP:
4-6 weeks or sooner if symptoms worsen

PHYSICIAN SIGNATURE:
Dr. Emily Johnson, MD
License: MD-23456
Date: 02/22/2024

CONFIDENTIAL - HIPAA PROTECTED
==============================================
EOF'

# Lab Results for Patient 1
docker exec technova-backend bash -c 'cat > /tmp/patient001_labs_20240215.txt << EOF
==============================================
        TECHNOVA HEALTH - LABORATORY RESULTS
==============================================

PATIENT: Anderson, Alice
DOB: 03/15/1985
MRN: MR-001-2024

COLLECTION DATE: February 15, 2024
REPORTED: February 15, 2024 14:32

ORDERED BY: Dr. John Smith, MD

TEST RESULTS - COMPREHENSIVE METABOLIC PANEL:

Glucose: 94 mg/dL          [Normal: 70-100]
BUN: 16 mg/dL              [Normal: 7-20]
Creatinine: 0.9 mg/dL      [Normal: 0.6-1.2]
eGFR: >60                  [Normal: >60]
Sodium: 140 mEq/L          [Normal: 136-145]
Potassium: 4.2 mEq/L       [Normal: 3.5-5.0]
Chloride: 102 mEq/L        [Normal: 98-107]
CO2: 24 mEq/L              [Normal: 23-29]
Calcium: 9.5 mg/dL         [Normal: 8.5-10.5]

LIPID PANEL:
Total Cholesterol: 198 mg/dL [Desirable: <200]
LDL: 122 mg/dL              [Optimal: <100]
HDL: 58 mg/dL               [Good: >40]
Triglycerides: 145 mg/dL    [Normal: <150]

All values reviewed and within acceptable ranges.
Continue current medications.

Electronically signed by:
TechNova Laboratory Services
Lab Director: Dr. Sarah Chen, MD, PhD
Date: 02/15/2024

CONFIDENTIAL LABORATORY RESULTS
==============================================
EOF'

echo "📤 Uploading files to MinIO..."

# Upload files with VULNERABILITY - no access control!
docker exec technova-backend mc cp /tmp/patient001_20240115.txt minio/patient-records/record_1_patient001_20240115.txt
docker exec technova-backend mc cp /tmp/patient002_20240120.txt minio/patient-records/record_3_patient002_20240120.txt
docker exec technova-backend mc cp /tmp/patient005_20240205.txt minio/patient-records/record_6_patient005_20240205.txt
docker exec technova-backend mc cp /tmp/patient009_20240222.txt minio/patient-records/record_10_patient009_20240222.txt
docker exec technova-backend mc cp /tmp/patient001_labs_20240215.txt minio/patient-records/labs_patient001_20240215.txt

# Create an "accidentally exposed" admin credentials file (VULNERABILITY!)
docker exec technova-backend bash -c 'cat > /tmp/admin_credentials_backup.txt << EOF
# TechNova Health - Admin Credentials Backup
# DO NOT SHARE - CONFIDENTIAL

Database:
  Host: postgres
  Port: 5432
  Database: technova_health
  Username: technova_admin
  Password: TechN0va2024!

MinIO:
  Endpoint: minio:9000
  Access Key: minioadmin
  Secret Key: minioadmin

Redis:
  Host: redis
  Port: 6379
  Password: redis123

JWT Secret: super_secret_key_123

Root SSH Password: technova123

Admin Accounts:
  - admin / admin123
  - dbadmin / password
EOF'

docker exec technova-backend mc cp /tmp/admin_credentials_backup.txt minio/patient-records/.admin_credentials_backup.txt

echo ""
echo "✅ Files uploaded successfully!"
echo ""
echo "📋 Uploaded Files:"
docker exec technova-backend mc ls minio/patient-records/

echo ""
echo "⚠️  SECURITY VULNERABILITIES DEMONSTRATED:"
echo "   1. Bucket is PUBLIC - anyone can download files!"
echo "   2. No authentication required for file access"
echo "   3. Sensitive credentials stored in S3"
echo "   4. Medical records accessible via direct URL"
echo "   5. No encryption at rest"
echo ""
echo "🔗 Test Public Access:"
echo "   http://localhost:9000/patient-records/record_1_patient001_20240115.txt"
echo "   http://localhost:9000/patient-records/.admin_credentials_backup.txt"
echo ""
echo "🔓 MinIO Console (to see all files):"
echo "   URL: http://localhost:9001"
echo "   Username: minioadmin"
echo "   Password: minioadmin"
echo ""
echo "======================================================"
