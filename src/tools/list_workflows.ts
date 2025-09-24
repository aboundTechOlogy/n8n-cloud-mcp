import { z } from 'zod';
import { checkPermission } from '../lib/permissions';
import { logAudit, createToolAuditEntry } from '../lib/audit';
import { CacheManager } from '../lib/cache';

const inputSchema = z.object({
  active: z.boolean().optional().describe('Filter by active status'),
  limit: z.number().optional().default(10).describe('Max results to return')
});

export default {
  name: 'list_workflows',
  description: 'List all workflows',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    // SECURITY: Check permissions
    if (!checkPermission(context.user, 'list_workflows')) {
      return {
        content: [{
          type: 'text' as const,
          text: 'Access denied: Insufficient permissions for list_workflows'
        }]
      };
    }

    try {
      // Initialize cache manager if available
      let cacheManager: CacheManager | null = null;
      if (context.env?.CACHE_KV && context.env?.WORKFLOW_D1) {
        cacheManager = new CacheManager(context.env);
      }

      // Check cache for workflow list
      let workflows = [];
      const cacheKey = `workflow-list:${args.active !== undefined ? args.active : 'all'}:${args.limit}`;
      
      if (cacheManager) {
        const cached = await cacheManager.get(cacheKey);
        if (cached) {
          workflows = cached;
        }
      }

      // Mock data if not in cache
      if (workflows.length === 0) {
        workflows = [
          { id: 'wf_001', name: 'Data Processing', active: true },
          { id: 'wf_002', name: 'Email Automation', active: false },
          { id: 'wf_003', name: 'Backup Routine', active: true }
        ];
        
        // Filter by active status if specified
        if (args.active !== undefined) {
          workflows = workflows.filter(w => w.active === args.active);
        }
        
        // Apply limit
        workflows = workflows.slice(0, args.limit);
        
        // Cache the results
        if (cacheManager) {
          await cacheManager.set(cacheKey, workflows, { memoryTTL: 60, kvTTL: 300 });
        }
      }

      // SECURITY: Audit log the list operation
      const auditEntry = createToolAuditEntry(
        context.user || 'anonymous',
        'list_workflows',
        'success',
        {
          filterActive: args.active,
          limit: args.limit,
          resultCount: workflows.length
        }
      );

      // Log audit if Supabase is configured
      if (context.env?.SUPABASE_URL && context.env?.SUPABASE_ANON_KEY) {
        await logAudit(context.env, auditEntry);
      }

      const workflowList = workflows.map(w => 
        `• ${w.name} (${w.id}) - ${w.active ? '✅ Active' : '⏸️ Inactive'}`
      ).join('\n');

      return {
        content: [{
          type: 'text' as const,
          text: `📋 Workflows (${workflows.length} results):\n\n${workflowList}\n\nList retrieved with security validation!`
        }]
      };
    } catch (error: any) {
      // Log error in audit
      if (context.env?.SUPABASE_URL && context.env?.SUPABASE_ANON_KEY) {
        const errorEntry = createToolAuditEntry(
          context.user || 'anonymous',
          'list_workflows',
          'failure',
          {
            error: error.message,
            filters: args
          },
          error.message
        );
        await logAudit(context.env, errorEntry);
      }

      return {
        content: [{
          type: 'text' as const,
          text: `❌ Error listing workflows: ${error.message}`
        }]
      };
    }
  }
};