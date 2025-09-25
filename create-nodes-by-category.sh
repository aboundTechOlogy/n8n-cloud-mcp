#!/bin/bash

echo "📥 Re-downloading nodes database to create categories..."
mkdir -p /tmp/n8n-data
cd /tmp/n8n-data

# Download the database again
curl -L -o nodes.db "https://raw.githubusercontent.com/czlonkowski/n8n-mcp/main/data/nodes.db"

if [ -f nodes.db ]; then
    echo "✅ Downloaded nodes.db"
    
    # Create Python script to extract categories
    python3 << 'PYTHON'
import sqlite3
import json

conn = sqlite3.connect('nodes.db')
cursor = conn.cursor()

# Get table structure
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='nodes'")
print(cursor.fetchone()[0])

# Get all nodes
cursor.execute('SELECT * FROM nodes')
columns = [desc[0] for desc in cursor.description]
all_nodes = []
for row in cursor.fetchall():
    all_nodes.append(dict(zip(columns, row)))

print(f"Total nodes: {len(all_nodes)}")

# Group by tags or other categorization
nodes_by_cat = {}
for node in all_nodes:
    # Try different category fields
    category = None
    if 'tags' in node and node['tags']:
        # Parse tags if it's a string
        if isinstance(node['tags'], str):
            try:
                tags = json.loads(node['tags']) if node['tags'].startswith('[') else [node['tags']]
                category = tags[0] if tags else 'uncategorized'
            except:
                category = 'uncategorized'
    
    if not category:
        # Fallback: categorize by packageName
        if 'packageName' in node:
            category = node['packageName'].replace('n8n-nodes-base', 'core').replace('@', '').replace('/', '-')
        else:
            category = 'uncategorized'
    
    if category not in nodes_by_cat:
        nodes_by_cat[category] = []
    nodes_by_cat[category].append(node)

# Save the categorized nodes
with open('nodes-by-category.json', 'w') as f:
    json.dump(nodes_by_cat, f)

print(f"Created nodes-by-category.json with {len(nodes_by_cat)} categories")
for cat, nodes in nodes_by_cat.items():
    print(f"  - {cat}: {len(nodes)} nodes")

conn.close()
PYTHON

    # Upload to R2
    if [ -f nodes-by-category.json ]; then
        echo "☁️ Uploading to R2..."
        wrangler r2 object put "n8n-node-docs/nodes-by-category.json" --file="nodes-by-category.json"
        echo "✅ Upload complete!"
    fi
    
    # Clean up
    cd /
    rm -rf /tmp/n8n-data
else
    echo "❌ Failed to download nodes.db"
fi
