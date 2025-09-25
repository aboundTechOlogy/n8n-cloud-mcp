/**
 * List available templates from R2
 */

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
      const metadata = await context.env.TEMPLATES_BUCKET.get('metadata.json');
      if (metadata) {
        const data = JSON.parse(await metadata.text());
        const limit = args.limit || 10;
        const categories = data.categories.slice(0, limit);
        
        await audit.success('template.list', args);
        
        return {
          content: [{
            type: 'text' as const,
            text: `📚 Template Categories (${data.total} workflows total)\n\n${
              categories.map((cat: any, i: number) => 
                `${i+1}. **${cat.name}**: ${cat.count} workflows`
              ).join('\n')
            }\n\n✨ Use template.search to find specific workflows`
          }]
        };
      }
    } catch (error) {
      console.error('Error reading templates:', error);
      return {
        content: [{
          type: 'text' as const,
          text: `Error accessing templates: ${error}`
        }]
      };
    }

    return {
      content: [{
        type: 'text' as const,
        text: 'No templates found in R2 bucket'
      }]
    };
  }
};
