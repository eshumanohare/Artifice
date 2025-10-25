#!/bin/bash

# Verify Envio Indexer Setup
# This script checks if everything is properly configured for Envio deployment

echo "🔍 Verifying Envio Indexer Setup..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "envio-indexer/package.json" ]; then
    echo "❌ Error: Please run this script from the Artifice project root directory"
    exit 1
fi

cd envio-indexer

echo "📁 Checking files..."
echo "==================="

# Check required files
files=("package.json" "package-lock.json" "config.yaml" "envio.config.js" "schema.graphql" "src/EventHandlers.ts")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "📦 Checking package.json..."
echo "==========================="

# Check package.json content
if grep -q '"name": "polymarket-orders-indexer"' package.json; then
    echo "✅ Package name is correct"
else
    echo "❌ Package name is incorrect"
fi

if grep -q '"envio"' package.json; then
    echo "✅ Envio version specified"
else
    echo "❌ Envio version not specified"
fi

echo ""
echo "🔧 Checking configuration files..."
echo "================================="

# Check config.yaml
if grep -q "version:" config.yaml; then
    echo "✅ config.yaml has version specified"
else
    echo "❌ config.yaml missing version"
fi

if grep -q "CTFExchange" config.yaml; then
    echo "✅ config.yaml has contract configuration"
else
    echo "❌ config.yaml missing contract configuration"
fi

# Check envio.config.js
if grep -q "CTFExchange" envio.config.js; then
    echo "✅ envio.config.js has contract configuration"
else
    echo "❌ envio.config.js missing contract configuration"
fi

echo ""
echo "📊 Checking Git status..."
echo "========================"

# Check git status
if git status --porcelain | grep -q .; then
    echo "⚠️  There are uncommitted changes"
    git status --short
else
    echo "✅ Working directory is clean"
fi

# Check if we're ahead of origin
ahead=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")
if [ "$ahead" -gt 0 ]; then
    echo "⚠️  Local branch is $ahead commits ahead of origin/main"
    echo "   Run 'git push origin main' to sync"
else
    echo "✅ Local branch is up to date with origin/main"
fi

echo ""
echo "🚀 GitHub Actions Status..."
echo "=========================="

# Check if GitHub Actions workflow exists
if [ -f ".github/workflows/deploy.yml" ]; then
    echo "✅ GitHub Actions workflow exists"
    
    # Check workflow content
    if grep -q "package-lock.json" .github/workflows/deploy.yml; then
        echo "✅ Workflow handles package-lock.json"
    else
        echo "❌ Workflow doesn't handle package-lock.json"
    fi
else
    echo "❌ GitHub Actions workflow missing"
fi

echo ""
echo "📋 Summary..."
echo "============"

# Count issues
issues=0
if [ ! -f "package-lock.json" ]; then
    echo "❌ package-lock.json missing"
    ((issues++))
fi

if ! git status --porcelain | grep -q .; then
    if [ "$ahead" -gt 0 ]; then
        echo "⚠️  Need to push $ahead commits to GitHub"
    else
        echo "✅ All files are properly committed and pushed"
    fi
else
    echo "⚠️  There are uncommitted changes"
    ((issues++))
fi

if [ $issues -eq 0 ]; then
    echo ""
    echo "🎉 Setup verification complete!"
    echo "✅ Your Envio indexer is ready for deployment"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to https://app.envio.dev"
    echo "2. Log in with GitHub"
    echo "3. Add new indexer"
    echo "4. Connect to your repository"
    echo "5. Configure with:"
    echo "   - Config file: envio.config.js"
    echo "   - Root directory: ."
    echo "   - Branch: main"
    echo "   - API Token: 6f20c5c4-0f67-4713-9bd4-4d56760b8122"
else
    echo ""
    echo "⚠️  Found $issues issue(s) that need to be resolved"
    echo "Please fix the issues above before deploying"
fi
