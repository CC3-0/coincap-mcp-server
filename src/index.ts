#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js'

import express from 'express'
import cors from 'cors'
import { createMCPRouter, callToolFromStdio } from './mcpRouter.js'

import { loadSwaggerEndpoints, endpointMap } from './dynamicMcpTools.js'

class DynamicMCPServer {
  private server: Server

  constructor () {
    this.server = new Server(
      {
        name: 'cryptocurrency-mcp-server',
        version: '0.2.0'
      },
      {
        capabilities: { tools: {} }
      }
    )
  }

  async setup (): Promise<void> {
    await loadSwaggerEndpoints()

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Object.values(endpointMap).map(def => ({
        name: def.toolName,
        description: def.description,
        inputSchema: {
          type: 'object',
          properties: {} // not used for stdio mode
        }
      }))
    }))

    this.server.setRequestHandler(CallToolRequestSchema, async req => {
      const { name, arguments: args } = req.params
      return await callToolFromStdio(name, args)
    })
  }

  async run (): Promise<void> {
    await this.setup()

    const portArg = process.argv.find(arg => arg.startsWith('--port='))
    if (portArg) {
      const port = parseInt(portArg.split('=')[1])
      await this.startHttpServer(port)
    } else {
      const transport = new StdioServerTransport()
      await this.server.connect(transport)
      console.error(`🚀 MCP server ready via stdio`)
    }
  }

  private async startHttpServer (port: number): Promise<void> {
    const app = express()
    app.use(cors())
    app.use(express.json()) // Handles application/json (standard JSON POST)
    app.use(express.text({ type: 'text/plain' })) // Optional: for NDJSON or raw text, if you want to keep it

    app.use('/mcp', createMCPRouter())

    app.listen(port, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${port}/mcp`
      console.error(`🚀 Streamble http MCP server running at ${url}`)
    })
  }
}

if (require.main === module) {
  new DynamicMCPServer().run().catch(console.error)
}

export * from './mcpRouter'
