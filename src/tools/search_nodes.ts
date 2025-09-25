/**
 * Search nodes from R2 bucket
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  query: z.string().describe('Search query for nodes'),
  category: z.string().optional().describe('Filter by category')
});

export default {
  name: 'search_nodes',
  description: 'Search n8n nodes by name or type',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'search_nodes')) {
      await audit.denied('search_nodes', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    try {
      // Try to get nodes from R2 or context
      const contextData = await context.env.CONTEXT_BUCKET.get('workflow-context.json');
      if (contextData) {
        const data = JSON.parse(await contextData.text());
        const query = args.query.toLowerCase();
        
        const matches = data.nodes.filter((node: any) => 
          node.type.toLowerCase().includes(query) ||
          node.name.toLowerCase().includes(query)
        ).slice(0, 10);

        await audit.success('search_nodes', args);
        
        return {
          content: [{
            type: 'text' as const,
            text: `🔍 Node Search Results for "${args.query}"\n\n${
              matches.length > 0
                ? matches.map((node: any, i: number) => 
                    `${i+1}. **${node.name}**\n   Type: ${node.type}\n   Used in ${node.usage_count} workflows`
                  ).join('\n\n')
                : 'No nodes found matching your search'
            }\n\n💡 Total unique nodes: ${data.statistics.unique_node_types}`
          }]
        };
      }
    } catch (error) {
      console.error('Node search error:', error);
    }

    // Fallback to original behavior
    const nodeTypes = ['HTTP Request', 'Webhook', 'Email', 'Slack', 'Database'];
    const results = nodeTypes.filter(n => n.toLowerCase().includes(args.query.toLowerCase()));
    
    return {
      content: [{
        type: 'text' as const,
        text: `Found ${results.length} nodes: ${results.join(', ')}`
      }]
    };
  }
};
