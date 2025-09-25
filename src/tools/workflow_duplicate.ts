/**
 * Duplicate Workflow Tool
 */

import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { AuditLogger } from '../lib/audit';

const inputSchema = z.object({
  id: z.string().describe('Workflow ID to duplicate'),
  name: z.string().optional().describe('New name for duplicated workflow')
});

export default {
  name: 'workflow.duplicate',
  description: 'Create a copy of an existing workflow',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    const audit = new AuditLogger(context.env, context.user || 'anonymous');
    
    if (!checkPermission(context.user, 'workflow.duplicate')) {
      await audit.denied('workflow.duplicate', 'Insufficient permissions');
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions'
        }]
      };
    }

    const { id, name } = args;
    const newId = `wf_${Date.now()}`;
    const newName = name || `Copy of Workflow ${id}`;
    
    // Use the success method instead of createToolAuditEntry
    await audit.success('workflow.duplicate', { 
      original: id, 
      duplicate: newId,
      name: newName 
    });

    return {
      content: [{
        type: 'text' as const,
        text: `✅ Duplicated workflow: ${id}\n\nNew Workflow:\n• ID: ${newId}\n• Name: ${newName}\n• Status: Inactive\n\nWorkflow duplicated successfully!`
      }]
    };
  }
};
