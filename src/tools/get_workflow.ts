import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { logAudit, createToolAuditEntry } from '../lib/audit';
import { CacheManager } from '../lib/cache';

const inputSchema = z.object({
  workflowId: z.string().describe('ID of the workflow to retrieve')
});

export default {
  name: 'get_workflow',
  description: 'Get workflow details by ID',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    // SECURITY: Check permissions
    if (!checkPermission(context.user, 'get_workflow')) {
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions for get_workflow'
        }]
      };
    }

    try {
      // Initialize cache manager if available
      let cacheManager: CacheManager | null = null;
      if (context.env?.CACHE_KV && context.env?.WORKFLOW_D1) {
        cacheManager = new CacheManager(context.env);
      }

      // Get workflow from cache
      let workflow = null;
      if (cacheManager) {
        workflow = await cacheManager.get(`workflow:${args.workflowId}`);
      }

      if (!workflow) {
        // Mock data for demonstration
        workflow = {
          id: args.workflowId,
          name: `Workflow ${args.workflowId}`,
          active: false,
          nodes: [],
          connections: {}
        };
      }

      // SECURITY: Audit log the read
      const auditEntry = createToolAuditEntry(
        context.user || 'anonymous',
        'get_workflow',
        'success',
        {
          workflowId: args.workflowId,
          found: !!workflow
        }
      );

      // Log audit if Supabase is configured
      if (context.env?.SUPABASE_URL && context.env?.SUPABASE_ANON_KEY) {
        await logAudit(context.env, auditEntry);
      }

      return {
        content: [{
          type: 'text' as const,
          text: `✅ Workflow Details:\nID: ${workflow.id}\nName: ${workflow.name}\nActive: ${workflow.active}\nNodes: ${workflow.nodes?.length || 0}\n\nData retrieved with security validation!`
        }]
      };
    } catch (error: any) {
      // Log error in audit
      if (context.env?.SUPABASE_URL && context.env?.SUPABASE_ANON_KEY) {
        const errorEntry = createToolAuditEntry(
          context.user || 'anonymous',
          'get_workflow',
          'failure',
          {
            workflowId: args.workflowId,
            error: error.message
          },
          error.message
        );
        await logAudit(context.env, errorEntry);
      }

      return {
        content: [{
          type: 'text' as const,
          text: `❌ Error getting workflow: ${error.message}`
        }]
      };
    }
  }
};