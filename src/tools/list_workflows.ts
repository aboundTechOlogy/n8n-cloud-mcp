import { z } from 'zod';

const inputSchema = z.object({
  active: z.boolean().optional().describe('Filter by active status'),
  limit: z.number().optional().default(10).describe('Number of workflows to return'),
  offset: z.number().optional().default(0).describe('Offset for pagination')
});

export default {
  name: 'list_workflows',
  description: 'List all workflows',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    // Mock implementation
    const mockWorkflows = [
      { id: 'wf_1', name: 'Data Processing Workflow', active: true, createdAt: '2025-01-01', nodes: 5 },
      { id: 'wf_2', name: 'Email Automation', active: false, createdAt: '2025-01-02', nodes: 3 },
      { id: 'wf_3', name: 'Webhook Handler', active: true, createdAt: '2025-01-03', nodes: 7 }
    ];
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(mockWorkflows.slice(args.offset || 0, (args.offset || 0) + (args.limit || 10)), null, 2)
      }]
    };
  }
};