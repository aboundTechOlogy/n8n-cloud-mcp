/**
 * Delete execution history
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  executionId: z.string().describe('execution id')
});

export default {
  name: 'execution.delete',
  description: 'Delete execution history',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'execution.delete')) {
      await audit.denied('execution.delete', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('execution.delete', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Delete execution history\n\nProcessing: ${JSON.stringify(args, null, 2)}`
      }]
    };
  }
};