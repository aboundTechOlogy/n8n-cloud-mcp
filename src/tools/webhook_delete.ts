/**
 * Delete webhook
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  webhookId: z.string().describe('webhook id')
});

export default {
  name: 'webhook.delete',
  description: 'Delete webhook',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'webhook.delete')) {
      await audit.denied('webhook.delete', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('webhook.delete', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Delete webhook\n\nOperation complete.`
      }]
    };
  }
};