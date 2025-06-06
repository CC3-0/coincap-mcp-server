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
        const properties: Record<string, any> = {
          apiKey: {
            type: 'string',
            description: 'CoinCap API key for authentication'
          }
        };

        for (const param of [...def.pathParams, ...def.queryParams]) {
          const prop: any = {
            type: param.type,
            description: param.description
          };
          if (param.enum?.length) {
            prop.enum = param.enum;
            prop.description += ` (valid values: ${param.enum.join(', ')})`;
          }
          if (param.example) {
            prop.example = param.example;
          }
          properties[param.name] = prop;
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
    const { name, arguments: args } = request.params;
    const def = endpointMap[name];

    if (!def) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true
      };
    }

    try {
      let url = def.path;

      for (const param of def.pathParams) {
        if (!args?.[param.name]) {
          throw new Error(`Missing required param: ${param.name}`);
        }
        url = url.replace(`{${param.name}}`, encodeURIComponent(args[param.name]));
      }

      const searchParams = new URLSearchParams();
      for (const param of def.queryParams) {
        if (args?.[param.name] !== undefined && param.name !== 'apiKey') {
          searchParams.append(param.name, String(args[param.name]));
        }
      }

      const apiKey = args?.apiKey;
      const fullUrl = `${API_BASE}${url}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      const finalUrl = apiKey
        ? `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}apiKey=${apiKey}`
        : fullUrl;

      const res = await axios.get(finalUrl);
      return {
        content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }]
      };
    } catch (err: any) {
      console.error(`[MCP] Error calling ${name}:`, err.message);
      return {
        content: [{ type: 'text', text: `❌ Error: ${err.message}` }],
        isError: true
      };
    }
  }

  
  async handleMCPRequest(request: any): Promise<any> {
    if (request.method === 'initialize') {
      await this.initialize();
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'cryptocurrency-mcp-server',
            version: '0.2.0'
          }
        }
      };
    } else if (request.method === 'tools/list') {
      const result = await this.listToolsHandler();
      return { jsonrpc: '2.0', id: request.id, result };
    } else if (request.method === 'tools/call') {
      const result = await this.callToolHandler({ params: request.params });
      return { jsonrpc: '2.0', id: request.id, result };
    } else if (request.method === 'ping') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {}
      };
    }
    else {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32601, message: `Method not found: ${request.method}` }
      };
    }
  }

  getRouter(): Router {
    const router = Router();

    // Health check endpoint
    router.get('/health', (_req, res) => {
      res.json({
        status: 'ok',
        server: 'cryptocurrency-mcp-server',
        version: '0.2.0'
      });
    });

    // Streamable HTTP MCP Inspector-compatible endpoint
    router.post('/', async (req: Request, res: Response) => {
      try {
        const body = typeof req.body === 'string'
          ? req.body
          : req.body?.toString?.() ?? '';

        const lines = body.split('\n').map((l: any) => l.trim()).filter(Boolean);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const response = await this.handleMCPRequest(parsed);
            res.write(JSON.stringify(response) + '\n');
          } catch {
            res.write(JSON.stringify({
              jsonrpc: '2.0',
              id: null,
              error: { code: -32700, message: 'Parse error' }
            }) + '\n');
          }
        }

        res.end();
      } catch (e: any) {
        console.error('[MCP] /mcp error:', e.message);
        res.status(500).end();
      }
    });

    router.options('/mcp', (_req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
      res.sendStatus(200);
    });

    return router;
  }
}

export function createMCPRouter(): Router {
  const service = new MCPRouterService();
  return service.getRouter();
}

export async function callToolFromStdio(name: string, args: any) {
  console.error(`[MCP] Tool call: ${name}`);
  console.error(`[MCP] Args:`, JSON.stringify(args, null, 2));
  const def = endpointMap[name];
  if (!def) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true
    };
  }

  try {
    let url = def.path;
    for (const param of def.pathParams) {
      if (!args?.[param.name]) {
        throw new Error(`Missing required param: ${param.name}`);
      }
      url = url.replace(`{${param.name}}`, encodeURIComponent(args[param.name]));
    }

    const searchParams = new URLSearchParams();
    for (const param of def.queryParams) {
      if (args?.[param.name] !== undefined && param.name !== 'apiKey') {
        searchParams.append(param.name, String(args[param.name]));
      }
    }

    const apiKey = args?.apiKey;
    const fullUrl = `${API_BASE}${url}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const finalUrl = apiKey
      ? `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}apiKey=${apiKey}`
      : fullUrl;

    const res = await axios.get(finalUrl);
    return {
      content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }]
    };
  } catch (err: any) {
    return {
      content: [{ type: 'text', text: `❌ Error: ${err.message}` }],
      isError: true
    };
  }
}