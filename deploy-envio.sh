#!/bin/bash

# Deploy Envio Indexer to GitHub
# This script helps you push the indexer to GitHub for Envio deployment

echo "🚀 Deploying Envio Indexer to GitHub..."
echo "======================================="

# Check if we're in the right directory
if [ ! -f "envio-indexer/package.json" ]; then
    echo "❌ Error: Please run this script from the Artifice project root directory"
    exit 1
fi

cd envio-indexer

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial Envio indexer setup"
else
    echo "📦 Adding changes to Git..."
    git add .
    git commit -m "Update Envio indexer configuration"
fi

echo "✅ Git repository ready!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new GitHub repository:"
echo "   - Go to https://github.com/new"
echo "   - Repository name: polymarket-orders-indexer"
echo "   - Make it public or private (your choice)"
echo "   - Don't initialize with README (we already have one)"
echo ""
echo "2. Connect and push to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/polymarket-orders-indexer.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Deploy to Envio:"
echo "   - Go to https://app.envio.dev"
echo "   - Log in with GitHub"
echo "   - Add new indexer"
echo "   - Connect to your repository"
echo "   - Configure with:"
echo "     - Config file: config.yaml"
echo "     - Root directory: ."
echo "     - Branch: main"
echo "     - API Token: 6f20c5c4-0f67-4713-9bd4-4d56760b8122"
echo ""
echo "🎉 Once deployed, your live orders will update automatically!"
echo "   No more manual script management needed!"

# Show current git status
echo ""
echo "📊 Current Git status:"
git status --short
