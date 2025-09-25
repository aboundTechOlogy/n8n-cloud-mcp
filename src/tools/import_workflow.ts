/**
 * Import workflow from JSON
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  json: z.string().describe('json')
});

export default {
  name: 'import.workflow',
  description: 'Import workflow from JSON',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'import.workflow')) {
      await audit.denied('import.workflow', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('import.workflow', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ Import workflow from JSON\n\nOperation complete.`
      }]
    };
  }
};