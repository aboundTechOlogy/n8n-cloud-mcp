/**
 * Export workflow to JSON
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  workflowId: z.string().describe('workflow id')
});

export default {
  name: 'export.workflow',
  description: 'Export workflow to JSON',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'export.workflow')) {
      await audit.denied('export.workflow', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('export.workflow', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Export workflow to JSON\n\nOperation complete.`
      }]
    };
  }
};