#!/bin/bash
echo "=== Uploading workflow data to R2 ==="

# Upload metadata first
echo "Uploading metadata..."
wrangler r2 object put n8n-templates/metadata.json --file=workflow-metadata.json --remote

# Upload context
echo "Uploading context..."
wrangler r2 object put n8n-context/workflow-context.json --file=workflow-context.json --remote

# Upload all batch files
echo "Uploading workflow batches..."
for file in workflow-batch-*.json; do
  echo "Uploading $file..."
  wrangler r2 object put n8n-templates/$file --file=$file --remote
done

# Check what's in the buckets
echo -e "\n=== Verifying uploads ==="
wrangler r2 object list n8n-templates | head -10
wrangler r2 object list n8n-context | head -5
