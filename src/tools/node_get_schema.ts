/**
 * Get node input/output schema
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  nodeType: z.string().describe('node type')
});

export default {
  name: 'node.get_schema',
  description: 'Get node input/output schema',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'node.get_schema')) {
      await audit.denied('node.get_schema', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('node.get_schema', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Get node input/output schema\n\nProcessing: ${JSON.stringify(args, null, 2)}`
      }]
    };
  }
};