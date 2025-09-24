/**
 * Permission System
 * CRITICAL: Role-based access control for MCP tools
 * Based on Cloudflare Workers PRP v6 patterns
 */

// Authorized users for general tool access
export const AUTHORIZED_USERS = new Set([
  'aboundTechOlogy',
  'andrewwhalen' // Add additional authorized users here
]);

// Users with deployment permissions
export const DEPLOYMENT_USERS = new Set([
  'aboundTechOlogy'
]);

// Infrastructure administrators
export const INFRASTRUCTURE_ADMINS = new Set([
  'aboundTechOlogy'
]);

// Tool categories and their required permission levels
export enum PermissionLevel {
  PUBLIC = 'public',        // No authentication required
  READ = 'read',           // Read-only operations
  WRITE = 'write',         // Write operations
  EXECUTE = 'execute',     // Execute workflows
  ADMIN = 'admin',         // Admin operations
  INFRASTRUCTURE = 'infra' // Infrastructure management
}

// Tool permission mapping
const TOOL_PERMISSIONS: Record<string, PermissionLevel> = {
  // WORKFLOW Tools - Tier 1
  'workflow.list': PermissionLevel.READ,
  'workflow.get': PermissionLevel.READ,
  'workflow.create': PermissionLevel.WRITE,
  'workflow.update': PermissionLevel.WRITE,
  'workflow.delete': PermissionLevel.ADMIN,
  'workflow.activate': PermissionLevel.EXECUTE,
  'workflow.deactivate': PermissionLevel.EXECUTE,
  'workflow.execute': PermissionLevel.EXECUTE,
  
  // WORKFLOW Tools - Tier 2
  'workflow.duplicate': PermissionLevel.WRITE,
  'workflow.move': PermissionLevel.WRITE,
  'workflow.rename': PermissionLevel.WRITE,
  'workflow.restore_version': PermissionLevel.ADMIN,
  'workflow.get_versions': PermissionLevel.READ,
  'workflow.share': PermissionLevel.ADMIN,
  
  // EXECUTION Tools
  'execution.list': PermissionLevel.READ,
  'execution.get': PermissionLevel.READ,
  'execution.retry': PermissionLevel.EXECUTE,
  'execution.stop': PermissionLevel.EXECUTE,
  'execution.delete': PermissionLevel.ADMIN,
  
  // NODE Tools
  'node.search': PermissionLevel.READ,
  'node.get_details': PermissionLevel.READ,
  'node.list_by_category': PermissionLevel.READ,
  
  // CREDENTIAL Tools (sensitive)
  'credential.list': PermissionLevel.ADMIN,
  'credential.get': PermissionLevel.ADMIN,
  'credential.create': PermissionLevel.ADMIN,
  'credential.update': PermissionLevel.ADMIN,
  'credential.delete': PermissionLevel.ADMIN,
  'credential.test': PermissionLevel.ADMIN,
  
  // ENVIRONMENT Tools (sensitive)
  'environment.get_variables': PermissionLevel.ADMIN,
  'environment.set_variable': PermissionLevel.INFRASTRUCTURE,
  'environment.delete_variable': PermissionLevel.INFRASTRUCTURE,
  
  // Legacy tool names (for backward compatibility)
  'execute_workflow': PermissionLevel.EXECUTE,
  'list_workflows': PermissionLevel.READ,
  'get_workflow': PermissionLevel.READ,
};

/**
 * Check if a user has permission to use a specific tool
 * @param username The GitHub username
 * @param toolName The name of the tool
 * @returns Whether the user has permission
 */
export function checkPermission(username: string, toolName: string): boolean {
  // Check if user is authorized at all
  if (!AUTHORIZED_USERS.has(username)) {
    return false;
  }
  
  // Get required permission level for the tool
  const requiredLevel = TOOL_PERMISSIONS[toolName] || PermissionLevel.READ;
  
  // Check permission levels
  switch (requiredLevel) {
    case PermissionLevel.PUBLIC:
      return true;
      
    case PermissionLevel.READ:
    case PermissionLevel.WRITE:
    case PermissionLevel.EXECUTE:
      return AUTHORIZED_USERS.has(username);
      
    case PermissionLevel.ADMIN:
      return DEPLOYMENT_USERS.has(username);
      
    case PermissionLevel.INFRASTRUCTURE:
      return INFRASTRUCTURE_ADMINS.has(username);
      
    default:
      return false;
  }
}

/**
 * Get user's permission level
 * @param username The GitHub username
 * @returns The user's highest permission level
 */
export function getUserPermissionLevel(username: string): PermissionLevel | null {
  if (INFRASTRUCTURE_ADMINS.has(username)) {
    return PermissionLevel.INFRASTRUCTURE;
  }
  if (DEPLOYMENT_USERS.has(username)) {
    return PermissionLevel.ADMIN;
  }
  if (AUTHORIZED_USERS.has(username)) {
    return PermissionLevel.EXECUTE;
  }
  return null;
}

/**
 * Check if a user has a specific permission level
 * @param username The GitHub username
 * @param level The required permission level
 * @returns Whether the user has the required level
 */
export function hasPermissionLevel(username: string, level: PermissionLevel): boolean {
  const userLevel = getUserPermissionLevel(username);
  if (!userLevel) return false;
  
  const levels = [
    PermissionLevel.PUBLIC,
    PermissionLevel.READ,
    PermissionLevel.WRITE,
    PermissionLevel.EXECUTE,
    PermissionLevel.ADMIN,
    PermissionLevel.INFRASTRUCTURE
  ];
  
  const userIndex = levels.indexOf(userLevel);
  const requiredIndex = levels.indexOf(level);
  
  return userIndex >= requiredIndex;
}

/**
 * Format permission error message
 * @param username The username that was denied
 * @param toolName The tool that was requested
 * @returns Formatted error message
 */
export function formatPermissionError(username: string, toolName: string): string {
  if (!AUTHORIZED_USERS.has(username)) {
    return `Access denied: User '${username}' is not authorized to use this MCP server`;
  }
  
  const requiredLevel = TOOL_PERMISSIONS[toolName] || PermissionLevel.READ;
  return `Access denied: Tool '${toolName}' requires ${requiredLevel} permission level`;
}

/**
 * Log permission check for audit trail
 * @param username The username
 * @param toolName The tool name
 * @param granted Whether access was granted
 * @returns Audit log entry
 */
export function createPermissionAuditEntry(
  username: string, 
  toolName: string, 
  granted: boolean
): any {
  return {
    timestamp: new Date().toISOString(),
    username,
    tool: toolName,
    permission: TOOL_PERMISSIONS[toolName] || 'unknown',
    granted,
    userLevel: getUserPermissionLevel(username)
  };
}
