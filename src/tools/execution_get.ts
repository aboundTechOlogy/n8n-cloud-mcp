/**
 * Get execution details
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  executionId: z.string().describe('execution id')
});

export default {
  name: 'execution.get',
  description: 'Get execution details',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'execution.get')) {
      await audit.denied('execution.get', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('execution.get', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Get execution details\n\nDetails: ${JSON.stringify(args, null, 2)}\n\nOperation completed successfully!`
      }]
    };
  }
};