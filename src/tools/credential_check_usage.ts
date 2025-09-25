/**
 * Check credential usage
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  credentialId: z.string().describe('credential id')
});

export default {
  name: 'credential.check_usage',
  description: 'Check credential usage',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'credential.check_usage')) {
      await audit.denied('credential.check_usage', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('credential.check_usage', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Check credential usage\n\nProcessing: ${JSON.stringify(args, null, 2)}`
      }]
    };
  }
};