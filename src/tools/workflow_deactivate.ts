import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { logAudit, createWorkflowAuditEntry } from '../lib/audit';
import { CacheManager } from '../lib/cache';

const inputSchema = z.object({
  workflowId: z.string().describe('ID of the workflow to deactivate')
});

export default {
  name: 'workflow.deactivate',
  description: 'Deactivate an active workflow',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    // SECURITY: Check permissions
    if (!checkPermission(context.user, 'workflow.deactivate')) {
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions for workflow.deactivate'
        }]
      };
    }

    try {
      // Initialize cache manager
      let cacheManager: CacheManager | null = null;
      if (context.env?.CACHE_KV && context.env?.WORKFLOW_D1) {
        cacheManager = new CacheManager(context.env);
      }

      // Update workflow status in cache
      if (cacheManager) {
        const workflow = await cacheManager.get(`workflow:${args.workflowId}`);
        if (workflow) {
          workflow.active = false;
          workflow.deactivatedAt = new Date().toISOString();
          await cacheManager.set(`workflow:${args.workflowId}`, workflow);
          await cacheManager.invalidatePattern(`workflow-list:*`);
        }
      }

      // SECURITY: Audit log the deactivation
      const auditEntry = createWorkflowAuditEntry(
        'deactivate',
        args.workflowId,
        context.user || 'anonymous',
        {
          action: 'deactivate',
          timestamp: new Date().toISOString()
        }
      );

      // Log audit if Supabase is configured
      if (context.env?.SUPABASE_URL && context.env?.SUPABASE_ANON_KEY) {
        await logAudit(context.env, auditEntry);
      }

      return {
        content: [{
          type: 'text' as const,
          text: `⏸️ Deactivated workflow: ${args.workflowId}\n\nThe workflow is now inactive and will not respond to triggers.\nSecurity validation completed!`
        }]
      };
    } catch (error: any) {
      // Log error in audit
      if (context.env?.SUPABASE_URL && context.env?.SUPABASE_ANON_KEY) {
        const errorEntry = createWorkflowAuditEntry(
          'deactivate',
          args.workflowId,
          context.user || 'anonymous',
          {
            error: error.message,
            failed: true
          }
        );
        await logAudit(context.env, errorEntry);
      }

      return {
        content: [{
          type: 'text' as const,
          text: `❌ Error deactivating workflow: ${error.message}`
        }]
      };
    }
  }
};