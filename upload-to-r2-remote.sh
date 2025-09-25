#!/bin/bash
echo "Uploading to REMOTE R2 buckets..."

# Force remote upload
export WRANGLER_SEND_METRICS=false

# Upload metadata
echo "Uploading metadata.json to remote..."
wrangler r2 object put n8n-templates/metadata.json --file=workflow-metadata.json --pipe

# Upload context  
echo "Uploading workflow-context.json to remote..."
wrangler r2 object put n8n-context/workflow-context.json --file=workflow-context.json --pipe

# Upload batch files
for i in {0..20}; do
  if [ -f "workflow-batch-${i}.json" ]; then
    echo "Uploading workflow-batch-${i}.json to remote..."
    wrangler r2 object put n8n-templates/workflow-batch-${i}.json --file=workflow-batch-${i}.json --pipe
  fi
done

echo "Remote upload complete!"
