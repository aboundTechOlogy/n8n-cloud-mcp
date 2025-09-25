/**
 * Debug R2 access
 */
export default {
  name: 'debug.r2',
  description: 'Debug R2 bucket access',
  inputSchema: {},
  execute: async (args: any, context: any) => {
    try {
      const buckets = [];
      
      // Check TEMPLATES bucket
      if (context.env.TEMPLATES) {
        const test = await context.env.TEMPLATES.list({ limit: 5 });
        buckets.push(`TEMPLATES: ${test.objects.length} objects found`);
      } else {
        buckets.push('TEMPLATES: Not bound');
      }
      
      // Check CONTEXT bucket
      if (context.env.CONTEXT) {
        const test = await context.env.CONTEXT.list({ limit: 5 });
        buckets.push(`CONTEXT: ${test.objects.length} objects found`);
      } else {
        buckets.push('CONTEXT: Not bound');
      }
      
      return {
        content: [{
          type: 'text' as const,
          text: `R2 Debug:\n${buckets.join('\n')}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `R2 Error: ${error}`
        }]
      };
    }
  }
};
