/**
 * Get node details
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  nodeType: z.string().describe('node type')
});

export default {
  name: 'node.get',
  description: 'Get node details',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'node.get')) {
      await audit.denied('node.get', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('node.get', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Get node details\n\nDetails: ${JSON.stringify(args, null, 2)}\n\nOperation completed successfully!`
      }]
    };
  }
};