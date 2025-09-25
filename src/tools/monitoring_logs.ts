/**
 * View system logs
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  limit: z.number().optional().describe('limit')
});

export default {
  name: 'monitoring.logs',
  description: 'View system logs',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'monitoring.logs')) {
      await audit.denied('monitoring.logs', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('monitoring.logs', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ View system logs\n\nOperation complete.`
      }]
    };
  }
};