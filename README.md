# n8n Cloud MCP Server

Production-ready n8n MCP server with 93 tools for comprehensive workflow automation, deployed to Cloudflare Workers.

## Status

- **Tools Implemented**: 8/93 (8.6%)
  - 3 original tools (execute_workflow, list_workflows, get_workflow)
  - 5 new namespaced tools (workflow.create, workflow.activate, workflow.deactivate, workflow.update, workflow.delete)
- **Bundle Size**: 64KB
- **Architecture**: Simplified MCP implementation (no Node.js dependencies)
- **Deployment**: Cloudflare Workers via MCP Infrastructure Tools

## Architecture

### 3-Tier Tool Organization
1. **Tier 1: Core (20 tools)** - Essential operations covering 80% of use cases
2. **Tier 2: Contextual (35 tools)** - Activated based on workflow context
3. **Tier 3: Advanced (38 tools)** - Explicitly requested or pattern-triggered

### Namespace Convention
Using `category.operation` format (e.g., `workflow.create` instead of `create_workflow`) to prevent AI tool confusion.

## Resources Created

### KV Namespaces
- NODE_CACHE: `61a31e1f734a46218cf73db38b5246b1`
- TEMPLATE_CACHE: `8d05b8acb440458e8ef95971a04902e5`
- CONFIG_KV: `0774c6671bcb4a6caafa87f181d6f663`
- DEDUP_KV: `10438725ab324e9ea0de621e9e310bc5`

### D1 Database
- ID: `8030693f-aebc-4554-bb1f-b0456a6d8f0d`

### R2 Buckets
- n8n-templates
- n8n-node-docs
- n8n-context

## Development

### Prerequisites
- Cursor with Claude Code
- WSL Ubuntu
- MCP Infrastructure Tools v6.0+

### Local Setup
```bash
cd /home/dreww/n8n-cloud-mcp-cursor
npm install
npm run build
```

### Deployment
Using MCP Infrastructure Tools:
```javascript
Tool: deployMCPServer
Parameters: {
  "name": "n8n-cloud-mcp",
  "code": "[bundle.js content]",
  "description": "n8n MCP Server - 8 tools implemented",
  "githubClientId": "Ov23liJtU30d5pddTiufjJy",
  "githubClientSecret": "[secret]"
}
```

## Progress Tracker

### Completed
- [x] Environment setup
- [x] Repository created
- [x] MCP server core
- [x] 8 tools implemented
- [x] Namespace convention applied to 5 tools
- [x] Bundle optimization (64KB)

### In Progress
- [ ] Remaining 85 tools
- [ ] Tier management system
- [ ] Smart router implementation
- [ ] Production deployment

## PRP Version
Following n8n Cloud MCP Server PRP v5.1 with 3-tier architecture.
