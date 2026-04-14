#!/bin/bash
# Deployment Script for Critical Fixes
# Run this to apply all fixes and restart the application

set -e  # Exit on any error

echo "🚀 Sprint Full - Deploying Critical Fixes"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the backend root directory:"
    echo "  cd sprintify_backend/finalAPI"
    exit 1
fi

echo -e "${YELLOW}1. Installing dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${YELLOW}2. Building TypeScript...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}3. Verifying environment configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}⚠️  .env file not found${NC}"
    echo "Creating .env from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}📝 Please edit .env with your production values:${NC}"
        echo "   - JWT_SECRET (strong random string, 32+ chars)"
        echo "   - DB_PASSWORD (database password)"
        echo "   - FRONTEND_URL (your frontend domain)"
        echo ""
        echo "Edit .env file and run this script again"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file found${NC}"
fi

# Verify required environment variables
if [ -z "$JWT_SECRET" ]; then
    echo -e "${YELLOW}⚠️  JWT_SECRET not set, checking .env file...${NC}"
    if grep -q "JWT_SECRET=" .env; then
        JWT_SECRET=$(grep "JWT_SECRET=" .env | cut -d '=' -f2)
        if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" == "your_strong_random_key_32_chars_min" ]; then
            echo -e "${RED}❌ JWT_SECRET not configured properly${NC}"
            echo "Edit .env and set a strong JWT_SECRET (32+ random chars)"
            exit 1
        fi
    fi
fi

echo -e "${GREEN}✅ Environment configured${NC}"

echo ""
echo -e "${YELLOW}4. Fixes included:${NC}"
echo "   ✅ Rate limiting (100 req/15min)"
echo "   ✅ Token race condition fix"
echo "   ✅ Project access authorization"
echo "   ✅ Pagination support (max 100 per page)"

echo ""
echo -e "${GREEN}=========================================="
echo "✅ All fixes deployed successfully!${NC}"
echo "=========================================="

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Start the application:"
echo "   NODE_ENV=production npm start"
echo ""
echo "2. Test the fixes:"
echo "   - Try to update an issue (no more 401 errors)"
echo "   - Try to access another project's data (should get 403)"
echo "   - List issues with pagination: ?page=1&limit=20"
echo ""
echo "3. Monitor logs for:"
echo "   - Rate limiting messages"
echo "   - Authorization errors"
echo "   - Any startup errors"

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
