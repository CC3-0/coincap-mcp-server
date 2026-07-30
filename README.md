# CoinCap MCP Server

A Model Context Protocol (MCP) server that exposes the CoinCap.io api as tools. This server can run in multiple modes to integrate with different MCP clients including Claude Desktop and MCP Inspector.

## Features

- **Dynamic API Loading**: Automatically loads all available CoinCap endpoints from their Swagger specification
- **Multiple Transport Modes**: Works with stdio (Claude Desktop) or streamable HTTP (MCP Inspector)
- **Comprehensive Coverage**: Access to assets, markets, exchanges, technical analysis, conversion rates & everything else in the api https://pro.coincap.io/api-docs/

## Prerequisites

- Node.js ≥ 18
- Yarn package manager
- Auth, either of:
  - A CoinCap API key (get one free at https://pro.coincap.io), **or**
  - An x402 wallet — an EVM private key holding USDC on Base — for keyless pay-per-call access to the `agentFriendly` tools (see [Keyless x402 payments](#keyless-x402-payments))

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

## Keyless x402 payments

The 10 `agentFriendly` tools can be used **without a CoinCap account**: set
`X402_PRIVATE_KEY` to an EVM private key whose wallet holds USDC on Base, and
the server pays per call ($0.002–$0.01 USDC) via the
[x402 protocol](https://x402.gitbook.io/x402). Payment is signed off-chain
(EIP-3009) — the wallet needs **no ETH for gas**, only USDC.

```json
{
  "mcpServers": {
    "crypto-prices": {
      "command": "npx",
      "args": ["coincap-mcp-server"],
      "env": {
        "X402_PRIVATE_KEY": "0x_your_wallet_private_key"
      }
    }
  }
}
```

Notes:

- **Use a dedicated, low-balance wallet.** Fund it with a few dollars of USDC on Base — never reuse a wallet holding significant funds.
- Per-call spend is capped at 100000 atomic USDC ($0.10) regardless of what a server asks for; override with `X402_MAX_PAYMENT_ATOMIC_USDC`.
- If both `COINCAP_API_KEY` and `X402_PRIVATE_KEY` are set, the API key is used (no payment is made).
- Non-`agentFriendly` tools always require an API key.

## Usage

### Option 1: Claude Desktop Extension File

This is the easiest way to use the CoinCap MCP Server. Requires the Claude Desktop app.

1. Download the latest built Desktop Extension file here: https://github.com/CC3-0/coincap-mcp-server/raw/refs/heads/main/coincap-mcp-clean.dxt
2. Locate the ‘coincap-mcp-clean.dxt file on your computer and right-click on the file.
3. Select: Open With > Claude
4. In the Preview popup within Claude Desktop, click the 'install' button
<img width="738" height="233" alt="Screenshot 2025-09-10 at 2 02 14 PM" src="https://github.com/user-attachments/assets/4118db55-89ae-4c52-9b2b-5a01a9641808" />


5. This will open a Configuration popup. In the 'CoinCap API Key' field, paste in your CoinCap API key. **(If you do not already have a CoinCap API key, you can get one by creating a free CoinCap Pro account here: https://pro.coincap.io/dashboard)**
<img width="534" height="370" alt="Screenshot 2025-09-10 at 2 02 26 PM" src="https://github.com/user-attachments/assets/bc4a7068-ae9e-43e4-ab41-534b66999526" />


7. You do not need to change anything in the 'Node.js Executable Path' field.
8. Click 'Save' at the bottom of the configuration popup
9. On the Extension preview popup, enable the MCP server by switching the toggle from 'disabled' to 'enabled'.
<img width="693" height="79" alt="Screenshot 2025-09-10 at 2 02 40 PM" src="https://github.com/user-attachments/assets/43155251-cbb0-4f4e-98e5-cb1736aeed23" />


10. Close the preview popup and start a new chat.
11. Click the 'Search and tools' button in the chat text box to verify that the CoinCap MCP is installed and enabled properly.
<img width="703" height="487" alt="Screenshot 2025-09-10 at 2 03 13 PM" src="https://github.com/user-attachments/assets/3aaff85c-0168-4801-89ae-fdceb0b6909d" />


12. You're ready to access CoinCap's crypto market data through Claude Desktop!

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
