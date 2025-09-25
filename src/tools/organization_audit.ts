/**
 * View audit logs
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  limit: z.number().optional().describe('limit')
});

export default {
  name: 'organization.audit',
  description: 'View audit logs',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'organization.audit')) {
      await audit.denied('organization.audit', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    await audit.success('organization.audit', args);
    
    return {
      content: [{
        type: 'text' as const,
        text: `✅ View audit logs\n\nOperation complete.`
      }]
    };
  }
};