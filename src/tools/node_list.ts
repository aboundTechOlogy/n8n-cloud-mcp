/**
 * List all available nodes
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  category: z.string().optional().describe('category')
});

export default {
  name: 'node.list',
  description: 'List all available nodes',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'node.list')) {
      await audit.denied('node.list', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('node.list', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ List all available nodes\n\nProcessing: ${JSON.stringify(args, null, 2)}`
      }]
    };
  }
};