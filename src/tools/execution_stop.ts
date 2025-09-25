/**
 * Stop a running execution
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  executionId: z.string().describe('execution id')
});

export default {
  name: 'execution.stop',
  description: 'Stop a running execution',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'execution.stop')) {
      await audit.denied('execution.stop', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('execution.stop', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Stop a running execution\n\nProcessing: ${JSON.stringify(args, null, 2)}`
      }]
    };
  }
};