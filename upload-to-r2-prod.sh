#!/bin/bash
echo "Uploading to production R2 buckets..."

# Upload metadata
echo "Uploading metadata.json..."
wrangler r2 object put n8n-templates/metadata.json --file=workflow-metadata.json

# Upload context
echo "Uploading workflow-context.json..."
wrangler r2 object put n8n-context/workflow-context.json --file=workflow-context.json

# Upload batch files
for i in {0..20}; do
  if [ -f "workflow-batch-${i}.json" ]; then
    echo "Uploading workflow-batch-${i}.json..."
    wrangler r2 object put n8n-templates/workflow-batch-${i}.json --file=workflow-batch-${i}.json
  fi
done

echo "Upload complete!"
