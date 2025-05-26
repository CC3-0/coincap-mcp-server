// ==========================================
// main.ts - Fixed TypeScript MCP Server Main File
// ==========================================

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';

// Import handlers
import {
  handleGetAssets,
  handleGetAsset,
  handleGetAssetMarkets,
  handleGetAssetHistory,
  handleGetRates,
  handleGetRate,
  handleGetExchanges,
  handleGetExchange,
  handleGetMarkets
} from './crypto-handlers.js';

class CryptocurrencyMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'cryptocurrency-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List all available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // ASSETS TOOLS
          {
            name: 'get_assets',
            description: 'Retrieve a list of cryptocurrency assets with optional filters and pagination',
            inputSchema: {
              type: 'object',
              properties: {
                ids: {
                  type: 'string',
                  description: 'Comma-separated list of asset ids (aka slugs). e.g., bitcoin,ethereum,monero'
                },
                limit: {
                  type: 'number',
                  default: 100,
                  description: 'Number of results to return (default is 100)'
                },
                offset: {
                  type: 'number',
                  default: 0,
                  description: 'Number of results to skip (default is 0)'
                },
                search: {
                  type: 'string',
                  description: 'Search by asset slug (bitcoin) or symbol (BTC)'
                }
              }
            }
          },
          {
            name: 'get_asset',
            description: 'Retrieve details for a specific cryptocurrency asset by slug (id)',
            inputSchema: {
              type: 'object',
              properties: {
                slug: {
                  type: 'string',
                  description: 'The slug of the asset to retrieve (e.g., bitcoin, ethereum)'
                }
              },
              required: ['slug']
            }
          },
          {
            name: 'get_asset_markets',
            description: 'Retrieve market details for a specific cryptocurrency asset',
            inputSchema: {
              type: 'object',
              properties: {
                slug: {
                  type: 'string',
                  description: 'The slug of the asset (e.g., bitcoin, ethereum)'
                },
                limit: {
                  type: 'number',
                  default: 100,
                  description: 'Number of results to return (default is 100)'
                },
                offset: {
                  type: 'number',
                  default: 0,
                  description: 'Number of results to skip (default is 0)'
                }
              },
              required: ['slug']
            }
          },
          {
            name: 'get_asset_history',
            description: 'Retrieve historical price data for a specific cryptocurrency asset',
            inputSchema: {
              type: 'object',
              properties: {
                slug: {
                  type: 'string',
                  description: 'The slug of the asset (e.g., bitcoin, ethereum)'
                },
                interval: {
                  type: 'string',
                  enum: ['m1', 'm5', 'm15', 'm30', 'h1', 'h2', 'h6', 'h12', 'd1'],
                  description: 'Time interval for historical data'
                },
                start: {
                  type: 'number',
                  description: 'UNIX time in milliseconds for start of data range'
                },
                end: {
                  type: 'number',
                  description: 'UNIX time in milliseconds for end of data range'
                }
              },
              required: ['slug', 'interval']
            }
          },
          
          // RATES TOOLS
          {
            name: 'get_rates',
            description: 'Retrieve conversion rates for cryptocurrencies and fiat currencies',
            inputSchema: {
              type: 'object',
              properties: {
                ids: {
                  type: 'string',
                  description: 'Comma-separated list of rate IDs to filter by (e.g., bitcoin,ethereum,usd)'
                }
              }
            }
          },
          {
            name: 'get_rate',
            description: 'Retrieve details for a specific conversion rate by slug',
            inputSchema: {
              type: 'object',
              properties: {
                slug: {
                  type: 'string',
                  description: 'The slug of the conversion rate to retrieve (e.g., bitcoin, ethereum, usd)'
                }
              },
              required: ['slug']
            }
          },
          
          // EXCHANGES TOOLS
          {
            name: 'get_exchanges',
            description: 'Retrieve a list of cryptocurrency exchanges with trading volume and market data',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  default: 10,
                  description: 'Number of results to return (default is 10)'
                },
                offset: {
                  type: 'number',
                  default: 0,
                  description: 'Number of results to skip (default is 0)'
                }
              }
            }
          },
          {
            name: 'get_exchange',
            description: 'Retrieve details for a specific cryptocurrency exchange by ID',
            inputSchema: {
              type: 'object',
              properties: {
                exchangeId: {
                  type: 'string',
                  description: 'The ID of the exchange to retrieve (e.g., binanceus, coinbase-pro)'
                }
              },
              required: ['exchangeId']
            }
          },
          
          // MARKETS TOOLS
          {
            name: 'get_markets',
            description: 'Retrieve a list of trading markets with pricing and volume data across exchanges',
            inputSchema: {
              type: 'object',
              properties: {
                exchangeId: {
                  type: 'string',
                  description: 'Filter by exchange ID (e.g., binanceus, coinbase-pro)'
                },
                baseSymbol: {
                  type: 'string',
                  description: 'Filter by base asset symbol (e.g., BTC, ETH)'
                },
                baseId: {
                  type: 'string',
                  description: 'Filter by base asset ID (e.g., bitcoin, ethereum)'
                },
                quoteSymbol: {
                  type: 'string',
                  description: 'Filter by quote asset symbol (e.g., USD, USDT)'
                },
                quoteId: {
                  type: 'string',
                  description: 'Filter by quote asset ID (e.g., united-states-dollar, tether)'
                },
                assetSymbol: {
                  type: 'string',
                  description: 'Filter by asset symbol (matches base or quote)'
                },
                assetId: {
                  type: 'string',
                  description: 'Filter by asset ID (matches base or quote)'
                },
                limit: {
                  type: 'number',
                  default: 100,
                  description: 'Number of results to return (default is 100)'
                },
                offset: {
                  type: 'number',
                  default: 0,
                  description: 'Number of results to skip (default is 0)'
                }
              }
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Assets
          case 'get_assets':
            return { content: [{ type: 'text', text: JSON.stringify(await handleGetAssets(args), null, 2) }] };
          case 'get_asset':
            return { content: [{ type: 'text', text: JSON.stringify(await handleGetAsset(args), null, 2) }] };
          case 'get_asset_markets':
            return { content: [{ type: 'text', text: JSON.stringify(await handleGetAssetMarkets(args), null, 2) }] };
          case 'get_asset_history':
            return { content: [{ type: 'text', text: JSON.stringify(await handleGetAssetHistory(args), null, 2) }] };
          
          // Rates
          case 'get_rates':
            return { content: [{ type: 'text', text: JSON.stringify(await handleGetRates(args), null, 2) }] };
          case 'get_rate':
            return { content: [{ type: 'text', text: JSON.stringify(await handleGetRate(args), null, 2) }] };
          
          // Exchanges
          case 'get_exchanges':
            return { content: [{ type: 'text', text: JSON.stringify(await handleGetExchanges(args), null, 2) }] };
          case 'get_exchange':
            return { content: [{ type: 'text', text: JSON.stringify(await handleGetExchange(args), null, 2) }] };
          
          // Markets
          case 'get_markets':
            return { content: [{ type: 'text', text: JSON.stringify(await handleGetMarkets(args), null, 2) }] };
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text', text: `Error: ${errorMessage}` }],
          isError: true
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Cryptocurrency MCP server running on stdio');
  }
}

const server = new CryptocurrencyMCPServer();
server.run().catch(console.error);