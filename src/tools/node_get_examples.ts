/**
 * Get node usage examples
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  nodeType: z.string().describe('node type')
});

export default {
  name: 'node.get_examples',
  description: 'Get node usage examples',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'node.get_examples')) {
      await audit.denied('node.get_examples', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('node.get_examples', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Get node usage examples\n\nProcessing: ${JSON.stringify(args, null, 2)}`
      }]
    };
  }
};