#!/bin/bash

echo "🚀 Artifice Dashboard - Deployment Script"
echo "========================================"

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

# Function to check if we're in a git repository
check_git_repo() {
    if [ ! -d ".git" ]; then
        echo -e "${RED}❌ Not in a git repository${NC}"
        echo "Please initialize git and commit your code first:"
        echo "  git init"
        echo "  git add ."
        echo "  git commit -m 'Initial commit'"
        exit 1
    fi
}

# Function to check if all files are committed
check_git_status() {
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
        echo "Please commit your changes first:"
        echo "  git add ."
        echo "  git commit -m 'Deploy to production'"
        exit 1
    fi
}

# Function to test Docker build
test_docker_build() {
    echo -e "${BLUE}🔨 Testing Docker build...${NC}"
    
    if ! command_exists docker; then
        echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    echo "Building Docker image..."
    if docker build -t artifice-dashboard .; then
        echo -e "${GREEN}✅ Docker build successful${NC}"
    else
        echo -e "${RED}❌ Docker build failed${NC}"
        exit 1
    fi
}

# Function to test local deployment
test_local_deployment() {
    echo -e "${BLUE}🧪 Testing local deployment...${NC}"
    
    echo "Starting Docker container..."
    CONTAINER_ID=$(docker run -d -p 3000:3000 artifice-dashboard)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Container started with ID: $CONTAINER_ID${NC}"
        echo "Waiting for application to start..."
        sleep 30
        
        # Test health endpoint
        if curl -f http://localhost:3000/api/orders >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Application is responding${NC}"
        else
            echo -e "${YELLOW}⚠️  Application may not be fully ready yet${NC}"
        fi
        
        echo "Dashboard should be available at: http://localhost:3000"
        echo "Press Ctrl+C to stop the test"
        
        # Wait for user to stop
        trap "echo 'Stopping container...'; docker stop $CONTAINER_ID; docker rm $CONTAINER_ID; exit 0" INT
        wait
    else
        echo -e "${RED}❌ Failed to start container${NC}"
        exit 1
    fi
}

# Function to show deployment options
show_deployment_options() {
    echo -e "${BLUE}🎯 Deployment Options:${NC}"
    echo ""
    echo "1. Railway (Recommended - Free tier available)"
    echo "   - Go to https://railway.app"
    echo "   - Sign in with GitHub"
    echo "   - Create new project"
    echo "   - Connect your repository"
    echo "   - Deploy automatically"
    echo ""
    echo "2. Render (Alternative)"
    echo "   - Go to https://render.com"
    echo "   - Create new Web Service"
    echo "   - Connect GitHub repository"
    echo "   - Use Docker deployment"
    echo ""
    echo "3. Vercel (Frontend only - requires separate backend)"
    echo "   - Go to https://vercel.com"
    echo "   - Import GitHub repository"
    echo "   - Deploy (Note: Python streams won't work)"
    echo ""
    echo "4. Local Docker deployment"
    echo "   - Run: docker-compose up --build"
    echo "   - Access at http://localhost:3000"
}

# Function to show Railway deployment steps
show_railway_steps() {
    echo -e "${BLUE}🚀 Railway Deployment Steps:${NC}"
    echo ""
    echo "1. Go to https://railway.app"
    echo "2. Sign in with your GitHub account"
    echo "3. Click 'New Project'"
    echo "4. Select 'Deploy from GitHub repo'"
    echo "5. Choose your Artifice repository"
    echo "6. Railway will automatically:"
    echo "   - Detect the Dockerfile"
    echo "   - Build the application"
    echo "   - Deploy to a public URL"
    echo "7. Your app will be live at: https://your-app-name.up.railway.app"
    echo ""
    echo -e "${GREEN}✅ That's it! Your dashboard will be live and accessible worldwide.${NC}"
}

# Main script logic
case "${1:-help}" in
    "test")
        echo -e "${BLUE}🧪 Testing deployment locally...${NC}"
        check_git_repo
        test_docker_build
        test_local_deployment
        ;;
        
    "build")
        echo -e "${BLUE}🔨 Building Docker image...${NC}"
        test_docker_build
        echo -e "${GREEN}✅ Build complete!${NC}"
        ;;
        
    "deploy")
        echo -e "${BLUE}🚀 Preparing for deployment...${NC}"
        check_git_repo
        check_git_status
        test_docker_build
        echo -e "${GREEN}✅ Ready for deployment!${NC}"
        echo ""
        show_railway_steps
        ;;
        
    "railway")
        show_railway_steps
        ;;
        
    "options")
        show_deployment_options
        ;;
        
    "help"|"-h"|"--help")
        echo "Artifice Dashboard Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  test      Test deployment locally with Docker"
        echo "  build     Build Docker image"
        echo "  deploy    Prepare for deployment (check git, build)"
        echo "  railway   Show Railway deployment steps"
        echo "  options   Show all deployment options"
        echo "  help      Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 test        # Test locally with Docker"
        echo "  $0 deploy      # Prepare for Railway deployment"
        echo "  $0 railway     # Show Railway steps"
        ;;
        
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
