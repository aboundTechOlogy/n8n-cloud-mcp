/**
 * Get execution data
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  executionId: z.string().describe('execution id')
});

export default {
  name: 'execution.get_data',
  description: 'Get execution data',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'execution.get_data')) {
      await audit.denied('execution.get_data', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('execution.get_data', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Get execution data\n\nProcessing: ${JSON.stringify(args, null, 2)}`
      }]
    };
  }
};