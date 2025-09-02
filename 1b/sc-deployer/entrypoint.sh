#!/bin/sh

set -e

echo "🚀 Starting smart contract deployment..."

# Wait for geth-init to complete prefunding
echo "⏳ Waiting for geth-init to complete prefunding..."
until [ -f "/shared/geth-init-complete" ]; do
  echo "Waiting for geth-init-complete file..."
  sleep 1
done
echo "✅ Prefunding completed, proceeding with deployment..."

# Clean up and clone repository fresh
echo "🧹 Cleaning up previous repository..."
rm -rf cohort-1-assignments-public

echo "📥 Cloning repository..."
git clone https://github.com/jake-hong/cohort-1-assignments-public.git
cd cohort-1-assignments-public

# Install sudo and Node.js
# echo "📦 Installing sudo..."
# apt update && apt install -y sudo
# echo "📦 Installing Node.js..."
# sudo apt install -y nodejs npm

# Navigate to the 1a directory
cd 1a

# Install dependencies
echo "📦 Installing dependencies..."
forge install

# Build the project
echo "🔨 Building project..."
forge build

# Deploy the contracts
echo "🚀 Deploying MiniAMM contracts..."
forge script script/MiniAMM.s.sol:MiniAMMScript \
    --rpc-url http://geth:8545 \
    --private-key fc489391454507cf1daf3ab78bb9ddfb2bc817e65ab7aae5b60848a577233b8a \
    --broadcast

echo "✅ Deployment completed!"
echo ""
echo "📊 Contract addresses should be available in the broadcast logs above."

# Extract contract addresses to deployment.json
echo "📝 Extracting contract addresses..."
# cd /workspace
# node extract-addresses.js

echo "✅ All done! Check deployment.json for contract addresses."
