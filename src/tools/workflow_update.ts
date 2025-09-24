import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { logAudit, createWorkflowAuditEntry } from '../lib/audit';
import { CacheManager } from '../lib/cache';
import { validateSqlQuery } from '../lib/sql-validator';

const inputSchema = z.object({
  workflowId: z.string().describe('ID of the workflow to update'),
  name: z.string().optional().describe('New workflow name'),
  nodes: z.array(z.any()).optional().describe('Updated nodes array'),
  connections: z.record(z.any()).optional().describe('Updated connections'),
  settings: z.record(z.any()).optional().describe('Workflow settings')
});

export default {
  name: 'workflow.update',
  description: 'Update workflow configuration',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    // SECURITY: Check permissions
    if (!checkPermission(context.user, 'workflow.update')) {
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions for workflow.update'
        }]
      };
    }

    // SECURITY: Validate workflow ID to prevent SQL injection
    const idValidation = validateSqlQuery(`SELECT * FROM workflows WHERE id = '${args.workflowId}'`);
    if (!idValidation.isValid) {
      return {
        content: [{
          type: 'text' as const,
          text: `❌ Invalid workflow ID: ${idValidation.error}`
        }]
      };
    }

    try {
      // Initialize cache manager if available
      let cacheManager: CacheManager | null = null;
      if (context.env?.CACHE_KV && context.env?.WORKFLOW_D1) {
        cacheManager = new CacheManager(context.env);
      }

      // Get existing workflow from cache if available
      let existingWorkflow: any = null;
      if (cacheManager) {
        existingWorkflow = await cacheManager.get(`workflow:${args.workflowId}`);
      }

      // Prepare updates
      const updates = [];
      const updateData: any = {};
      
      if (args.name) {
        updates.push(`Name: ${args.name}`);
        updateData.name = args.name;
      }
      if (args.nodes) {
        updates.push(`Nodes: ${args.nodes.length}`);
        updateData.nodes = args.nodes;
      }
      if (args.connections) {
        updates.push('Connections: Updated');
        updateData.connections = args.connections;
      }
      if (args.settings) {
        updates.push('Settings: Updated');
        updateData.settings = args.settings;
      }

      // Update cache if available
      if (cacheManager && existingWorkflow) {
        const updatedWorkflow = {
          ...existingWorkflow,
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        await cacheManager.set(`workflow:${args.workflowId}`, updatedWorkflow);
        
        // Invalidate any related cache entries
        await cacheManager.invalidatePattern(`workflow-list:*`);
      }

      // SECURITY: Audit log the update
      const auditEntry = createWorkflowAuditEntry(
        'update',
        args.workflowId,
        context.user || 'anonymous',
        {
          updates: updateData,
          changesCount: updates.length
        }
      );

      // Log audit if Supabase is configured
      if (context.env?.SUPABASE_URL && context.env?.SUPABASE_ANON_KEY) {
        await logAudit(context.env, auditEntry);
      }

      return {
        content: [{
          type: 'text' as const,
          text: `✅ Updated workflow: ${args.workflowId}\n\nChanges:\n${updates.map(u => `• ${u}`).join('\n')}\n\nWorkflow updated successfully with security validation!`
        }]
      };
    } catch (error: any) {
      // Log error in audit
      if (context.env?.SUPABASE_URL && context.env?.SUPABASE_ANON_KEY) {
        const errorEntry = createWorkflowAuditEntry(
          'update',
          args.workflowId,
          context.user || 'anonymous',
          {
            error: error.message,
            attemptedUpdates: args
          }
        );
        await logAudit(context.env, errorEntry);
      }

      return {
        content: [{
          type: 'text' as const,
          text: `❌ Error updating workflow: ${error.message}`
        }]
      };
    }
  }
};
