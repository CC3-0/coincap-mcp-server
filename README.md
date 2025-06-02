# CoinCap MCP Server

A minimal Model Context Protocol (MCP) server that exposes CoinCap.io endpoints as tools. Can run in two modes:
- **Local stdio mode** for Claude Desktop integration
- **Remote HTTP mode** for remote chatbot integration

## Prerequisites

* Node.js ≥ 18
* Yarn package manager
* A CoinCap API key (grab one for free at https://pro.coincap.io)

### Option 1: Claude Desktop Integration (Local)

This is the default mode that works with Claude Desktop via stdio transport.

#### Setup Steps:

1. Install [Claude Desktop], node 18+ & yarn
2. Install dependencies: `yarn`
3. Build the project: `yarn build`
4. Configure Claude Desktop to point at the built `dist/index.js` file
5. Set `COINCAP_API_KEY` environment variable in Claude Desktop config
6. Start Claude Desktop

#### Claude Desktop Configuration:

Add this to your Claude Desktop MCP configuration file:

```json
{
  "mcpServers": {
    "crypto-prices": {
      "command": "node",
      "args": ["/path/to/your/coincap-mcp/dist/index.js"],
      "env": {
          "COINCAP_API_KEY": "your_coincap_api_key_here"
      }
    }
  }
}
```

#### Known Issues (macOS):

You may need to point the "command" to a specific Node.js version:

```json
{
  "mcpServers": {
    "crypto-prices": {
      "command": "/Users/username/.nvm/versions/node/v18.12.1/bin/node",
      "args": ["/Users/username/Downloads/coincap-mcp/dist/index.js"],
      "env": {
          "COINCAP_API_KEY": "your_coincap_api_key_here"
      }
    }
  }
}
```

### Option 2: Remote HTTP Server (For Chatbots/APIs)

Start the server in remote mode to expose the same functionality via HTTP endpoints.

#### Starting the Remote Server:

```bash
# Set your API key
export COINCAP_API_KEY="your_coincap_api_key_here"

# Start the remote server
yarn startRemote
```

This starts an HTTP server on `localhost:3001` with the following endpoints:
- `GET /health` - Health check
- `POST /mcp` - MCP JSON-RPC endpoint

#### Testing the Remote Server:

**Health Check:**
```bash
curl http://localhost:3001/health
```

**List Available Tools:**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

**Get Bitcoin Price:**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "assets_slug",
      "arguments": {
        "slug": "bitcoin"
      }
    }
  }'
```

**Get Top 10 Cryptocurrencies:**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "assets",
      "arguments": {
        "limit": "10"
      }
    }
  }'
```

**Get Bitcoin Technical Analysis (RSI):**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "ta_slug_rsi_latest",
      "arguments": {
        "slug": "bitcoin"
      }
    }
  }'
```

## Available Tools

The server dynamically loads tools from the CoinCap API swagger specification, including:

**Asset Tools:**
- `assets` - List cryptocurrencies
- `assets_slug` - Get specific asset details
- `assets_slug_history` - Get historical price data
- `assets_slug_markets` - Get asset markets

**Technical Analysis Tools:**
- `ta_slug_allLatest` - All latest indicators
- `ta_slug_rsi_latest` - RSI indicator
- `ta_slug_sma_latest` - Simple Moving Average
- `ta_slug_macd_latest` - MACD indicator
- `ta_slug_vwap_latest` - Volume Weighted Average Price

**Market Tools:**
- `exchanges` - List exchanges
- `exchanges_exchange` - Get exchange details
- `markets` - List markets
- `rates` - Get conversion rates

## Development

```bash
# Install dependencies
yarn

# Build the project
yarn build

# Start in local mode (default)
yarn start

# Start in remote mode
yarn startRemote

# Development with auto-rebuild
yarn dev
```

## Environment Variables

- `COINCAP_API_KEY` - Your CoinCap API key (required for some endpoints)
