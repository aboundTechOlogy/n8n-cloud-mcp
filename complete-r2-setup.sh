#!/bin/bash
# Complete Fix and R2 Integration Script

echo "🚀 Complete n8n-cloud-mcp R2 Integration & Fix Script"
echo "======================================================="

cd ~/n8n-cloud-mcp-cursor || { echo "❌ Directory not found"; exit 1; }

# Fix nested git repository if exists
if [ -d "n8n-cloud-mcp" ]; then
    echo "🔧 Removing nested git repository..."
    git rm --cached n8n-cloud-mcp 2>/dev/null
    rm -rf n8n-cloud-mcp
fi

# Check if R2 integration already exists
if [ ! -f "src/lib/r2-loader.ts" ]; then
    echo "📝 Creating R2 integration files..."
    
    # Create the r2-loader.ts file
    mkdir -p src/lib
    curl -s https://raw.githubusercontent.com/aboundTechOlogy/n8n-cloud-mcp/main/src/lib/r2-loader.ts > src/lib/r2-loader.ts 2>/dev/null || echo "Need to create r2-loader.ts manually"
    
    # Create search_nodes.ts
    mkdir -p src/tools
    curl -s https://raw.githubusercontent.com/aboundTechOlogy/n8n-cloud-mcp/main/src/tools/search_nodes.ts > src/tools/search_nodes.ts 2>/dev/null || echo "Need to create search_nodes.ts manually"
    
    echo "✅ R2 integration files created"
fi

# Update index.ts
if ! grep -q "import searchNodes" src/index.ts; then
    echo "📝 Updating index.ts..."
    sed -i "/import deleteWorkflow/a import searchNodes from './tools/search_nodes';" src/index.ts
    sed -i "/'workflow.delete': deleteWorkflow,/a \ \ 'search_nodes': searchNodes," src/index.ts
fi

# Update versions
sed -i "s/toolsImplemented: 8/toolsImplemented: 9/g" src/index.ts
sed -i "s/progress: '8.6%'/progress: '9.7%'/g" src/index.ts
sed -i "s/version: '0.8.0'/version: '0.9.0'/g" src/index.ts
sed -i 's/"version": "0.8.0"/"version": "0.9.0"/' package.json

# Fix build script
sed -i 's/"build": "esbuild src\/index.ts --bundle --platform=neutral --format=esm --minify --outfile=dist\/bundle.js"/"build": "esbuild src\/index.ts --bundle --platform=neutral --format=esm --minify --external:cloudflare:workers --outfile=dist\/bundle.js"/' package.json

# Comment out Durable Objects for free plan
sed -i 's/^export { N8nMCPDurableObject, ToolTierManager }/\/\/ export { N8nMCPDurableObject, ToolTierManager } \/\/ Free plan/' src/index.ts

echo "🔨 Building..."
npm run build

if [ $? -eq 0 ]; then
    SIZE=$(du -h dist/bundle.js | cut -f1)
    echo "✅ Build successful! Bundle: $SIZE"
    
    echo "🚀 Deploying..."
    wrangler deploy -c wrangler-temp.toml
    
    echo ""
    echo "✅ Done! Test: curl https://n8n-cloud-mcp.andrew-e7a.workers.dev/"
else
    echo "❌ Build failed - check errors above"
fi
