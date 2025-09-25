/**
 * Update template tools to read from R2 buckets
 */

const toolsToUpdate = [
  'template_list',
  'template_search', 
  'template_get'
];

const templateListCode = `
import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  limit: z.number().optional().describe('limit')
});

export default {
  name: 'template.list',
  description: 'List available templates',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'template.list')) {
      await audit.denied('template.list', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    try {
      // Read metadata from R2
      const metadata = await context.env.TEMPLATES.get('metadata.json');
      if (metadata) {
        const data = JSON.parse(await metadata.text());
        const templates = data.categories.slice(0, args.limit || 10);
        
        await audit.success('template.list', args);
        
        return {
          content: [{
            type: 'text' as const,
            text: \`📚 Template Categories (Total: \${data.total} workflows)\\n\\n\${
              templates.map((cat: any) => \`• \${cat.name}: \${cat.count} workflows\`).join('\\n')
            }\`
          }]
        };
      }
    } catch (error) {
      console.error('Error reading templates:', error);
    }

    return {
      content: [{
        type: 'text' as const,
        text: 'No templates found'
      }]
    };
  }
};`;

console.log('Update src/tools/template_list.ts with R2 integration');
console.log('Similar updates needed for template_search and template_get');
