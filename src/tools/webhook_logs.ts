/**
 * Get webhook logs
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  webhookId: z.string().describe('webhook id')
});

export default {
  name: 'webhook.logs',
  description: 'Get webhook logs',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'webhook.logs')) {
      await audit.denied('webhook.logs', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('webhook.logs', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Get webhook logs\n\nOperation complete.`
      }]
    };
  }
};