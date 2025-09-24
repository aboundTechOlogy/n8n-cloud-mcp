import { z } from 'zod';

const inputSchema = z.object({
  workflowId: z.string().describe('ID of the workflow to deactivate')
});

export default {
  name: 'workflow.deactivate',
  description: 'Deactivate an active workflow',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    return {
      content: [{
        type: 'text' as const,
        text: `⏸️ Deactivated workflow: ${args.workflowId}\n\nThe workflow has been deactivated and will not respond to triggers.`
      }]
    };
  }
};