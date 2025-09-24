import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { logAudit, createWorkflowAuditEntry } from '../lib/audit';
import { CacheManager } from '../lib/cache';

const inputSchema = z.object({
  name: z.string().describe('Name of the workflow'),
  nodes: z.array(z.any()).optional().describe('Array of nodes'),
  connections: z.record(z.any()).optional().describe('Node connections'),
  active: z.boolean().optional().default(false).describe('Whether to activate immediately')
});

export default {
  name: 'workflow.create',
  description: 'Create a new workflow',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    // SECURITY: Check permissions
    if (!checkPermission(context.user, 'workflow.create')) {
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions for workflow.create'
        }]
      };
    }

    const newWorkflowId = `wf_${Date.now()}`;
    
    try {
      // Initialize cache manager if available
      let cacheManager: CacheManager | null = null;
      if (context.env?.CACHE_KV && context.env?.WORKFLOW_D1) {
        cacheManager = new CacheManager(context.env);
      }
      
      // Store in cache if available
      if (cacheManager) {
        await cacheManager.set(`workflow:${newWorkflowId}`, {
          id: newWorkflowId,
          name: args.name,
          nodes: args.nodes || [],
          connections: args.connections || {},
          active: args.active || false,
          createdAt: new Date().toISOString()
        });
      }
      
      // SECURITY: Audit log the creation
      const auditEntry = createWorkflowAuditEntry(
        'create',
        newWorkflowId,
        context.user || 'anonymous',
        {
          workflowName: args.name,
          nodeCount: args.nodes?.length || 0,
          active: args.active || false
        }
      );
      
      // Log audit if Supabase is configured
      if (context.env?.SUPABASE_URL && context.env?.SUPABASE_ANON_KEY) {
        await logAudit(context.env, auditEntry);
      }
      
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Created workflow: ${args.name}\nID: ${newWorkflowId}\nNodes: ${args.nodes?.length || 0}\nActive: ${args.active || false}\n\nWorkflow created successfully with security validation!`
        }]
      };
    } catch (error: any) {
      // Log error in audit
      if (context.env?.SUPABASE_URL && context.env?.SUPABASE_ANON_KEY) {
        const errorEntry = createWorkflowAuditEntry(
          'create',
          'error',
          context.user || 'anonymous',
          {
            error: error.message,
            workflowName: args.name
          }
        );
        await logAudit(context.env, errorEntry);
      }
      
      return {
        content: [{
          type: 'text' as const,
          text: `❌ Error creating workflow: ${error.message}`
        }]
      };
    }
  }
};
