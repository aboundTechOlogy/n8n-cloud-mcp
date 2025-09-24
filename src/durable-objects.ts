/**
 * N8n MCP Durable Object
 * Provides stateful coordination and session management
 * Based on Cloudflare Workers PRP v6 patterns
 */

import { DurableObject } from 'cloudflare:workers';

export interface SessionData {
  user: string;
  startTime: number;
  lastAccess: number;
  toolsExecuted: number;
  currentTier: number;
  context: any;
}

/**
 * Main Durable Object for n8n MCP server
 * Handles session state and coordination
 */
export class N8nMCPDurableObject extends DurableObject {
  private sessions: Map<string, SessionData>;
  private sql: any;

  constructor(state: DurableObjectState, env: any) {
    super(state, env);
    this.sessions = new Map();
    this.sql = state.storage.sql;
  }

  /**
   * CRITICAL: Cleanup method required by PRP v6
   * Must be implemented for all Durable Objects
   */
  async cleanup(): Promise<void> {
    // Clear all session data
    this.sessions.clear();
    
    // Delete all storage
    await this.ctx.storage.deleteAll();
    
    // Close any open database connections
    if (this.sql) {
      try {
        await this.sql.exec('VACUUM');
      } catch (e) {
        console.error('Error during SQL cleanup:', e);
      }
    }
    
    console.log('Durable Object cleanup completed');
  }

  /**
   * Initialize or get session
   */
  async getSession(sessionId: string, user: string): Promise<SessionData> {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      // Try to restore from storage
      session = await this.ctx.storage.get<SessionData>(`session:${sessionId}`);
      
      if (!session) {
        // Create new session
        session = {
          user,
          startTime: Date.now(),
          lastAccess: Date.now(),
          toolsExecuted: 0,
          currentTier: 1,
          context: {}
        };
        
        await this.ctx.storage.put(`session:${sessionId}`, session);
      }
      
      this.sessions.set(sessionId, session);
    } else {
      // Update last access time
      session.lastAccess = Date.now();
      await this.ctx.storage.put(`session:${sessionId}`, session);
    }
    
    return session;
  }

  /**
   * Update session after tool execution
   */
  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
    const session = await this.getSession(sessionId, updates.user || 'unknown');
    
    Object.assign(session, updates);
    session.lastAccess = Date.now();
    
    this.sessions.set(sessionId, session);
    await this.ctx.storage.put(`session:${sessionId}`, session);
  }

  /**
   * Increment tool execution counter
   */
  async incrementToolCount(sessionId: string): Promise<number> {
    const session = await this.getSession(sessionId, 'unknown');
    session.toolsExecuted++;
    
    await this.updateSession(sessionId, { toolsExecuted: session.toolsExecuted });
    
    return session.toolsExecuted;
  }

  /**
   * Get current tool tier for session
   */
  async getCurrentTier(sessionId: string): Promise<number> {
    const session = await this.getSession(sessionId, 'unknown');
    return session.currentTier;
  }

  /**
   * Update tool tier based on context
   */
  async updateTier(sessionId: string, tier: number): Promise<void> {
    await this.updateSession(sessionId, { currentTier: tier });
  }

  /**
   * Store workflow context for intelligent tool selection
   */
  async updateContext(sessionId: string, context: any): Promise<void> {
    const session = await this.getSession(sessionId, 'unknown');
    session.context = { ...session.context, ...context };
    
    await this.updateSession(sessionId, { context: session.context });
  }

  /**
   * Clean expired sessions (older than 24 hours)
   */
  async cleanExpiredSessions(): Promise<number> {
    const expireTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    let cleaned = 0;
    
    for (const [id, session] of this.sessions.entries()) {
      if (session.lastAccess < expireTime) {
        this.sessions.delete(id);
        await this.ctx.storage.delete(`session:${id}`);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  /**
   * Get session statistics
   */
  async getStats(): Promise<any> {
    const activeSessions = this.sessions.size;
    let totalTools = 0;
    const tierDistribution = { tier1: 0, tier2: 0, tier3: 0 };
    
    for (const session of this.sessions.values()) {
      totalTools += session.toolsExecuted;
      tierDistribution[`tier${session.currentTier}` as keyof typeof tierDistribution]++;
    }
    
    return {
      activeSessions,
      totalTools,
      averageToolsPerSession: activeSessions > 0 ? totalTools / activeSessions : 0,
      tierDistribution,
      oldestSession: Math.min(...Array.from(this.sessions.values()).map(s => s.startTime)),
      newestSession: Math.max(...Array.from(this.sessions.values()).map(s => s.startTime))
    };
  }

  /**
   * Handle HTTP requests to the Durable Object
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    try {
      switch (path) {
        case '/session':
          const sessionId = url.searchParams.get('id') || 'default';
          const user = url.searchParams.get('user') || 'unknown';
          const session = await this.getSession(sessionId, user);
          return Response.json(session);
        
        case '/stats':
          const stats = await this.getStats();
          return Response.json(stats);
        
        case '/cleanup':
          if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
          }
          await this.cleanup();
          return Response.json({ status: 'cleaned' });
        
        case '/clean-expired':
          const cleaned = await this.cleanExpiredSessions();
          return Response.json({ cleaned });
        
        default:
          return new Response('Not found', { status: 404 });
      }
    } catch (error: any) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }
}

/**
 * Tool Tier Manager Durable Object
 * Manages the 3-tier tool architecture
 */
export class ToolTierManager extends DurableObject {
  private tiers: Map<number, string[]>;

  constructor(state: DurableObjectState, env: any) {
    super(state, env);
    this.tiers = new Map();
    this.initializeTiers();
  }

  /**
   * CRITICAL: Cleanup implementation
   */
  async cleanup(): Promise<void> {
    this.tiers.clear();
    await this.ctx.storage.deleteAll();
  }

  /**
   * Initialize tool tiers
   */
  private async initializeTiers(): Promise<void> {
    // Check if tiers are already in storage
    const stored = await this.ctx.storage.get<Map<number, string[]>>('tiers');
    
    if (stored) {
      this.tiers = new Map(stored);
    } else {
      // Initialize with default tiers from PRP
      this.tiers.set(1, [
        'workflow.list',
        'workflow.get',
        'workflow.create',
        'workflow.update',
        'workflow.delete',
        'workflow.activate',
        'workflow.deactivate',
        'workflow.execute'
      ]);
      
      this.tiers.set(2, [
        'workflow.duplicate',
        'workflow.move',
        'workflow.rename',
        'workflow.restore_version',
        'workflow.get_versions'
      ]);
      
      this.tiers.set(3, [
        'credential.list',
        'credential.create',
        'environment.get_variables',
        'environment.set_variable'
      ]);
      
      await this.ctx.storage.put('tiers', Array.from(this.tiers.entries()));
    }
  }

  /**
   * Get tools for a specific tier
   */
  async getToolsForTier(tier: number): Promise<string[]> {
    return this.tiers.get(tier) || [];
  }

  /**
   * Get all tools up to a specific tier
   */
  async getToolsUpToTier(maxTier: number): Promise<string[]> {
    const tools: string[] = [];
    
    for (let tier = 1; tier <= maxTier; tier++) {
      tools.push(...(this.tiers.get(tier) || []));
    }
    
    return tools;
  }

  /**
   * Determine which tier a tool belongs to
   */
  async getToolTier(toolName: string): Promise<number | null> {
    for (const [tier, tools] of this.tiers.entries()) {
      if (tools.includes(toolName)) {
        return tier;
      }
    }
    return null;
  }

  /**
   * Handle HTTP requests
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    try {
      switch (path) {
        case '/tier':
          const tier = parseInt(url.searchParams.get('tier') || '1');
          const tools = await this.getToolsForTier(tier);
          return Response.json({ tier, tools });
        
        case '/up-to-tier':
          const maxTier = parseInt(url.searchParams.get('max') || '1');
          const allTools = await this.getToolsUpToTier(maxTier);
          return Response.json({ maxTier, tools: allTools });
        
        case '/tool-tier':
          const toolName = url.searchParams.get('tool') || '';
          const toolTier = await this.getToolTier(toolName);
          return Response.json({ tool: toolName, tier: toolTier });
        
        case '/cleanup':
          await this.cleanup();
          return Response.json({ status: 'cleaned' });
        
        default:
          return new Response('Not found', { status: 404 });
      }
    } catch (error: any) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }
}
