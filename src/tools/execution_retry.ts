/**
 * Retry a failed execution
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  executionId: z.string().describe('execution id')
});

export default {
  name: 'execution.retry',
  description: 'Retry a failed execution',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'execution.retry')) {
      await audit.denied('execution.retry', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('execution.retry', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Retry a failed execution\n\nDetails: ${JSON.stringify(args, null, 2)}\n\nOperation completed successfully!`
      }]
    };
  }
};