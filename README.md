# CoinCap MCP Server

A Model Context Protocol (MCP) server that exposes CoinCap.io cryptocurrency endpoints as tools. This server can run in multiple modes to integrate with different MCP clients including Claude Desktop and MCP Inspector.

## Features

- **Dynamic API Loading**: Automatically loads all available CoinCap endpoints from their Swagger specification
- **Multiple Transport Modes**: Works with stdio (Claude Desktop) or HTTP (MCP Inspector)
- **Comprehensive Coverage**: Access to assets, markets, exchanges, technical analysis, and conversion rates
- **TypeScript**: Fully typed with robust error handling
- **Streamable HTTP**: Compatible with MCP Inspector's streaming protocol

## Prerequisites

- Node.js ≥ 18
- Yarn package manager
- A CoinCap API key (get one free at https://pro.coincap.io)

## Installation

### Option 1: Using npx

```bash
# Run directly without installation
npx @coincap/mcp-server

# For HTTP mode
COINCAP_API_KEY=your_key npx @coincap/mcp-server --port=3001
```

### Option 2: Clone and Build

```bash
# Clone the repository
git clone https://github.com/CC3-0/mcp-server
cd mcp-server

# Install dependencies
yarn install

# Build the project
yarn build
```

## Usage

### Option 1: Claude Desktop Integration (Stdio Mode)

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
      "args": ["@coincap/mcp-server"],
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
      "args": ["/path/to/your/mcp-server/dist/index.js"],
      "env": {
        "COINCAP_API_KEY": "your_coincap_api_key_here"
      }
    }
  }
}
```

#### macOS Specific Configuration:

You may need to specify the full Node.js path:

```json
{
  "mcpServers": {
    "crypto-prices": {
      "command": "/Users/username/.nvm/versions/node/v18.12.1/bin/node",
      "args": ["/Users/username/path/to/mcp-server/dist/index.js"],
      "env": {
        "COINCAP_API_KEY": "your_coincap_api_key_here"
      }
    }
  }
}
```

### Option 2: MCP Inspector Integration (HTTP Mode)

Run the server as an HTTP service for use with MCP Inspector or other HTTP-based MCP clients.

#### Starting the HTTP Server:

```bash
# Set your API key
export COINCAP_API_KEY="your_coincap_api_key_here"

# Start the HTTP server
yarn startRemote
```

This starts an HTTP server on `http://127.0.0.1:3001/mcp`

#### Using with MCP Inspector:

```bash
# Install MCP Inspector globally (if not already installed)
npm install -g @modelcontextprotocol/inspector

# Connect to your server
npx @modelcontextprotocol/inspector --server http://127.0.0.1:3001/mcp
```

The MCP Inspector will open in your browser and connect to your local server, allowing you to:
- Browse available tools
- Test tool calls interactively
- View real-time responses
- Debug your MCP server

#### Manual Testing via HTTP:

**Health Check:**
```bash
curl http://127.0.0.1:3001/mcp/health
```

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

## Available Tools

The server dynamically loads tools from the CoinCap API specification, providing access to comprehensive cryptocurrency data and technical analysis. The exact tools available are loaded at runtime from the API's Swagger specification.

**Tool Categories Include:**
- **Asset Tools** - Cryptocurrency listings, details, historical data, and markets
- **Technical Analysis Tools** - RSI, SMA, EMA, MACD, VWAP, and candlestick data
- **Market & Exchange Tools** - Exchange listings, market data, and conversion rates

**Common Parameters:**
- **`slug`** - Asset identifier (e.g., "bitcoin", "ethereum")
- **`limit`** - Number of results to return
- **`offset`** - Pagination offset
- **`interval`** - Time interval for historical data
- **`apiKey`** - Your CoinCap API key (optional, can use environment variable)

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

## Environment Variables

- **`COINCAP_API_KEY`** - Your CoinCap API key (required for authenticated endpoints and higher rate limits)

## Configuration

The server connects to CoinCap's production API:
- **API Base**: `https://rest.coincap.io`
- **Swagger Spec**: `https://rest.coincap.io/api-docs.json`

## Scripts

- **`yarn dev`** - Development mode with auto-rebuild
- **`yarn build`** - Build TypeScript to JavaScript
- **`yarn start`** - Run in stdio mode (for Claude Desktop)
- **`yarn startRemote`** - Run HTTP server on port 3001

## Troubleshooting

### Mixed Content Issues
If using MCP Inspector with HTTPS and your local server runs on HTTP, you may encounter mixed content security errors. Solutions:

1. **Use Chrome with disabled security (development only):**
   ```bash
   # macOS
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security --user-data-dir="/tmp/chrome_dev_session"
   
   # Windows
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="C:\temp\chrome_dev_session"
   
   # Linux
   google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev_session"
   ```

2. **Run MCP Inspector locally over HTTP**
3. **Use HTTPS for your MCP server** (production deployments)

### Node.js Path Issues
On macOS, you may need to specify the full Node.js path in Claude Desktop configuration rather than just `"node"`. Find your Node.js path with:
```bash
which node
# or for nvm users
which node
```

### API Key Issues
- Some endpoints work without an API key but have lower rate limits
- For full functionality, ensure your `COINCAP_API_KEY` is properly set
- The API key can be passed as a parameter to individual tool calls or set as an environment variable

### Port Conflicts
If port 3001 is in use, you can specify a different port:
```bash
node dist/index.js --port=3002
```

## API Documentation

For detailed information about available endpoints and parameters, refer to:
- [CoinCap API Documentation](https://docs.coincap.io/)
- The dynamically loaded Swagger specification at the API base URL

## Package Information

- **Name**: `@coincap/mcp-server`
- **Version**: `0.9.0`
- **Node.js**: ≥18
- **Main**: `dist/index.js`

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Build and test: `yarn build && yarn start`
5. Submit a pull request

## Support

For issues related to:
- **CoinCap API**: Check [CoinCap documentation](https://docs.coincap.io/)
- **MCP Protocol**: See [Model Context Protocol documentation](https://modelcontextprotocol.io/)
- **This server**: Open an issue in this repository