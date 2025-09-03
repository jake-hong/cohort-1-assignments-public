#!/bin/sh

set -e

# Install Node.js and git for extract-addresses.js
echo "📦 Installing Node.js and git..."
apt update && apt install -y nodejs npm

echo "🚀 Starting smart contract deployment..."

# Wait for geth-init to complete prefunding
echo "⏳ Waiting for geth-init to complete prefunding..."
until [ -f "/geth-init/geth-init-complete" ]; do
  echo "Waiting for geth-init-complete file..."
  sleep 1
done
echo "✅ Prefunding completed, proceeding with deployment..."

# Clean up and clone repository fresh
echo "🧹 Cleaning up previous repository..."
rm -rf /workspace/cohort-1-assignments-public

cd /workspace

echo "📥 Cloning repository..."
git clone --depth 1 --recurse-submodules=no https://github.com/jake-hong/cohort-1-assignments-public.git
cd cohort-1-assignments-public

# Clone submodules manually to avoid .gitmodules issues
echo "📦 Cloning submodules manually..."
cd 1a
rm -rf lib/forge-std lib/openzeppelin-contracts
git clone --depth 1 https://github.com/foundry-rs/forge-std.git lib/forge-std
git clone --depth 1 https://github.com/OpenZeppelin/openzeppelin-contracts.git lib/openzeppelin-contracts

# Install dependencies
echo "📦 Dependencies already cloned, skipping forge install..."

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
cd /workspace
node extract-addresses.js

echo "✅ All done! Check deployment.json for contract addresses."
