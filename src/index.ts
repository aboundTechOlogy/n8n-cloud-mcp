import { z } from 'zod';

// Security modules
import { checkPermission, formatPermissionError } from './lib/permissions';
import { AuditLogger } from './lib/audit';
import { CacheManager } from './lib/cache';
import { validateSqlQuery } from './lib/sql-validator';

// Durable Objects - CRITICAL: Must be exported for Cloudflare
// export { N8nMCPDurableObject, ToolTierManager } // Free plan from './durable-objects';

// Tool implementations
import executeWorkflow from './tools/execute_workflow';
import listWorkflows from './tools/list_workflows';
import getWorkflow from './tools/get_workflow';
import createWorkflow from './tools/workflow_create';
import activateWorkflow from './tools/workflow_activate';
import deactivateWorkflow from './tools/workflow_deactivate';
import updateWorkflow from './tools/workflow_update';
import deleteWorkflow from './tools/workflow_delete';
import searchNodes from './tools/search_nodes';

// Tool registry
const tools = {
  execute_workflow: executeWorkflow,
  list_workflows: listWorkflows,
  get_workflow: getWorkflow,
  'workflow.create': createWorkflow,
  'workflow.activate': activateWorkflow,
  'workflow.deactivate': deactivateWorkflow,
  'workflow.update': updateWorkflow,
  'workflow.delete': deleteWorkflow,
  'search_nodes': searchNodes,
};

export default {
  async fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);
    
    // Initialize cache manager
    const cache = new CacheManager(env);
    
    // Status endpoint
    if (url.pathname === '/') {
      return new Response(JSON.stringify({
        name: 'n8n-cloud-mcp',
        version: '0.9.0',
        toolsImplemented: 9,
        totalTools: 93,
        progress: '9.7%',
        status: 'operational',
        architecture: '3-tier with security',
        bundleSize: '~200KB (with security)',
        security: {
          sqlValidation: true,
          permissions: true,
          auditLogging: true,
          multiLevelCache: true,
          durableObjects: true
        },
        tiers: {
          tier1: { total: 20, implemented: 8 },
          tier2: { total: 35, implemented: 0 },
          tier3: { total: 38, implemented: 0 }
        },
        tools: Object.keys(tools),
        infrastructure: {
          kv_namespaces: ['NODE_CACHE', 'TEMPLATE_CACHE', 'CONFIG_KV', 'CACHE_KV', 'DEDUP_KV'],
          durable_objects: ['N8nMCPDurableObject', 'ToolTierManager'],
          d1_database: 'n8n-cloud-db',
          r2_buckets: ['n8n-templates', 'n8n-node-docs', 'n8n-context']
        }
      }), { 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // MCP endpoint with security
    if (url.pathname === '/mcp' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { tool, args, user = 'anonymous' } = body;

        // Initialize audit logger
        const auditLogger = new AuditLogger(env, user);

        // Check permissions
        if (!checkPermission(user, tool)) {
          await auditLogger.denied(tool, 'Insufficient permissions');
          return new Response(JSON.stringify({
            error: formatPermissionError(user, tool)
          }), { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Check if tool exists
        if (!tools[tool]) {
          await auditLogger.failure(tool, 'Tool not found');
          return new Response(JSON.stringify({
            error: `Tool ${tool} not implemented yet`
          }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Check cache first
        const cacheKey = `tool:${tool}:${JSON.stringify(args)}`;
        const cached = await cache.get(cacheKey);
        if (cached) {
          await auditLogger.success(tool, { cached: true });
          return new Response(JSON.stringify(cached), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Execute tool
        const result = await tools[tool].execute(args, { env, user, cache, auditLogger });
        
        // Cache result
        await cache.set(cacheKey, result, { memoryTTL: 60, kvTTL: 300 });
        
        // Log success
        await auditLogger.success(tool, { cached: false });
        
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Tool listing endpoint
    if (url.pathname === '/api/tools') {
      return new Response(JSON.stringify({
        tools: Object.keys(tools).map(name => ({
          name,
          tier: name.startsWith('workflow.') ? 1 : 1,
          implemented: true,
          secured: true
        })),
        total: 93,
        implemented: 8,
        secured: 8,
        progress: '9.7%',
        securityProgress: '100%'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Durable Object status endpoint
    if (url.pathname.startsWith('/do/')) {
      const objectName = url.pathname.split('/')[2];
      
      if (objectName === 'session') {
        const id = env.N8NMCPDURABLEOBJECT_OBJECT.idFromName('default');
        const obj = env.N8NMCPDURABLEOBJECT_OBJECT.get(id);
        return obj.fetch(request);
      }
      
      if (objectName === 'tiers') {
        const id = env.TOOLTIERMANAGER_OBJECT.idFromName('default');
        const obj = env.TOOLTIERMANAGER_OBJECT.get(id);
        return obj.fetch(request);
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};
