#!/bin/bash

echo "🎓 EduManage SA - Complete Setup Script"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${BLUE}Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js v18 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed. Please install PostgreSQL 14 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL found${NC}"
echo ""

# Backend setup
echo -e "${BLUE}Setting up backend...${NC}"
cd backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file. Please update with your configuration.${NC}"
fi

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Create database and run migrations
echo ""
read -p "Do you want to create the database and run migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running database migrations..."
    npx prisma migrate dev --name init
    
    echo ""
    read -p "Do you want to seed the database with demo data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Seeding database..."
        npm run prisma:seed
    fi
fi

cd ..

# Frontend setup
echo ""
echo -e "${BLUE}Setting up frontend...${NC}"
cd frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo "Creating frontend .env file..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
    echo -e "${GREEN}✓ Created frontend .env file${NC}"
fi

cd ..

# Setup complete
echo ""
echo -e "${GREEN}========================================"
echo "✅ Setup complete!"
echo "========================================${NC}"
echo ""
echo "To start the application:"
echo ""
echo "Backend (Terminal 1):"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Frontend (Terminal 2):"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "Or use Docker:"
echo "  docker-compose up -d"
echo ""
echo "Access the application:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5000"
echo "  Prisma Studio: npm run prisma:studio (in backend folder)"
echo ""
echo -e "${BLUE}Default login credentials are in the README.md file${NC}"
echo ""
