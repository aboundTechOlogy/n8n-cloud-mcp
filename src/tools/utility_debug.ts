/**
 * Debug information
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  target: z.string().describe('target')
});

export default {
  name: 'utility.debug',
  description: 'Debug information',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'utility.debug')) {
      await audit.denied('utility.debug', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('utility.debug', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Debug information\n\nOperation complete.`
      }]
    };
  }
};