import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';

import {
  loadSwaggerEndpoints,
  endpointMap,
  API_BASE,
  API_KEY,
} from './dynamicMcpTools.js';

import fetch from 'node-fetch';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';

class DynamicMCPServer {
  private server: Server;
  private listToolsHandler: any;
  private callToolHandler: any;

  constructor() {
    this.server = new Server(
      {
        name: 'cryptocurrency-mcp-server',
        version: '0.2.0',
      },
      {
        capabilities: { tools: {} },
      }
    );
  }

  async setup(): Promise<void> {
    await loadSwaggerEndpoints();

    this.listToolsHandler = async () => {
      return {
        tools: Object.values(endpointMap).map((def) => {
          const properties: Record<string, any> = {};

          for (const param of [...def.pathParams, ...def.queryParams]) {
            properties[param] = {
              type: 'string',
              description: `Query/path param: ${param}`,
            };
          }

          return {
            name: def.toolName,
            description: def.description,
            inputSchema: {
              type: 'object',
              properties,
              required: def.pathParams,
            },
          };
        }),
      };
    };

    this.callToolHandler = async (request: CallToolRequest) => {
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
        for (const p of def.pathParams) {
          if (!args || !args[p]) {
            throw new Error(`Missing required param: ${p}`);
          }
          url = url.replace(`{${p}}`, encodeURIComponent(args[p]));
        }

        const searchParams = new URLSearchParams();
        for (const qp of def.queryParams) {
          if (args && args[qp] !== undefined) {
            searchParams.append(qp, String(args[qp]));
          }
        }

        const fullUrl = `${API_BASE}${url}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
        const headers: Record<string, string> = API_KEY
          ? { Authorization: `Bearer ${API_KEY}` }
          : {};

        const res = await fetch(fullUrl, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const json = await res.json();

        return {
          content: [{ type: 'text', text: JSON.stringify(json, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `❌ Error: ${err.message}` }],
          isError: true,
        };
      }
    };

    // Set up the handlers for stdio mode
    this.server.setRequestHandler(ListToolsRequestSchema, this.listToolsHandler);
    this.server.setRequestHandler(CallToolRequestSchema, this.callToolHandler);
  }

  async run(): Promise<void> {
    await this.setup();
    
    // Check for port argument
    const portArg = process.argv.find(arg => arg.startsWith('--port='));
    
    if (portArg) {
      // Remote mode
      const port = parseInt(portArg.split('=')[1]);
      await this.startRemoteServer(port);
    } else {
      // Default stdio mode for Claude Desktop
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error(`🚀 MCP local server ready via stdio`);
    }
  }

  private async startRemoteServer(port: number): Promise<void> {
    const app = express();
    
    // Enable CORS for cross-origin requests
    app.use(cors());
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', server: 'cryptocurrency-mcp-server', version: '0.2.0' });
    });

    // MCP JSON-RPC endpoint - handle requests directly without transport
    app.post('/mcp', async (req: Request, res: Response) => {
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
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body?.id,
          error: { code: -32603, message: error.message }
        });
      }
    });

    app.listen(port, '0.0.0.0', () => {
      console.error(`🚀 MCP remote server ready on port ${port}`);
      console.error(`   Health check: http://localhost:${port}/health`);
      console.error(`   MCP endpoint: http://localhost:${port}/mcp`);
    });
  }
}

new DynamicMCPServer().run().catch(console.error);