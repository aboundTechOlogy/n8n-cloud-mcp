#!/bin/bash

echo "🚀 Starting R2 Bucket Population (PRP v6.0 Phase 2)"
echo "==================================================="

# Step 1: Download nodes.db
echo "📥 Downloading nodes database..."
mkdir -p /tmp/n8n-data
cd /tmp/n8n-data
curl -L -o nodes.db "https://raw.githubusercontent.com/czlonkowski/n8n-mcp/main/data/nodes.db"

if [ -f nodes.db ]; then
    echo "✅ Downloaded: $(du -h nodes.db | cut -f1)"
    
    # Step 2: Extract data
    echo "📤 Extracting node data..."
    python3 /tmp/extract_nodes.py
    
    # Step 3: Upload to R2
    echo "☁️ Uploading to R2..."
    
    for file in *.json; do
        if [ -f "$file" ]; then
            echo "  Uploading $file..."
            wrangler r2 object put "n8n-node-docs/$file" --file="$file"
        fi
    done
    
    # Step 4: Download some workflow samples
    echo "📥 Getting workflow samples..."
    mkdir -p workflows
    cd workflows
    
    # Download a few sample workflows
    for i in 1 2 3 4 5; do
        curl -L -o "sample-workflow-$i.json" \
          "https://raw.githubusercontent.com/Zie619/n8n-workflows/main/workflows/$i.json" 2>/dev/null
    done
    
    # Upload samples to R2
    for file in *.json; do
        if [ -f "$file" ]; then
            wrangler r2 object put "n8n-templates/$file" --file="$file"
        fi
    done
    
    echo "✅ R2 Population Complete!"
    echo ""
    echo "📊 Results:"
    wrangler r2 object list n8n-node-docs
    wrangler r2 object list n8n-templates
    
else
    echo "❌ Failed to download nodes.db"
fi

# Cleanup
cd /
rm -rf /tmp/n8n-data
