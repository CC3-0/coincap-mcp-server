# CoinCap MCP Server

A minimal Model Context Protocol (MCP) server that exposes CoinCap.io endpoints as tools via local stdio mcp.

## Prerequisites

* Node.js ≥ 18
* A CoinCap API key (grab one for free at https://pro.coincap.io)

## Quick start using Claude Desktop

0) install [Claude Desktop], node 18+ & yarn.
1) yarn
2) yarn build
3) point claude desktop config at built `dist/index.js` file
4) set COINCAP_API_KEY environment variable in claude desktop config
4) start claude desktop

## Known issues (Mac Os X)

I had to point the "command" in my claude config to a specific version of node for it to work (node 18). For example:

```
{
  "mcpServers": {
    "crypto-prices": {
      "command": "/Users/seanluther/.nvm/versions/node/v18.12.1/bin/node",
      "args": ["/Users/seanluther/Downloads/coincap-mcp-clean/dist/index.js"],
      "env": {
          "COINCAP_API_KEY": "your_coincap_api_key_here"
      }
    }
  }
}
```
