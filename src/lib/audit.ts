/**
 * Audit Logging System
 * CRITICAL: Comprehensive audit trail for all operations
 * Stores logs in Supabase for compliance and monitoring
 */

export interface AuditEntry {
  timestamp: string;
  worker: string;
  user: string;
  action: string;
  tool?: string;
  status: 'success' | 'failure' | 'denied';
  details?: any;
  error?: string;
  duration_ms?: number;
  ip_address?: string;
}

export interface SupabaseClient {
  from: (table: string) => {
    insert: (data: any) => Promise<any>;
  };
}

/**
 * Log an audit entry to Supabase
 * @param env Cloudflare Worker environment
 * @param entry The audit entry to log
 */
export async function logAudit(
  env: any,
  entry: AuditEntry
): Promise<void> {
  try {
    // Check if Supabase client is available
    if (!env.SUPABASE_CLIENT) {
      console.error('Audit logging failed: SUPABASE_CLIENT not configured');
      // Fall back to console logging
      console.log('[AUDIT]', JSON.stringify(entry));
      return;
    }

    // Insert audit entry into Supabase
    const { error } = await env.SUPABASE_CLIENT
      .from('n8n_audit_logs')
      .insert({
        ...entry,
        created_at: entry.timestamp
      });

    if (error) {
      console.error('Failed to write audit log to Supabase:', error);
      // Still log to console as fallback
      console.log('[AUDIT]', JSON.stringify(entry));
    }
  } catch (error) {
    console.error('Audit logging error:', error);
    // Always fall back to console logging
    console.log('[AUDIT]', JSON.stringify(entry));
  }
}

/**
 * Create an audit entry for tool execution
 * @param user The user executing the tool
 * @param tool The tool being executed
 * @param status The execution status
 * @param details Additional details
 * @param error Error message if failed
 * @param duration_ms Execution duration
 */
export function createToolAuditEntry(
  user: string,
  tool: string,
  status: 'success' | 'failure' | 'denied',
  details?: any,
  error?: string,
  duration_ms?: number
): AuditEntry {
  return {
    timestamp: new Date().toISOString(),
    worker: 'n8n-cloud-mcp',
    user,
    action: 'tool_execution',
    tool,
    status,
    details,
    error,
    duration_ms
  };
}

/**
 * Create an audit entry for workflow operations
 * @param user The user performing the operation
 * @param action The action being performed
 * @param workflowId The workflow ID
 * @param status The operation status
 * @param details Additional details
 */
export function createWorkflowAuditEntry(
  user: string,
  action: string,
  workflowId: string,
  status: 'success' | 'failure' | 'denied',
  details?: any
): AuditEntry {
  return {
    timestamp: new Date().toISOString(),
    worker: 'n8n-cloud-mcp',
    user,
    action: `workflow_${action}`,
    status,
    details: {
      workflow_id: workflowId,
      ...details
    }
  };
}

/**
 * Create an audit entry for security events
 * @param user The user involved
 * @param event The security event type
 * @param status The event status
 * @param details Additional details
 */
export function createSecurityAuditEntry(
  user: string,
  event: string,
  status: 'success' | 'failure' | 'denied',
  details?: any
): AuditEntry {
  return {
    timestamp: new Date().toISOString(),
    worker: 'n8n-cloud-mcp',
    user,
    action: `security_${event}`,
    status,
    details
  };
}

/**
 * Batch audit entries for bulk logging
 * @param entries Array of audit entries
 * @returns Combined audit entry for batch operation
 */
export function createBatchAuditEntry(entries: AuditEntry[]): AuditEntry {
  return {
    timestamp: new Date().toISOString(),
    worker: 'n8n-cloud-mcp',
    user: 'system',
    action: 'batch_operation',
    status: 'success',
    details: {
      batch_size: entries.length,
      entries: entries.map(e => ({
        action: e.action,
        user: e.user,
        status: e.status
      }))
    }
  };
}

/**
 * Audit logger class for consistent logging across tools
 */
export class AuditLogger {
  private env: any;
  private user: string;
  private startTime: number;

  constructor(env: any, user: string) {
    this.env = env;
    this.user = user;
    this.startTime = Date.now();
  }

  /**
   * Log a successful operation
   */
  async success(action: string, details?: any): Promise<void> {
    const duration_ms = Date.now() - this.startTime;
    const entry = createToolAuditEntry(
      this.user,
      action,
      'success',
      details,
      undefined,
      duration_ms
    );
    await logAudit(this.env, entry);
  }

  /**
   * Log a failed operation
   */
  async failure(action: string, error: string, details?: any): Promise<void> {
    const duration_ms = Date.now() - this.startTime;
    const entry = createToolAuditEntry(
      this.user,
      action,
      'failure',
      details,
      error,
      duration_ms
    );
    await logAudit(this.env, entry);
  }

  /**
   * Log a denied operation
   */
  async denied(action: string, reason: string): Promise<void> {
    const duration_ms = Date.now() - this.startTime;
    const entry = createToolAuditEntry(
      this.user,
      action,
      'denied',
      { reason },
      reason,
      duration_ms
    );
    await logAudit(this.env, entry);
  }

  /**
   * Log a security event
   */
  async security(event: string, status: 'success' | 'failure' | 'denied', details?: any): Promise<void> {
    const entry = createSecurityAuditEntry(
      this.user,
      event,
      status,
      details
    );
    await logAudit(this.env, entry);
  }
}

/**
 * Middleware to automatically log tool executions
 * @param env Worker environment
 * @param user User executing the tool
 * @param toolName Tool being executed
 * @param executeFn The tool execution function
 */
export async function withAuditLogging<T>(
  env: any,
  user: string,
  toolName: string,
  executeFn: () => Promise<T>
): Promise<T> {
  const logger = new AuditLogger(env, user);
  
  try {
    const result = await executeFn();
    await logger.success(toolName, { result_type: typeof result });
    return result;
  } catch (error: any) {
    await logger.failure(toolName, error.message || 'Unknown error');
    throw error;
  }
}
