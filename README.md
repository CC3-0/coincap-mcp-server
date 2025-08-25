# CoinCap MCP Server

A Model Context Protocol (MCP) server that exposes the CoinCap.io api as tools. This server can run in multiple modes to integrate with different MCP clients including Claude Desktop and MCP Inspector.

## Features

- **Dynamic API Loading**: Automatically loads all available CoinCap endpoints from their Swagger specification
- **Multiple Transport Modes**: Works with stdio (Claude Desktop) or streamable HTTP (MCP Inspector)
- **Comprehensive Coverage**: Access to assets, markets, exchanges, technical analysis, conversion rates & everything else in the api https://pro.coincap.io/api-docs/

## Prerequisites

- Node.js ≥ 18
- Yarn package manager
- A CoinCap API key (get one free at https://pro.coincap.io)

## Installation

### Option 1: Using Claude Desktop Extension (.dxt) File

1. Download the latest built .dxt file here: https://github.com/CC3-0/coincap-mcp-server/raw/refs/heads/main/coincap-mcp-clean.dxt and open with claude desktop


### Option 2: Using npx

```bash
# Run directly without installation
npx coincap-mcp-server

# For HTTP mode
npx coincap-mcp-server --port=3001
```

### Option 3: Clone and Build

```bash
# Clone the repository
git clone https://github.com/CC3-0/coincap-mcp-server
cd coincap-mcp-server

# Install dependencies
yarn install

# Build the project
yarn build
```

## Usage

### Option 1: Claude Desktop Extension File

This is the easiest way to see the CoinCap MCP Server in action.

1. Download the latest built .dxt file here: https://github.com/CC3-0/coincap-mcp-server/raw/refs/heads/main/coincap-mcp-clean.dxt
2. Open it with Claude Desktop and set your CoinCap API key in the extension settings.

For more information on Claude Desktop Extenions see https://www.anthropic.com/engineering/desktop-extensions

### Option 2: Claude Desktop Integration (Stdio Mode)

This is the standard mode for integrating with Claude Desktop via stdio transport.

#### Setup Steps:

1. Build the project: `yarn build`
2. Configure Claude Desktop to use the built server
3. Set your CoinCap API key in the environment

#### Claude Desktop Configuration:

**Using npx (Recommended):**
```json
{
  "mcpServers": {
    "crypto-prices": {
      "command": "npx",
      "args": ["coincap-mcp-server"],
      "env": {
        "COINCAP_API_KEY": "your_coincap_api_key_here"
      }
    }
  }
}
```

**Using local build:**
```json
{
  "mcpServers": {
    "crypto-prices": {
      "command": "node",
      "args": ["/path/to/your/coincap-mcp-server/dist/index.js"],
      "env": {
        "COINCAP_API_KEY": "your_coincap_api_key_here"
      }
    }
  }
}
```

### Option 3: Remote Streamable HTTP

Run the server as an HTTP service for use with MCP Inspector or other HTTP-based MCP clients.

#### Starting the HTTP Server:

```bash
# Set your API key
export COINCAP_API_KEY="your_coincap_api_key_here"

# Start the HTTP server
yarn startRemote
```

This starts an HTTP server on `http://127.0.0.1:3001/mcp`

#### Using with MCP Inspector :

The MCP Inspector (https://github.com/modelcontextprotocol/inspector) allows you to Browse available tools & make calls.
```bash
# Start mcp inspector
npx @modelcontextprotocol/inspector

```

Visit the local mcp inspector in the browser, set mode to `streamable HTTP` mode, and url to `http://127.0.0.1:3001/mcp`

#### Curl examples:

**List Available Tools:**
```bash
curl -X POST http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

## Example Tool Call: Get Bitcoin Asset Details
```bash
curl -X POST http://127.0.0.1:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "assets_slug",
      "arguments": {
        "slug": "bitcoin",
        "apiKey": "your_coincap_api_key_here"
      }
    }
  }'
  ```

## Available Tools

The server dynamically loads tools from the CoinCap API specification, providing access to comprehensive cryptocurrency data and technical analysis. The exact tools available are loaded at runtime from the API's Swagger specification.

**Tool Categories Include:**
- **Asset Tools** - Cryptocurrency listings, details, historical data, and markets
- **Technical Analysis Tools** - RSI, SMA, EMA, MACD, VWAP, and candlestick data
- **Market & Exchange Tools** - Exchange listings, market data, and conversion rates

To see all available tools and their parameters, use the "List Available Tools" command above or connect via MCP Inspector.

## Development

```bash
# Install dependencies
yarn install

# Build the project
yarn build

# Start in stdio mode (default)
yarn start

# Start in HTTP mode on port 3001
yarn startRemote

# Development with auto-rebuild
yarn dev
```

### API Key Issues
- Ensure your `COINCAP_API_KEY` is properly set as an environment variable when used locally and passed in every tool call.
