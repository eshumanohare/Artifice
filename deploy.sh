#!/bin/bash

# Simple deployment script for Artifice Dashboard
# Supports multiple deployment platforms

echo "🚀 Artifice Dashboard Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to deploy to Vercel
deploy_vercel() {
    echo -e "${BLUE}📦 Deploying to Vercel...${NC}"
    
    if ! command_exists vercel; then
        echo -e "${YELLOW}Installing Vercel CLI...${NC}"
        npm install -g vercel
    fi
    
    # Build the project
    echo -e "${BLUE}Building project...${NC}"
    npm run build
    
    # Deploy
    vercel --prod
    
    echo -e "${GREEN}✅ Deployed to Vercel!${NC}"
    echo -e "${YELLOW}⚠️  Note: Python scripts won't work on Vercel. Use local development or different platform.${NC}"
}

# Function to deploy to Netlify
deploy_netlify() {
    echo -e "${BLUE}📦 Deploying to Netlify...${NC}"
    
    if ! command_exists netlify; then
        echo -e "${YELLOW}Installing Netlify CLI...${NC}"
        npm install -g netlify-cli
    fi
    
    # Build the project
    echo -e "${BLUE}Building project...${NC}"
    npm run build
    
    # Deploy
    netlify deploy --prod --dir=.next
    
    echo -e "${GREEN}✅ Deployed to Netlify!${NC}"
    echo -e "${YELLOW}⚠️  Note: Background functions need manual setup in Netlify dashboard.${NC}"
}

# Function to deploy to Railway
deploy_railway() {
    echo -e "${BLUE}📦 Deploying to Railway...${NC}"
    
    if ! command_exists railway; then
        echo -e "${YELLOW}Installing Railway CLI...${NC}"
        curl -fsSL https://railway.app/install.sh | sh
    fi
    
    # Login and deploy
    railway login
    railway up
    
    echo -e "${GREEN}✅ Deployed to Railway!${NC}"
    echo -e "${YELLOW}⚠️  Note: You'll need to add a worker service for Python scripts.${NC}"
}

# Function to deploy to Render
deploy_render() {
    echo -e "${BLUE}📦 Deploying to Render...${NC}"
    
    echo -e "${YELLOW}Render deployment requires manual setup:${NC}"
    echo "1. Go to https://render.com"
    echo "2. Connect your GitHub repository"
    echo "3. Create two services:"
    echo "   - Web Service: Use Node.js, build command: npm install && npm run build"
    echo "   - Background Worker: Use Python, build command: pip install -r requirements.txt"
    echo "4. The render.yaml file is already configured for this setup"
    
    echo -e "${GREEN}✅ Configuration ready for Render!${NC}"
}

# Function to show local development setup
local_dev() {
    echo -e "${BLUE}🏠 Setting up local development...${NC}"
    
    # Install dependencies
    echo -e "${BLUE}Installing Node.js dependencies...${NC}"
    npm install
    
    echo -e "${BLUE}Installing Python dependencies...${NC}"
    if [ -f "env/bin/activate" ]; then
        source env/bin/activate && pip install -r requirements.txt
    else
        echo -e "${YELLOW}Creating virtual environment...${NC}"
        python3 -m venv env
        source env/bin/activate && pip install -r requirements.txt
    fi
    
    # Create cache directory
    mkdir -p .cache
    
    echo -e "${GREEN}✅ Local development setup complete!${NC}"
    echo ""
    echo -e "${YELLOW}To start development:${NC}"
    echo "1. Terminal 1: npm run dev (for Next.js)"
    echo "2. Terminal 2: source env/bin/activate && python3 scripts/stream_orders.py (for data streaming)"
    echo "3. Visit http://localhost:3000"
    echo ""
    echo -e "${YELLOW}Or use the start script:${NC}"
    echo "./scripts/start_all_streams.sh"
}

# Main script logic
case "${1:-help}" in
    "vercel")
        deploy_vercel
        ;;
    "netlify")
        deploy_netlify
        ;;
    "railway")
        deploy_railway
        ;;
    "render")
        deploy_render
        ;;
    "local"|"dev")
        local_dev
        ;;
    "help"|"-h"|"--help")
        echo "Artifice Dashboard Deployment Options"
        echo ""
        echo "Usage: $0 [platform]"
        echo ""
        echo "Platforms:"
        echo "  local     Setup local development environment"
        echo "  vercel    Deploy to Vercel (Python scripts won't work)"
        echo "  netlify   Deploy to Netlify (requires manual background function setup)"
        echo "  railway   Deploy to Railway (supports both web and worker services)"
        echo "  render    Deploy to Render (supports both web and worker services)"
        echo "  help      Show this help message"
        echo ""
        echo "Recommended for your use case:"
        echo "  $0 local     # For development"
        echo "  $0 render    # For production (best support for Python + Node.js)"
        ;;
    *)
        echo -e "${RED}❌ Unknown platform: $1${NC}"
        echo "Run '$0 help' for available options"
        exit 1
        ;;
esac
