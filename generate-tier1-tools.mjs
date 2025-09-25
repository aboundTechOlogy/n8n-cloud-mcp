import fs from 'fs';

// Remaining Tier 1 tools (highest priority - 80% of use cases)
const tier1Tools = {
  EXECUTION: [
    { name: 'execution.get', file: 'execution_get', args: { executionId: 'string' } },
    { name: 'execution.retry', file: 'execution_retry', args: { executionId: 'string' } },
    { name: 'execution.cancel', file: 'execution_cancel', args: { executionId: 'string' } },
    { name: 'execution.list', file: 'execution_list', args: { limit: 'number().optional()' } }
  ],
  NODE: [
    { name: 'node.get', file: 'node_get', args: { nodeType: 'string' } },
    { name: 'node.list_categories', file: 'node_list_categories', args: {} }
  ]
};

// Generate all Tier 1 tools at once (6 tools)
console.log(`Generating ${Object.values(tier1Tools).flat().length} Tier 1 tools...`);
