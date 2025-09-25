import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workflowsDir = path.join(process.env.HOME, 'n8n-workflows');

// Process all workflows
function processWorkflows(dir, basePath = '') {
  const results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.')) {
      results.push(...processWorkflows(filePath, path.join(basePath, file)));
    } else if (file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const workflow = JSON.parse(content);
        
        // Extract metadata
        const nodeTypes = [...new Set(workflow.nodes?.map(n => n.type) || [])];
        const category = basePath.split('/')[0] || 'uncategorized';
        
        results.push({
          id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          filename: file,
          category: category,
          path: path.join(basePath, file),
          name: workflow.name || file.replace('.json', ''),
          description: workflow.description || '',
          nodes: workflow.nodes?.length || 0,
          nodeTypes: nodeTypes,
          connections: Object.keys(workflow.connections || {}).length,
          tags: workflow.tags || [],
          size: JSON.stringify(workflow).length
        });
      } catch (e) {
        console.log(`Skipping invalid JSON: ${filePath}`);
      }
    }
  }
  return results;
}

console.log('Processing workflows...');
const workflows = processWorkflows(workflowsDir);
console.log(`Found ${workflows.length} valid workflows`);

// Group by category
const byCategory = {};
workflows.forEach(wf => {
  if (!byCategory[wf.category]) byCategory[wf.category] = [];
  byCategory[wf.category].push(wf);
});

// Create metadata file
const metadata = {
  total: workflows.length,
  updated: new Date().toISOString(),
  categories: Object.keys(byCategory).map(cat => ({
    name: cat,
    count: byCategory[cat].length
  })),
  topNodeTypes: Object.entries(
    workflows.flatMap(w => w.nodeTypes)
      .reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 20)
};

// Save metadata
fs.writeFileSync('workflow-metadata.json', JSON.stringify(metadata, null, 2));
console.log('Created workflow-metadata.json');

// Create upload batches (R2 has file size limits)
const BATCH_SIZE = 100;
for (let i = 0; i < workflows.length; i += BATCH_SIZE) {
  const batch = workflows.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE);
  fs.writeFileSync(`workflow-batch-${batchNum}.json`, JSON.stringify(batch));
}
console.log(`Created ${Math.ceil(workflows.length / BATCH_SIZE)} batch files`);

// Create context documentation
const context = {
  nodes: [...new Set(workflows.flatMap(w => w.nodeTypes))].map(type => ({
    type: type,
    category: type.split('.')[0],
    name: type.split('.').pop(),
    usage_count: workflows.filter(w => w.nodeTypes.includes(type)).length
  })),
  categories: Object.entries(byCategory).map(([cat, wfs]) => ({
    name: cat,
    workflows: wfs.length,
    common_patterns: [...new Set(wfs.flatMap(w => w.nodeTypes))].slice(0, 10)
  })),
  statistics: {
    total_workflows: workflows.length,
    unique_node_types: [...new Set(workflows.flatMap(w => w.nodeTypes))].length,
    average_nodes: Math.round(workflows.reduce((sum, w) => sum + w.nodes, 0) / workflows.length),
    categories: Object.keys(byCategory).length
  }
};

fs.writeFileSync('workflow-context.json', JSON.stringify(context, null, 2));
console.log('Created workflow-context.json');
