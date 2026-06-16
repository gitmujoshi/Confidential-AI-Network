#!/bin/bash

# Marketing Website Deployment Script
# Deploys the Confidential AI Network marketing website to Vercel

echo "🚀 Deploying Confidential AI Network marketing website to Vercel..."

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Please run this script from the marketing-website directory."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Error: Vercel CLI not found. Please install it with: npm i -g vercel"
    exit 1
fi

# Deploy to production
echo "📦 Deploying to production..."
vercel --prod --yes

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Your marketing website is now live at:"
    echo "   https://responsible-ai.dpi-apps.space"
    echo "   https://contractflow-pro-marketing-2pjje6tdf.vercel.app"
    echo ""
    echo "📊 View deployment details at:"
    echo "   https://vercel.com/joshimukesh078-gmailcoms-projects/confidential-ai-network-marketing"
    echo ""
    echo "🔧 To make changes:"
    echo "   1. Edit the files in this directory"
    echo "   2. Run this script again: ./deploy.sh"
    echo ""
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi 