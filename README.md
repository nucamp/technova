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

### MinIO image availability

The official `minio/minio` Docker Hub repository is unavailable. This lab uses
[Net Insight's preserved MinIO image](https://hub.docker.com/r/netiedge/minio),
release `RELEASE.2025-01-20T14-49-07Z`, pinned to its multi-platform image digest.
The mirror provides Linux AMD64 and ARM64 images and retains the MinIO console,
S3 API, and bucket policies used by the exercises. It is a third-party mirror
of a historical release; [upstream MinIO](https://github.com/minio/minio) is no
longer maintained.

After updating an existing checkout, pull the replacement and recreate MinIO:

```bash
docker compose pull minio
docker compose up -d minio
docker compose restart backend
```

The backend restart reruns automatic record seeding if its earlier startup
could not reach MinIO. Verify the console at `http://localhost:9001` using
`minioadmin` / `minioadmin`, and the public sample record at
`http://localhost:9000/patient-records/record_1_patient001_20240115.txt`.

Keep the `minio-data` volume. If it was written by a newer MinIO release, back it
up before switching to this older release; compatibility with newer on-disk
formats has not been verified. For reliable classroom distribution, preserve
the pinned image in an instructor-controlled registry as well.
