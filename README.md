# CoinCap MCP Server (clean)

A minimal Model Context Protocol (MCP) server that exposes CoinCap.io endpoints as tools.

## Prerequisites

* Node.js ≥ 18
* A CoinCap API key (grab one for free)

## Quick start

```bash
git clone <repo> coincap-mcp && cd coincap-mcp
cp .env.example .env          # paste your CoinCap API key
npm install
npm run build
node dist/index.js
```

Server starts on **http://localhost:7007**

## Test with cURL

```bash
# 1) initialize
curl -s localhost:7007 -H 'Content-Type: application/json' \
-d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"client":{"name":"curl","version":"0.1"},"capabilities":{}}}'

# 2) call get_assets
curl -s localhost:7007 -H 'Content-Type: application/json' \
-d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_assets","arguments":{"search":"bitcoin","limit":1}}}' | jq .
```
# coincap-mcp-v1
