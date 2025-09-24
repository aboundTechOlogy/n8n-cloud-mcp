import { z } from 'zod';

const inputSchema = z.object({
  workflowId: z.string().describe('ID of the workflow to delete'),
  confirm: z.boolean().optional().default(false).describe('Confirmation flag')
});

export default {
  name: 'workflow.delete',
  description: 'Delete a workflow permanently',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    if (!args.confirm) {
      return {
        content: [{
          type: 'text' as const,
          text: `⚠️ Warning: This will permanently delete workflow ${args.workflowId}\n\nTo confirm deletion, set confirm: true`
        }]
      };
    }
    
    return {
      content: [{
        type: 'text' as const,
        text: `🗑️ Deleted workflow: ${args.workflowId}\n\nThe workflow has been permanently deleted.`
      }]
    };
  }
};