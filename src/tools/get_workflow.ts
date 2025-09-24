import { z } from 'zod';

const inputSchema = z.object({
  workflowId: z.string().describe('ID of the workflow to retrieve')
});

export default {
  name: 'get_workflow',
  description: 'Get workflow configuration',
  inputSchema,
  execute: async (args: z.infer<typeof inputSchema>, context: any) => {
    // Mock implementation
    const mockWorkflow = {
      id: args.workflowId,
      name: 'Sample Workflow',
      active: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-15T12:00:00Z',
      nodes: [
        { id: 'node_1', type: 'webhook', position: [100, 100] },
        { id: 'node_2', type: 'http', position: [300, 100] },
        { id: 'node_3', type: 'set', position: [500, 100] }
      ],
      connections: {
        'node_1': { main: [['node_2']] },
        'node_2': { main: [['node_3']] }
      }
    };
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(mockWorkflow, null, 2)
      }]
    };
  }
};