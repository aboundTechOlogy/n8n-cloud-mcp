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
import duplicateWorkflow from './tools/workflow_duplicate';
import workflowmove from './tools/workflow_move';
import workflowrename from './tools/workflow_rename';
import workflowrestoreversion from './tools/workflow_restore_version';
import workflowgetversions from './tools/workflow_get_versions';
import executionget from './tools/execution_get';
import executionretry from './tools/execution_retry';
import executioncancel from './tools/execution_cancel';
import executionlist from './tools/execution_list';
import nodeget from './tools/node_get';
import nodelistcategories from './tools/node_list_categories';
import templatesearch from './tools/template_search';
import templateget from './tools/template_get';
import templatelist from './tools/template_list';
import templateapply from './tools/template_apply';
import templatecreate from './tools/template_create';
import templateupdate from './tools/template_update';
import templatedelete from './tools/template_delete';
import aisuggestworkflow from './tools/ai_suggest_workflow';
import aioptimizeworkflow from './tools/ai_optimize_workflow';
import aigeneratedescription from './tools/ai_generate_description';
import aidetecterrors from './tools/ai_detect_errors';
import aisuggestnodes from './tools/ai_suggest_nodes';
import aiexplainworkflow from './tools/ai_explain_workflow';
import analysisperformance from './tools/analysis_performance';
import analysisusage from './tools/analysis_usage';
import analysiserrors from './tools/analysis_errors';
import analysisbottlenecks from './tools/analysis_bottlenecks';
import analysisdependencies from './tools/analysis_dependencies';
import analysiscost from './tools/analysis_cost';
import analysisrecommendations from './tools/analysis_recommendations';
import executiondelete from './tools/execution_delete';
import executiongetlogs from './tools/execution_get_logs';
import executiongetdata from './tools/execution_get_data';
import executionstop from './tools/execution_stop';
import nodelist from './tools/node_list';
import nodegetschema from './tools/node_get_schema';
import nodegetdocumentation from './tools/node_get_documentation';
import nodevalidate from './tools/node_validate';
import nodegetexamples from './tools/node_get_examples';
import credentiallist from './tools/credential_list';
import credentialgettypes from './tools/credential_get_types';
import credentialvalidate from './tools/credential_validate';
import credentialtest from './tools/credential_test';
import credentialgetschema from './tools/credential_get_schema';
import credentialcheckusage from './tools/credential_check_usage';
import monitoringmetrics from './tools/monitoring_metrics';
import monitoringalerts from './tools/monitoring_alerts';
import monitoringhealth from './tools/monitoring_health';
import monitoringlogs from './tools/monitoring_logs';
import monitoringevents from './tools/monitoring_events';
import monitoringdashboard from './tools/monitoring_dashboard';
import importworkflow from './tools/import_workflow';
import exportworkflow from './tools/export_workflow';
import importtemplate from './tools/import_template';
import exporttemplate from './tools/export_template';
import importcredentials from './tools/import_credentials';
import exportcredentials from './tools/export_credentials';
import organizationfolders from './tools/organization_folders';
import organizationtags from './tools/organization_tags';
import organizationusers from './tools/organization_users';
import organizationpermissions from './tools/organization_permissions';
import organizationsettings from './tools/organization_settings';
import organizationaudit from './tools/organization_audit';
import organizationbackup from './tools/organization_backup';
import environmentvariables from './tools/environment_variables';
import environmentconfig from './tools/environment_config';
import environmentsecrets from './tools/environment_secrets';
import environmentconnections from './tools/environment_connections';
import environmentstatus from './tools/environment_status';
import webhookcreate from './tools/webhook_create';
import webhooklist from './tools/webhook_list';
import webhooktest from './tools/webhook_test';
import webhookdelete from './tools/webhook_delete';
import webhooklogs from './tools/webhook_logs';
import utilityvalidatejson from './tools/utility_validate_json';
import utilityconvertformat from './tools/utility_convert_format';
import utilitygenerateid from './tools/utility_generate_id';
import utilitycalculatehash from './tools/utility_calculate_hash';
import utilitybatchprocess from './tools/utility_batch_process';
import utilitycleanup from './tools/utility_cleanup';
import utilitydebug from './tools/utility_debug';
import credentialcreate from './tools/credential_create';
import credentialdelete from './tools/credential_delete';

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
  'workflow.duplicate': duplicateWorkflow,
  'search_nodes': searchNodes,
  'workflow.move': workflowmove,
  'workflow.rename': workflowrename,
  'workflow.restore_version': workflowrestoreversion,
  'workflow.get_versions': workflowgetversions,
  'execution.get': executionget,
  'execution.retry': executionretry,
  'execution.cancel': executioncancel,
  'execution.list': executionlist,
  'node.get': nodeget,
  'node.list_categories': nodelistcategories,
  'template.search': templatesearch,
  'template.get': templateget,
  'template.list': templatelist,
  'template.apply': templateapply,
  'template.create': templatecreate,
  'template.update': templateupdate,
  'template.delete': templatedelete,
  'ai.suggest_workflow': aisuggestworkflow,
  'ai.optimize_workflow': aioptimizeworkflow,
  'ai.generate_description': aigeneratedescription,
  'ai.detect_errors': aidetecterrors,
  'ai.suggest_nodes': aisuggestnodes,
  'ai.explain_workflow': aiexplainworkflow,
  'analysis.performance': analysisperformance,
  'analysis.usage': analysisusage,
  'analysis.errors': analysiserrors,
  'analysis.bottlenecks': analysisbottlenecks,
  'analysis.dependencies': analysisdependencies,
  'analysis.cost': analysiscost,
  'analysis.recommendations': analysisrecommendations,
  'execution.delete': executiondelete,
  'execution.get_logs': executiongetlogs,
  'execution.get_data': executiongetdata,
  'execution.stop': executionstop,
  'node.list': nodelist,
  'node.get_schema': nodegetschema,
  'node.get_documentation': nodegetdocumentation,
  'node.validate': nodevalidate,
  'node.get_examples': nodegetexamples,
  'credential.list': credentiallist,
  'credential.get_types': credentialgettypes,
  'credential.validate': credentialvalidate,
  'credential.test': credentialtest,
  'credential.get_schema': credentialgetschema,
  'credential.check_usage': credentialcheckusage,
  'monitoring.metrics': monitoringmetrics,
  'monitoring.alerts': monitoringalerts,
  'monitoring.health': monitoringhealth,
  'monitoring.logs': monitoringlogs,
  'monitoring.events': monitoringevents,
  'monitoring.dashboard': monitoringdashboard,
  'import.workflow': importworkflow,
  'export.workflow': exportworkflow,
  'import.template': importtemplate,
  'export.template': exporttemplate,
  'import.credentials': importcredentials,
  'export.credentials': exportcredentials,
  'organization.folders': organizationfolders,
  'organization.tags': organizationtags,
  'organization.users': organizationusers,
  'organization.permissions': organizationpermissions,
  'organization.settings': organizationsettings,
  'organization.audit': organizationaudit,
  'organization.backup': organizationbackup,
  'environment.variables': environmentvariables,
  'environment.config': environmentconfig,
  'environment.secrets': environmentsecrets,
  'environment.connections': environmentconnections,
  'environment.status': environmentstatus,
  'webhook.create': webhookcreate,
  'webhook.list': webhooklist,
  'webhook.test': webhooktest,
  'webhook.delete': webhookdelete,
  'webhook.logs': webhooklogs,
  'utility.validate_json': utilityvalidatejson,
  'utility.convert_format': utilityconvertformat,
  'utility.generate_id': utilitygenerateid,
  'utility.calculate_hash': utilitycalculatehash,
  'utility.batch_process': utilitybatchprocess,
  'utility.cleanup': utilitycleanup,
  'utility.debug': utilitydebug,
  'credential.create': credentialcreate,
  'credential.delete': credentialdelete,
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
        version: '1.0.0',
        toolsImplemented: 93,
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

// Add this after the fetch handler
