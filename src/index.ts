import { z } from 'zod';

// Tool implementations
import executeWorkflow from './tools/execute_workflow';
import listWorkflows from './tools/list_workflows';
import getWorkflow from './tools/get_workflow';
import createWorkflow from './tools/workflow_create';
import activateWorkflow from './tools/workflow_activate';
import deactivateWorkflow from './tools/workflow_deactivate';
import updateWorkflow from './tools/workflow_update';
import deleteWorkflow from './tools/workflow_delete';

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
};

export default {
  async fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);
    
    // Status endpoint
    if (url.pathname === '/') {
      return new Response(JSON.stringify({
        name: 'n8n-cloud-mcp',
        version: '0.8.0',
        toolsImplemented: 8,
        totalTools: 93,
        progress: '8.6%',
        status: 'operational',
        architecture: 'simplified',
        bundleSize: '64KB',
        tiers: {
          tier1: { total: 20, implemented: 8 },
          tier2: { total: 35, implemented: 0 },
          tier3: { total: 38, implemented: 0 }
        },
        tools: Object.keys(tools)
      }), { 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // MCP endpoint
    if (url.pathname === '/mcp' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { tool, args } = body;

        if (tools[tool]) {
          const result = await tools[tool].execute(args, { env });
          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          error: `Tool ${tool} not implemented yet`
        }), { 
          status: 404,
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
          implemented: true
        })),
        total: 93,
        implemented: 8,
        progress: '8.6%'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};
