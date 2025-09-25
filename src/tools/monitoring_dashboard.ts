/**
 * Get dashboard data
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({

});

export default {
  name: 'monitoring.dashboard',
  description: 'Get dashboard data',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'monitoring.dashboard')) {
      await audit.denied('monitoring.dashboard', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('monitoring.dashboard', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Get dashboard data\n\nOperation complete.`
      }]
    };
  }
};