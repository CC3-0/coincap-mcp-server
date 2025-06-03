

// ===== mcpRouter.js (COMPLETE FILE) =====
import { Router, Request, Response } from 'express';
import {
  loadSwaggerEndpoints,
  endpointMap,
  API_BASE,
} from './dynamicMcpTools.js';
import axios from 'axios';

class MCPRouterService {
  private initialized = false;

  constructor() {}

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await loadSwaggerEndpoints();
    this.initialized = true;
  }

  private async listToolsHandler() {
    await this.initialize();
    return {
      tools: Object.values(endpointMap).map((def) => {
        const properties: Record<string, any> = {};

        // Add API key parameter
        properties.apiKey = {
          type: 'string',
          description: 'CoinCap API key for authentication'
        };

        // Add path parameters with complete details
        for (const param of def.pathParams) {
          const property: any = {
            type: param.type,
            description: param.description
          };
          
          if (param.enum && param.enum.length > 0) {
            property.enum = param.enum;
            property.description += ` (valid values: ${param.enum.join(', ')})`;
          }
          
          if (param.example) {
            property.example = param.example;
          }
          
          properties[param.name] = property;
        }

        // Add query parameters with complete details
        for (const param of def.queryParams) {
          const property: any = {
            type: param.type,
            description: param.description
          };
          
          if (param.enum && param.enum.length > 0) {
            property.enum = param.enum;
            property.description += ` (valid values: ${param.enum.join(', ')})`;
          }
          
          if (param.example) {
            property.example = param.example;
          }
          
          properties[param.name] = property;
        }

        return {
          name: def.toolName,
          description: def.description,
          inputSchema: {
            type: 'object',
            properties,
            required: [
              ...def.pathParams.filter(p => p.required).map(p => p.name),
              ...def.queryParams.filter(p => p.required).map(p => p.name)
            ]
          },
        };
      }),
    };
  }

  private async callToolHandler(request: any) {
    await this.initialize();
    const { name, arguments: args } = request.params as any
    const def = endpointMap[name];

    if (!def) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    try {
      let url = def.path;
      
      // Handle path parameters
      for (const param of def.pathParams) {
        if (!args || !args[param.name]) {
          throw new Error(`Missing required param: ${param.name}`);
        }
        url = url.replace(`{${param.name}}`, encodeURIComponent(args[param.name]));
      }

      // Handle query parameters
      const searchParams = new URLSearchParams();
      for (const param of def.queryParams) {
        if (args && args[param.name] !== undefined && param.name !== 'apiKey') {
          searchParams.append(param.name, String(args[param.name]));
        }
      }

      // Extract API key from function arguments
      const apiKey = args?.apiKey;
      
      const fullUrl = `${API_BASE}${url}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      
      // CoinCap uses query parameter for API key, not Authorization header
      const finalUrl = apiKey 
        ? `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}apiKey=${apiKey}`
        : fullUrl;

      console.log('finalUrl', finalUrl);

      const res = await axios.get(finalUrl);
      const json = res.data;

      return {
        content: [{ type: 'text', text: JSON.stringify(json, null, 2) }],
      };
    } catch (err: any) {
      console.error(`[MCP] Error calling ${name}:`, err.message);
      return {
        content: [{ type: 'text', text: `❌ Error: ${err.message}` }],
        isError: true,
      };
    }
  }

  getRouter(): Router {
    const router = Router();

    // Health check endpoint
    router.get('/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'ok', 
        server: 'cryptocurrency-mcp-server', 
        version: '0.2.0',
        features: ['per-call-api-keys', 'dynamic-swagger-tools']
      });
    });

    // MCP JSON-RPC endpoint
    router.post('/', async (req: Request, res: Response) => {
      try {
        const request = req.body;
        
        if (request.method === 'tools/list') {
          const response = await this.listToolsHandler();
          res.json({
            jsonrpc: '2.0',
            id: request.id,
            result: response
          });
        } else if (request.method === 'tools/call') {
          const response = await this.callToolHandler({ 
            method: 'tools/call', 
            params: request.params 
          });
          res.json({
            jsonrpc: '2.0',
            id: request.id,
            result: response
          });
        } else {
          res.status(400).json({
            jsonrpc: '2.0',
            id: request.id,
            error: { code: -32601, message: 'Method not found' }
          });
        }
      } catch (error: any) {
        console.error('[MCP] Router error:', error.message);
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body?.id,
          error: { code: -32603, message: error.message }
        });
      }
    });

    return router;
  }
}

// Export a factory function for easy integration
export function createMCPRouter(): Router {
  const service = new MCPRouterService();
  return service.getRouter();
}

// Export the service class for advanced usage
export { MCPRouterService };