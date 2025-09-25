/**
 * Search workflow templates
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  query: z.string().describe('query'),
  category: z.string().optional().describe('category')
});

export default {
  name: 'template.search',
  description: 'Search workflow templates',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'template.search')) {
      await audit.denied('template.search', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    try {
      // Search through batch files
      const results = [];
      for (let i = 0; i < 21; i++) {
        const batch = await context.env.TEMPLATES_BUCKET.get(`workflow-batch-${i}.json`);
        if (batch) {
          const workflows = JSON.parse(await batch.text());
          const matches = workflows.filter((wf: any) => {
            const matchesQuery = wf.name.toLowerCase().includes(args.query.toLowerCase()) ||
                                wf.nodeTypes.some((n: string) => n.toLowerCase().includes(args.query.toLowerCase()));
            const matchesCategory = !args.category || wf.category === args.category;
            return matchesQuery && matchesCategory;
          });
          results.push(...matches);
        }
      }

      const topResults = results.slice(0, 5);
      await audit.success('template.search', args);
      
      return {
        content: [{
          type: 'text' as const,
          text: `🔍 Search Results for "${args.query}"${args.category ? ` in ${args.category}` : ''}\n\n${
            topResults.length > 0 
              ? topResults.map((wf: any, i: number) => 
                  `${i+1}. **${wf.name}**\n   📁 ${wf.category} | 🔧 ${wf.nodes} nodes\n   📌 ${wf.nodeTypes.slice(0,3).join(', ')}`
                ).join('\n\n')
              : 'No workflows found matching your search'
          }\n\nFound ${results.length} total matches`
        }]
      };
    } catch (error) {
      console.error('Search error:', error);
    }

    return {
      content: [{
        type: 'text' as const,
        text: 'Search failed'
      }]
    };
  }
};
