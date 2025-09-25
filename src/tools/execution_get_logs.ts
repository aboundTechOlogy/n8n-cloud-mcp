/**
 * Get execution logs
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  executionId: z.string().describe('execution id')
});

export default {
  name: 'execution.get_logs',
  description: 'Get execution logs',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'execution.get_logs')) {
      await audit.denied('execution.get_logs', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('execution.get_logs', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Get execution logs\n\nProcessing: ${JSON.stringify(args, null, 2)}`
      }]
    };
  }
};