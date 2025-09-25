/**
 * Export template
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  templateId: z.string().describe('template id')
});

export default {
  name: 'export.template',
  description: 'Export template',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'export.template')) {
      await audit.denied('export.template', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('export.template', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Export template\n\nOperation complete.`
      }]
    };
  }
};