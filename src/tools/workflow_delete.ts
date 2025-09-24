import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { logAudit, createWorkflowAuditEntry } from '../lib/audit';
import { CacheManager } from '../lib/cache';
import { validateSqlQuery } from '../lib/sql-validator';

const inputSchema = z.object({
  workflowId: z.string().describe('ID of the workflow to delete'),
  confirm: z.boolean().describe('Confirmation flag for deletion')
});

export default {
  name: 'workflow.delete',
  description: 'Delete a workflow permanently',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    // SECURITY: Check permissions
    if (!checkPermission(context.user, 'workflow.delete')) {
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions for workflow.delete'
        }]
      };
    }

    // Require confirmation
    if (!args.confirm) {
      return {
        content: [{
          type: 'text' as const,
          text: '⚠️ Deletion requires confirmation. Set confirm: true to proceed.'
        }]
      };
    }

    // SECURITY: Validate workflow ID
    const idValidation = validateSqlQuery(`DELETE FROM workflows WHERE id = '${args.workflowId}'`);
    if (!idValidation.isValid) {
      return {
        content: [{
          type: 'text' as const,
          text: `❌ Invalid workflow ID: ${idValidation.error}`
        }]
      };
    }

    try {
      // Initialize cache manager
      let cacheManager: CacheManager | null = null;
      let workflowData: any = null;
      
      if (context.env?.CACHE_KV && context.env?.WORKFLOW_D1) {
        cacheManager = new CacheManager(context.env);
        
        // Get workflow data before deletion for audit
        workflowData = await cacheManager.get(`workflow:${args.workflowId}`);
        
        // Remove from cache
        await cacheManager.invalidate(`workflow:${args.workflowId}`);
        await cacheManager.invalidatePattern(`workflow-list:*`);
      }

      // SECURITY: Audit log the deletion
      const auditEntry = createWorkflowAuditEntry(
        'delete',
        args.workflowId,
        context.user || 'anonymous',
        {
          workflowName: workflowData?.name || 'unknown',
          confirmed: true,
          deletedAt: new Date().toISOString()
        }
      );

      // Log audit if Supabase is configured
      if (context.env?.SUPABASE_URL && context.env?.SUPABASE_ANON_KEY) {
        await logAudit(context.env, auditEntry);
      }

      return {
        content: [{
          type: 'text' as const,
          text: `✅ Deleted workflow: ${args.workflowId}\n${workflowData?.name ? `Name: ${workflowData.name}\n` : ''}Status: Permanently deleted\n\nWorkflow deletion completed with security validation!`
        }]
      };
    } catch (error: any) {
      // Log error in audit
      if (context.env?.SUPABASE_URL && context.env?.SUPABASE_ANON_KEY) {
        const errorEntry = createWorkflowAuditEntry(
          'delete',
          args.workflowId,
          context.user || 'anonymous',
          {
            error: error.message,
            attemptFailed: true
          }
        );
        await logAudit(context.env, errorEntry);
      }

      return {
        content: [{
          type: 'text' as const,
          text: `❌ Error deleting workflow: ${error.message}`
        }]
      };
    }
  }
};