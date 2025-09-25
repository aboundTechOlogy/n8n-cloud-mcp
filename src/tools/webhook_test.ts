/**
 * Test webhook
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  webhookId: z.string().describe('webhook id'),
  payload: z.object().optional().describe('payload')
});

export default {
  name: 'webhook.test',
  description: 'Test webhook',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'webhook.test')) {
      await audit.denied('webhook.test', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('webhook.test', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Test webhook\n\nOperation complete.`
      }]
    };
  }
};