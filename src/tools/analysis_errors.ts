/**
 * Analyze workflow errors
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  workflowId: z.string().describe('workflow id'),
  limit: z.number().optional().describe('limit')
});

export default {
  name: 'analysis.errors',
  description: 'Analyze workflow errors',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'analysis.errors')) {
      await audit.denied('analysis.errors', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('analysis.errors', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Analyze workflow errors\n\nProcessing: ${JSON.stringify(args, null, 2)}`
      }]
    };
  }
};