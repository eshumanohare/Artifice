#!/bin/bash

# Setup script for Envio indexer deployment
# This script helps you prepare the indexer for deployment

echo "🚀 Setting up Envio indexer for deployment..."
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "envio-indexer/package.json" ]; then
    echo "❌ Error: Please run this script from the Artifice project root directory"
    exit 1
fi

cd envio-indexer

echo "📦 Installing dependencies..."
npm install

echo "🔧 Building the project..."
npm run build

echo "✅ Project built successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new GitHub repository for your indexer"
echo "2. Push this code to GitHub:"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Initial Envio indexer setup'"
echo "   git remote add origin https://github.com/yourusername/polymarket-orders-indexer.git"
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
echo "4. Update your frontend environment variables:"
echo "   NEXT_PUBLIC_ENVIO_ENDPOINT=https://your-envio-endpoint.com/graphql"
echo "   NEXT_PUBLIC_ENVIO_API_TOKEN=6f20c5c4-0f67-4713-9bd4-4d56760b8122"
echo ""
echo "🎉 Once deployed, your live orders will update automatically!"
echo "   No more manual script management needed!"
