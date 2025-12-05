#!/bin/bash

# TechNova Health Lab Setup Script
# This script sets up and starts the vulnerable telehealth lab environment

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          TechNova Health - Cybersecurity Lab Setup         ║"
echo "║                 ⚠️  INTENTIONALLY VULNERABLE ⚠️              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed"
    echo "Please install Docker Compose"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Check if ports are available
echo "🔍 Checking if required ports are available..."
PORTS=(3000 3001 5432 6379 9000 9001 2222)
PORTS_IN_USE=()

for PORT in "${PORTS[@]}"; do
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 || ss -ltn 2>/dev/null | grep -q ":$PORT " ; then
        PORTS_IN_USE+=($PORT)
    fi
done

if [ ${#PORTS_IN_USE[@]} -gt 0 ]; then
    echo "⚠️  Warning: The following ports are already in use:"
    for PORT in "${PORTS_IN_USE[@]}"; do
        echo "   - Port $PORT"
    done
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled"
        exit 1
    fi
else
    echo "✅ All required ports are available"
fi
echo ""

# Clean up any existing containers
echo "🧹 Cleaning up any existing TechNova containers..."
docker-compose down -v 2>/dev/null || true
echo ""

# Build the containers
echo "🏗️  Building Docker containers (this may take 5-10 minutes)..."
docker-compose build
echo ""

# Start the services
echo "🚀 Starting TechNova Health Lab..."
docker-compose up -d
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 5

# Check service health
echo "🔍 Checking service health..."
echo ""

SERVICES=("technova-frontend:3000" "technova-backend:3001" "technova-db:5432" "technova-redis:6379" "technova-minio:9000")
ALL_HEALTHY=true

for SERVICE in "${SERVICES[@]}"; do
    IFS=':' read -r NAME PORT <<< "$SERVICE"
    if docker ps | grep -q "$NAME"; then
        echo "✅ $NAME is running"
    else
        echo "❌ $NAME is NOT running"
        ALL_HEALTHY=false
    fi
done

echo ""

if [ "$ALL_HEALTHY" = false ]; then
    echo "⚠️  Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi

# Display success message and access information
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    🎉 SETUP COMPLETE! 🎉                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Access Points:"
echo "   • Frontend:      http://localhost:3000"
echo "   • Backend API:   http://localhost:3001"
echo "   • MinIO Console: http://localhost:9001"
echo ""
echo "🔑 Quick Test Credentials:"
echo "   • Admin:   admin / admin123"
echo "   • Doctor:  dr.smith / doctor123"
echo "   • Patient: patient001 / password123"
echo ""
echo "💉 First Exploit (SQL Injection):"
echo "   Username: admin' OR '1'='1'--"
echo "   Password: anything"
echo ""
echo "📚 Documentation:"
echo "   • README.md - Complete guide"
echo "   • VULNERABILITIES.md - All vulnerabilities"
echo "   • QUICK_START.md - Quick reference"
echo "   • INSTRUCTOR_GUIDE.md - Teaching guide"
echo ""
echo "🛑 To stop the lab: docker-compose down"
echo "🔄 To restart:     docker-compose restart"
echo "📋 To view logs:   docker-compose logs -f"
echo ""
echo "⚠️  REMEMBER: This lab is INTENTIONALLY VULNERABLE!"
echo "   Never expose it to public networks!"
echo ""
