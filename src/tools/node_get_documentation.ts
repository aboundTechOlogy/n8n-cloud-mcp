/**
 * Get node documentation
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  nodeType: z.string().describe('node type')
});

export default {
  name: 'node.get_documentation',
  description: 'Get node documentation',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'node.get_documentation')) {
      await audit.denied('node.get_documentation', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('node.get_documentation', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Get node documentation\n\nProcessing: ${JSON.stringify(args, null, 2)}`
      }]
    };
  }
};