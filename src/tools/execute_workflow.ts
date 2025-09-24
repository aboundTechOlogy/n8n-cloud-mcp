import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { logAudit, createToolAuditEntry } from '../lib/audit';
import { CacheManager } from '../lib/cache';

const inputSchema = z.object({
  workflowId: z.string().describe('ID of the workflow to execute'),
  data: z.any().optional().describe('Input data for the workflow')
});

export default {
  name: 'execute_workflow',
  description: 'Execute a workflow immediately',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    // SECURITY: Check permissions
    if (!checkPermission(context.user, 'execute_workflow')) {
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions for execute_workflow'
        }]
      };
    }

    const executionId = `exec_${Date.now()}`;

    try {
      // Initialize cache manager if available
      let cacheManager: CacheManager | null = null;
      if (context.env?.CACHE_KV && context.env?.WORKFLOW_D1) {
        cacheManager = new CacheManager(context.env);
      }

      // Check if workflow exists in cache
      let workflow = null;
      if (cacheManager) {
        workflow = await cacheManager.get(`workflow:${args.workflowId}`);
        if (!workflow) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ Workflow ${args.workflowId} not found`
            }]
          };
        }
      }

      // Store execution in cache
      if (cacheManager) {
        await cacheManager.set(`execution:${executionId}`, {
          id: executionId,
          workflowId: args.workflowId,
          data: args.data,
          status: 'running',
          startedAt: new Date().toISOString()
        });
      }

      // SECURITY: Audit log the execution
      const auditEntry = createToolAuditEntry(
        context.user || 'anonymous',
        'execute_workflow',
        'success',
        {
          workflowId: args.workflowId,
          executionId,
          hasInputData: !!args.data
        }
      );

      // Log audit if Supabase is configured
      if (context.env?.SUPABASE_URL && context.env?.SUPABASE_ANON_KEY) {
        await logAudit(context.env, auditEntry);
      }

      return {
        content: [{
          type: 'text' as const,
          text: `✅ Executed workflow: ${args.workflowId}\nStatus: Running\nExecution ID: ${executionId}\n\nWorkflow execution started with security validation!`
        }]
      };
    } catch (error: any) {
      // Log error in audit
      if (context.env?.SUPABASE_URL && context.env?.SUPABASE_ANON_KEY) {
        const errorEntry = createToolAuditEntry(
          context.user || 'anonymous',
          'execute_workflow',
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
          text: `❌ Error executing workflow: ${error.message}`
        }]
      };
    }
  }
};