import { MCP } from '../types';
import { checkPermission } from '../lib/permissions';

export const debug_r2: MCP.Tool = {
  name: 'debug.r2',
  description: 'Debug R2 bucket bindings',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async (args: any, context: MCP.ToolContext) => {
    if (!checkPermission(context.user, 'debug.r2')) {
      return { content: [{ type: 'text', text: 'Unauthorized' }] };
    }

    try {
      const buckets = [];
      
      // Check TEMPLATES bucket
      if (context.env.TEMPLATES_BUCKET) {
        const test = await context.env.TEMPLATES_BUCKET.list({ limit: 5 });
        buckets.push(`TEMPLATES: ${test.truncated ? "5+" : test.objects.length} objects found`);
      } else {
        buckets.push('TEMPLATES: Not bound');
      }
      
      // Check NODE_DOCS bucket
      if (context.env.NODE_DOCS_BUCKET) {
        const test = await context.env.NODE_DOCS_BUCKET.list({ limit: 5 });
        buckets.push(`NODE_DOCS: ${test.truncated ? "5+" : test.objects.length} objects found`);
      } else {
        buckets.push('NODE_DOCS: Not bound');
      }
      
      // Check CONTEXT bucket
      if (context.env.CONTEXT_BUCKET) {
        const test = await context.env.CONTEXT_BUCKET.list({ limit: 5 });
        buckets.push(`CONTEXT: ${test.truncated ? "5+" : test.objects.length} objects found`);
      } else {
        buckets.push('CONTEXT: Not bound');
      }
      
      return {
        content: [{
          type: 'text',
          text: `R2 Debug:\n${buckets.join('\n')}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error checking R2 buckets: ${error.message}`
        }]
      };
    }
  }
};
export default debug_r2;
