#!/bin/bash
# R2 Bucket Population Script - Following PRP v6.0 Requirements

echo "📋 n8n Cloud MCP - R2 Bucket Population (PRP Phase 2)"
echo "======================================================"
echo "Following PRP v6.0 Section: Phase 2 - Critical Data Gap"
echo ""

# Configuration
ACCOUNT_ID="e7a209bd41da099cd3d2fa81a79a186d"
NODE_DOCS_BUCKET="n8n-node-docs"
TEMPLATES_BUCKET="n8n-templates"
CONTEXT_BUCKET="n8n-context"

# Step 1: Download nodes.db from czlonkowski/n8n-mcp
echo "📥 Step 1: Downloading nodes database from czlonkowski/n8n-mcp..."
mkdir -p /tmp/n8n-data
cd /tmp/n8n-data

# Download the SQLite database
curl -L -o nodes.db "https://raw.githubusercontent.com/czlonkowski/n8n-mcp/main/data/nodes.db"

if [ ! -f nodes.db ]; then
    echo "❌ Failed to download nodes.db"
    exit 1
fi

echo "✅ Downloaded nodes.db ($(du -h nodes.db | cut -f1))"

# Step 2: Extract nodes from SQLite to JSON
echo "📤 Step 2: Extracting nodes from SQLite..."

# Create Python extraction script
python3 extract_nodes.py

# Step 3: Upload to R2 bucket
echo "☁️ Step 3: Uploading to R2 bucket n8n-node-docs..."

for file in nodes-essential.json nodes-by-category.json metadata.json; do
    if [ -f "$file" ]; then
        echo "  Uploading $file..."
        wrangler r2 object put "$NODE_DOCS_BUCKET/$file" --file="$file"
    fi
done

echo "✅ R2 Population Complete!"
