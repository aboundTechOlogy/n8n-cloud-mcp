/**
 * Search Nodes Tool
 */

import { z } from 'zod';
import { R2DataLoader } from '../lib/r2-loader';
import { AuditLogger } from '../lib/audit';
import { checkPermission } from '../lib/permissions';

const searchNodesInput = z.object({
  query: z.string().describe('Search query for nodes'),
  category: z.string().optional().describe('Filter by category'),
  limit: z.number().min(1).max(100).default(20).describe('Max results')
});

const searchNodesOutput = z.object({
  content: z.array(z.object({
    type: z.literal('text'),
    text: z.string()
  }))
});

async function searchNodes(args: unknown, context: any) {
  const startTime = Date.now();
  const audit = new AuditLogger(context.env, context.user || 'anonymous');
  
  try {
    const { query, category, limit } = searchNodesInput.parse(args);
    
    const hasPermission = checkPermission(context.user || 'anonymous', 'search_nodes');
    if (!hasPermission) {
      const errorMessage = `Permission denied`;
      await audit.denied('search_nodes', errorMessage);
      return {
        content: [{
          type: 'text' as const,
          text: errorMessage
        }]
      };
    }

    const r2Loader = new R2DataLoader(context.env);
    const metadata = await r2Loader.loadMetadata();
    let results = await r2Loader.searchNodes(query);
    
    if (category) {
      results = results.filter(node => node.category === category);
    }
    
    results = results.slice(0, limit);
    
    const duration = Date.now() - startTime;
    let responseText = `## n8n Node Search Results\n\n`;
    responseText += `**Query:** "${query}"\n`;
    responseText += `**Results:** ${results.length} nodes found\n`;
    responseText += `**Search Time:** ${duration}ms`;
    responseText += duration > 12 ? ` ⚠️` : ` ✅`;
    responseText += `\n\n`;
    
    if (results.length === 0) {
      responseText += `No nodes found.`;
    } else {
      results.forEach((node, index) => {
        responseText += `### ${index + 1}. ${node.displayName}\n`;
        responseText += `- Type: ${node.nodeType}\n`;
        responseText += `- Category: ${node.category}\n`;
        if (node.description) {
          responseText += `- ${node.description}\n`;
        }
        responseText += `\n`;
      });
    }

    await audit.success('search_nodes', {
      query,
      resultsCount: results.length,
      duration
    });

    return {
      content: [{
        type: 'text' as const,
        text: responseText
      }]
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await audit.failure('search_nodes', errorMessage);
    
    return {
      content: [{
        type: 'text' as const,
        text: `## Error: ${errorMessage}`
      }]
    };
  }
}

export default {
  name: 'search_nodes',
  description: 'Search n8n nodes by name, description, or category using R2 data',
  inputSchema: searchNodesInput,
  outputSchema: searchNodesOutput,
  execute: searchNodes
};
