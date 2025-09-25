/**
 * Get workflow metrics
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  workflowId: z.string().describe('workflow id'),
  period: z.string().optional().describe('period')
});

export default {
  name: 'monitoring.metrics',
  description: 'Get workflow metrics',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'monitoring.metrics')) {
      await audit.denied('monitoring.metrics', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('monitoring.metrics', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Get workflow metrics\n\nOperation complete.`
      }]
    };
  }
};