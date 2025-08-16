#!/bin/bash

echo "🚀 WhatsApp Automation Platform - Quick Start"
echo "=============================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. You can edit it later if needed."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs uploads
echo "✅ Directories created"

# Start services with Docker Compose
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec api npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
docker-compose exec api npx prisma generate

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📱 Access your application:"
echo "   Frontend: http://localhost:3001"
echo "   API: http://localhost:3000"
echo "   API Docs: http://localhost:3000/api-docs"
echo "   Health Check: http://localhost:3000/health"
echo "   Redis Commander: http://localhost:8081"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Update services: docker-compose pull && docker-compose up -d"
echo ""
echo "🔧 To customize the setup:"
echo "   1. Edit .env file for configuration"
echo "   2. Modify docker-compose.yml for service settings"
echo "   3. Check README.md for detailed documentation"
echo ""
