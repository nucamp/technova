const Minio = require('minio');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

const BUCKET_NAME = 'patient-records';

const medicalRecords = {
  'record_1_patient001_20240115.txt': `==============================================
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
==============================================`,

  'record_3_patient002_20240120.txt': `==============================================
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
==============================================`,

  'record_6_patient005_20240205.txt': `==============================================
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
==============================================`,

  'record_10_patient009_20240222.txt': `==============================================
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
==============================================`,

  '.admin_credentials_backup.txt': `# TechNova Health - Admin Credentials Backup
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
  - dbadmin / password`
};

async function seedMinIO() {
  try {
    console.log('🌱 Seeding MinIO with medical records...');

    // Create bucket if it doesn't exist
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`✅ Created bucket: ${BUCKET_NAME}`);
    }

    // Check if already seeded
    try {
      await minioClient.statObject(BUCKET_NAME, 'record_1_patient001_20240115.txt');
      console.log('✅ MinIO already seeded, skipping...');
      return;
    } catch (err) {
      // File doesn't exist, proceed with seeding
    }

    // Upload medical records
    for (const [filename, content] of Object.entries(medicalRecords)) {
      const buffer = Buffer.from(content, 'utf-8');
      await minioClient.putObject(BUCKET_NAME, filename, buffer);
      console.log(`✅ Uploaded: ${filename}`);
    }

    // VULNERABILITY: Make bucket public
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
        }
      ]
    };

    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    console.log('⚠️  Set bucket policy to PUBLIC (VULNERABILITY!)');

    console.log('✅ MinIO seeding complete!');
    console.log('');
    console.log('📋 Test public access:');
    console.log(`   http://localhost:9000/${BUCKET_NAME}/record_1_patient001_20240115.txt`);
    console.log(`   http://localhost:9000/${BUCKET_NAME}/.admin_credentials_backup.txt`);
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding MinIO:', error.message);
    // Don't fail the server startup if MinIO seeding fails
  }
}

// Run seeding after a short delay to ensure MinIO is ready
setTimeout(() => {
  seedMinIO();
}, 5000);

module.exports = { seedMinIO };
