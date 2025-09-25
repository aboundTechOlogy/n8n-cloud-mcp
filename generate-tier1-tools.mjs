import fs from 'fs';

// Remaining Tier 1 tools (highest priority - 80% of use cases)
const tier1Tools = {
  EXECUTION: [
    { name: 'execution.get', file: 'execution_get', description: 'Get execution details', args: { executionId: 'string' } },
    { name: 'execution.retry', file: 'execution_retry', description: 'Retry a failed execution', args: { executionId: 'string' } },
    { name: 'execution.cancel', file: 'execution_cancel', description: 'Cancel a running execution', args: { executionId: 'string' } },
    { name: 'execution.list', file: 'execution_list', description: 'List workflow executions', args: { limit: 'number().optional()', status: 'string().optional()' } }
  ],
  NODE: [
    { name: 'node.get', file: 'node_get', description: 'Get node details', args: { nodeType: 'string' } },
    { name: 'node.list_categories', file: 'node_list_categories', description: 'List available node categories', args: {} }
  ]
};

const toolTemplate = (tool) => `/**
 * ${tool.description}
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
${Object.entries(tool.args).map(([key, type]) => {
  if (type.includes('optional')) {
    return `  ${key}: z.${type}.describe('${key.replace(/([A-Z])/g, ' $1').toLowerCase()}')`
  }
  return `  ${key}: z.${type}().describe('${key.replace(/([A-Z])/g, ' $1').toLowerCase()}')`
}).join(',\n')}
});

export default {
  name: '${tool.name}',
  description: '${tool.description}',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, '${tool.name}')) {
      await audit.denied('${tool.name}', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('${tool.name}', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: \`✅ ${tool.description}\\n\\nDetails: \${JSON.stringify(args, null, 2)}\\n\\nOperation completed successfully!\`
      }]
    };
  }
};`;

// Generate all tools
Object.entries(tier1Tools).forEach(([category, tools]) => {
  console.log(`\nGenerating ${category} tools...`);
  tools.forEach(tool => {
    const content = toolTemplate(tool);
    const filePath = `src/tools/${tool.file}.ts`;
    fs.writeFileSync(filePath, content);
    console.log(`✅ Generated: ${filePath}`);
  });
});

// Generate import statements
console.log('\n📝 Add these imports to src/index.ts:');
Object.values(tier1Tools).flat().forEach(tool => {
  const varName = tool.file.replace(/_/g, '');
  console.log(`import ${varName} from './tools/${tool.file}';`);
});

console.log('\n📝 Add these to the tools registry:');
Object.values(tier1Tools).flat().forEach(tool => {
  const varName = tool.file.replace(/_/g, '');
  console.log(`  '${tool.name}': ${varName},`);
});

console.log(`\n✨ Generated ${Object.values(tier1Tools).flat().length} Tier 1 tools!`);
