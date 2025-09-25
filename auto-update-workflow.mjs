/**
 * Auto-Update Workflow for n8n Cloud MCP
 * Runs daily to sync nodes, workflows, and context
 */

import { Octokit } from '@octokit/rest';
import fs from 'fs';
import { execSync } from 'child_process';

async function updateNodes() {
  console.log('Checking for node updates...');
  
  // Check n8n-io/n8n for updates
  const octokit = new Octokit();
  const { data: commits } = await octokit.repos.listCommits({
    owner: 'n8n-io',
    repo: 'n8n',
    path: 'packages/nodes-base',
    per_page: 1
  });
  
  const lastCommit = commits[0].sha;
  const storedCommit = fs.existsSync('.last-node-commit') 
    ? fs.readFileSync('.last-node-commit', 'utf8').trim()
    : '';
  
  if (lastCommit !== storedCommit) {
    console.log('New node updates found!');
    // Process and upload node updates
    execSync('npm run update-nodes');
    fs.writeFileSync('.last-node-commit', lastCommit);
  }
}

async function updateWorkflows() {
  console.log('Checking for workflow updates...');
  
  // Pull latest from Zie619/n8n-workflows
  execSync('cd ~/n8n-workflows && git pull', { stdio: 'inherit' });
  
  // Reprocess workflows
  execSync('node process-workflows.mjs', { stdio: 'inherit' });
  
  // Upload to R2
  execSync('./upload-to-r2.sh', { stdio: 'inherit' });
}

async function updateContext() {
  console.log('Updating context documentation...');
  
  // Generate fresh context from current data
  const workflows = JSON.parse(fs.readFileSync('workflow-metadata.json'));
  const nodes = JSON.parse(fs.readFileSync('nodes-metadata.json'));
  
  const context = {
    updated: new Date().toISOString(),
    total_workflows: workflows.total,
    total_nodes: nodes.total,
    last_sync: {
      nodes: new Date().toISOString(),
      workflows: new Date().toISOString()
    }
  };
  
  fs.writeFileSync('context-update.json', JSON.stringify(context, null, 2));
  execSync('wrangler r2 object put n8n-context/last-update.json --file=context-update.json --local');
}

// Run all updates
async function runAutoUpdate() {
  console.log('Starting auto-update process...');
  
  try {
    await updateNodes();
    await updateWorkflows();
    await updateContext();
    console.log('Auto-update complete!');
  } catch (error) {
    console.error('Auto-update failed:', error);
  }
}

runAutoUpdate();
