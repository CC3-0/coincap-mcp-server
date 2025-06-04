#!/usr/bin/env node

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
} from './dynamicMcpTools.js';

import express from 'express';
import cors from 'cors';
import { createMCPRouter } from './mcpRouter.js';
import axios from 'axios';

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


          properties.apiKey = {
            type: 'string',
            description: 'CoinCap API key for authentication'
          };

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
        
        // ✅ FIXED: Handle path parameters as objects
        for (const param of def.pathParams) {
          if (!args || !args[param.name]) {
            throw new Error(`Missing required param: ${param.name}`);
          }
          url = url.replace(`{${param.name}}`, encodeURIComponent(args[param.name]));
        }

        // ✅ FIXED: Handle query parameters as objects
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

        console.error(`[MCP] Calling ${finalUrl.replace(apiKey || '', 'API_KEY_HIDDEN')} with ${apiKey ? 'provided' : 'no'} API key`);

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
    };

    // Set up the handlers for stdio mode - KEEP ALL MCP FUNCTIONALITY
    this.server.setRequestHandler(ListToolsRequestSchema, this.listToolsHandler);
    this.server.setRequestHandler(CallToolRequestSchema, this.callToolHandler);
  }

  async run(): Promise<void> {
    await this.setup();
    
    // Check for port argument
    const portArg = process.argv.find(arg => arg.startsWith('--port='));
    
    if (portArg) {
      // Remote mode using the reusable router
      const port = parseInt(portArg.split('=')[1]);
      await this.startRemoteServer(port);
    } else {
      // Default stdio mode for Claude Desktop - FULL MCP FUNCTIONALITY
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

    // Use the reusable MCP router
    const mcpRouter = createMCPRouter();

    // Also expose at root for backwards compatibility
    app.use('/', mcpRouter);

    app.listen(port, '127.0.0.1', () => {
      console.error(`🚀 MCP remote server ready on port ${port}`);
      console.error(`   Health check: http://localhost:${port}/health`);
      console.error(`   MCP root endpoint: http://localhost:${port}/`);
    });
  }
}

// Only run if this file is executed directly
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  new DynamicMCPServer().run().catch(console.error);
}

export { createMCPRouter };
export default DynamicMCPServer;