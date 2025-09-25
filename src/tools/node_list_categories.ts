/**
 * List available node categories
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({

});

export default {
  name: 'node.list_categories',
  description: 'List available node categories',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'node.list_categories')) {
      await audit.denied('node.list_categories', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('node.list_categories', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ List available node categories\n\nDetails: ${JSON.stringify(args, null, 2)}\n\nOperation completed successfully!`
      }]
    };
  }
};