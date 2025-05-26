// tools/definitions.ts
export const API_TOOLS = [
  {
    name: 'get_assets',
    description: 'Retrieve a list of cryptocurrency assets with optional filters and pagination',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search by asset slug (bitcoin) or symbol (BTC)',
        },
        ids: {
          type: 'string',
          description: 'Comma-separated list of asset ids (aka slugs). e.g., bitcoin,ethereum,monero',
        },
        limit: {
          type: 'number',
          description: 'Number of results to return (default is 100)',
          default: 100,
        },
        offset: {
          type: 'number',
          description: 'Number of results to skip (default is 0)',
          default: 0,
        },
      },
    },
  },
  {
    name: 'get_asset',
    description: 'Retrieve details for a specific cryptocurrency asset by slug (id)',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'The slug of the asset to retrieve (e.g., bitcoin, ethereum)',
          required: true,
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'get_asset_markets',
    description: 'Retrieve market details for a specific cryptocurrency asset',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'The slug of the asset (e.g., bitcoin, ethereum)',
          required: true,
        },
        limit: {
          type: 'number',
          description: 'Number of results to return (default is 100)',
          default: 100,
        },
        offset: {
          type: 'number',
          description: 'Number of results to skip (default is 0)',
          default: 0,
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'get_asset_history',
    description: 'Retrieve historical price data for a specific cryptocurrency asset',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'The slug of the asset (e.g., bitcoin, ethereum)',
          required: true,
        },
        interval: {
          type: 'string',
          description: 'Time interval for historical data',
          enum: ['m1', 'm5', 'm15', 'm30', 'h1', 'h2', 'h6', 'h12', 'd1'],
          required: true,
        },
        start: {
          type: 'number',
          description: 'UNIX time in milliseconds for start of data range',
        },
        end: {
          type: 'number',
          description: 'UNIX time in milliseconds for end of data range',
        },
      },
      required: ['slug', 'interval'],
    },
  },
];