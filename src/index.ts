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

class DynamicMCPServer {
  private server: Server;

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

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
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
    });
  }

  async run(): Promise<void> {
    await this.setup();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`🚀 MCP local server ready via stdio`);
  }
}

new DynamicMCPServer().run().catch(console.error);
