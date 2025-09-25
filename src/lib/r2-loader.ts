/**
 * R2 Data Loader Module
 * Handles loading and caching of n8n node data from R2 buckets
 */

import { CacheManager } from './cache';

interface NodeData {
  nodeType: string;
  packageName: string;
  displayName: string;
  description?: string;
  category: string;
  propertiesEssential?: any;
  operations?: string[];
}

interface NodeMetadata {
  extractedAt: string;
  source: string;
  version: string;
  totalNodes: number;
}

interface NodesByCategory {
  [category: string]: NodeData[];
}

export class R2DataLoader {
  private memoryCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly MEMORY_CACHE_TTL = 60 * 1000;
  private cache: CacheManager;

  constructor(private env: any) {
    this.cache = new CacheManager(env);
  }

  private isMemoryCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setMemoryCache(key: string, data: any): void {
    this.memoryCache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.MEMORY_CACHE_TTL);
  }

  async loadNodesEssential(): Promise<NodeData[]> {
    const cacheKey = 'nodes:essential';
    
    if (this.isMemoryCacheValid(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }

    try {
      const kvData = await this.cache.get(cacheKey);
      if (kvData && Array.isArray(kvData)) {
        this.setMemoryCache(cacheKey, kvData);
        return kvData;
      }
    } catch (error) {
      console.warn('KV cache read failed:', error);
    }

    try {
      const object = await this.env.NODE_DOCS_BUCKET.get('nodes-essential.json');
      if (!object) {
        return this.getFallbackNodes();
      }

      const data = JSON.parse(await object.text());
      await this.cache.set(cacheKey, data);
      this.setMemoryCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to load from R2:', error);
      return this.getFallbackNodes();
    }
  }

  async loadNodesByCategory(): Promise<NodesByCategory> {
    const cacheKey = 'nodes:by-category';
    
    if (this.isMemoryCacheValid(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }

    try {
      const kvData = await this.cache.get(cacheKey);
      if (kvData && typeof kvData === 'object') {
        this.setMemoryCache(cacheKey, kvData);
        return kvData as NodesByCategory;
      }
    } catch (error) {
      console.warn('KV cache failed:', error);
    }

    try {
      const object = await this.env.NODE_DOCS_BUCKET.get('nodes-by-category.json');
      if (!object) return {};

      const data = JSON.parse(await object.text());
      await this.cache.set(cacheKey, data);
      this.setMemoryCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to load categories:', error);
      return {};
    }
  }

  async loadMetadata(): Promise<NodeMetadata | null> {
    const cacheKey = 'nodes:metadata';
    
    if (this.isMemoryCacheValid(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }

    try {
      const kvData = await this.cache.get(cacheKey);
      if (kvData && typeof kvData === 'object') {
        this.setMemoryCache(cacheKey, kvData);
        return kvData as NodeMetadata;
      }
    } catch (error) {
      console.warn('KV cache failed:', error);
    }

    try {
      const object = await this.env.NODE_DOCS_BUCKET.get('metadata.json');
      if (!object) return null;

      const data = JSON.parse(await object.text());
      await this.cache.set(cacheKey, data);
      this.setMemoryCache(cacheKey, data);
      return data;
    } catch (error) {
      return null;
    }
  }

  async searchNodes(query: string): Promise<NodeData[]> {
    const startTime = Date.now();
    const nodes = await this.loadNodesEssential();
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
      return nodes;
    }

    const results = nodes.filter(node => {
      const searchableText = [
        node.displayName,
        node.description || '',
        node.nodeType,
        node.category,
        node.packageName,
        ...(node.operations || [])
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchTerm);
    });

    const duration = Date.now() - startTime;
    if (duration > 12) {
      console.warn(`Search exceeded 12ms target (took ${duration}ms)`);
    }
    
    return results;
  }

  async getNodesByCategory(category: string): Promise<NodeData[]> {
    const nodesByCategory = await this.loadNodesByCategory();
    return nodesByCategory[category] || [];
  }

  async getCategories(): Promise<string[]> {
    const nodesByCategory = await this.loadNodesByCategory();
    return Object.keys(nodesByCategory);
  }

  private getFallbackNodes(): NodeData[] {
    return [
      {
        nodeType: "n8n-nodes-base.webhook",
        packageName: "n8n-nodes-base",
        displayName: "Webhook",
        description: "Starts the workflow when a webhook is called",
        category: "trigger"
      },
      {
        nodeType: "n8n-nodes-base.httpRequest",
        packageName: "n8n-nodes-base",
        displayName: "HTTP Request",
        description: "Makes HTTP requests and returns the result",
        category: "transform",
        operations: ["GET", "POST", "PUT", "DELETE"]
      },
      {
        nodeType: "n8n-nodes-base.code",
        packageName: "n8n-nodes-base",
        displayName: "Code",
        description: "Run custom JavaScript code",
        category: "transform"
      }
    ];
  }

  async clearCaches(): Promise<void> {
    this.memoryCache.clear();
    this.cacheExpiry.clear();
  }

  getCacheStats(): object {
    return {
      memoryCacheSize: this.memoryCache.size,
      memoryCacheKeys: Array.from(this.memoryCache.keys()),
      cacheExpiryEntries: this.cacheExpiry.size
    };
  }
}

export type { NodeData, NodeMetadata, NodesByCategory };
