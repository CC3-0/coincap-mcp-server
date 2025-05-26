// ==============================================
// FILE 1: crypto-handlers.js (FIXED VERSION)
// ==============================================
// This is a SEPARATE file that contains all your handler functions

export const API_BASE_URL = 'https://rest.coincap.io/v3';
export const API_KEY = process.env.COINCAP_API_KEY || '';

// Helper function to add API key to URLs
function addApiKey(url: any) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}apiKey=${API_KEY}`;
}

// ASSETS HANDLERS
async function handleGetAssets(params: any) {
  try {
    const { ids, limit = 100, offset = 0, search } = params || {};
    
    let url = `${API_BASE_URL}/assets?`;
    const queryParams = [];
    
    if (ids) queryParams.push(`ids=${encodeURIComponent(ids)}`);
    if (limit) queryParams.push(`limit=${limit}`);
    if (offset) queryParams.push(`offset=${offset}`);
    if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
    
    url += queryParams.join('&');
    url = addApiKey(url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    return { error: error.message };
  }
}

async function handleGetAsset(params: any) {
  try {
    const { slug } = params;
    if (!slug) {
      throw new Error('Asset slug is required');
    }
    
    let url = `${API_BASE_URL}/assets/${encodeURIComponent(slug)}`;
    url = addApiKey(url);
    
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Asset not found');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    return { error: error.message };
  }
}

async function handleGetAssetMarkets(params: any) {
  try {
    const { slug, limit = 100, offset = 0 } = params;
    if (!slug) {
      throw new Error('Asset slug is required');
    }
    
    let url = `${API_BASE_URL}/assets/${encodeURIComponent(slug)}/markets?limit=${limit}&offset=${offset}`;
    url = addApiKey(url);
    
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Asset not found');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    return { error: error.message };
  }
}

async function handleGetAssetHistory(params: any) {
  try {
    const { slug, interval, start, end } = params;
    if (!slug || !interval) {
      throw new Error('Asset slug and interval are required');
    }
    
    let url = `${API_BASE_URL}/assets/${encodeURIComponent(slug)}/history?interval=${interval}`;
    if (start) url += `&start=${start}`;
    if (end) url += `&end=${end}`;
    url = addApiKey(url);
    
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Asset not found');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    return { error: error.message };
  }
}

// RATES HANDLERS
async function handleGetRates(params: any) {
  try {
    const { ids } = params || {};
    
    let url = `${API_BASE_URL}/rates`;
    if (ids) {
      url += `?ids=${encodeURIComponent(ids)}`;
    }
    url = addApiKey(url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    return { error: error.message };
  }
}

async function handleGetRate(params: any) {
  try {
    const { slug } = params;
    if (!slug) {
      throw new Error('Rate slug is required');
    }
    
    let url = `${API_BASE_URL}/rates/${encodeURIComponent(slug)}`;
    url = addApiKey(url);
    
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Conversion rate not found');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    return { error: error.message };
  }
}

// EXCHANGES HANDLERS
async function handleGetExchanges(params: any) {
  try {
    const { limit = 10, offset = 0 } = params || {};
    
    let url = `${API_BASE_URL}/exchanges?limit=${limit}&offset=${offset}`;
    url = addApiKey(url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    return { error: error.message };
  }
}

async function handleGetExchange(params: any) {
  try {
    const { exchangeId } = params;
    if (!exchangeId) {
      throw new Error('Exchange ID is required');
    }
    
    let url = `${API_BASE_URL}/exchanges/${encodeURIComponent(exchangeId)}`;
    url = addApiKey(url);
    
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Exchange not found');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    return { error: error.message };
  }
}

// MARKETS HANDLERS
async function handleGetMarkets(params: any) {
  try {
    const { 
      exchangeId, 
      baseSymbol, 
      baseId, 
      quoteSymbol, 
      quoteId, 
      assetSymbol, 
      assetId, 
      limit = 100, 
      offset = 0 
    } = params || {};
    
    let url = `${API_BASE_URL}/markets?`;
    const queryParams = [];
    
    if (exchangeId) queryParams.push(`exchangeId=${encodeURIComponent(exchangeId)}`);
    if (baseSymbol) queryParams.push(`baseSymbol=${encodeURIComponent(baseSymbol)}`);
    if (baseId) queryParams.push(`baseId=${encodeURIComponent(baseId)}`);
    if (quoteSymbol) queryParams.push(`quoteSymbol=${encodeURIComponent(quoteSymbol)}`);
    if (quoteId) queryParams.push(`quoteId=${encodeURIComponent(quoteId)}`);
    if (assetSymbol) queryParams.push(`assetSymbol=${encodeURIComponent(assetSymbol)}`);
    if (assetId) queryParams.push(`assetId=${encodeURIComponent(assetId)}`);
    queryParams.push(`limit=${limit}`);
    queryParams.push(`offset=${offset}`);
    
    url += queryParams.join('&');
    url = addApiKey(url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    return { error: error.message };
  }
}

// THIS EXPORT GOES AT THE END OF crypto-handlers.js
export {
  // Assets
  handleGetAssets,
  handleGetAsset,
  handleGetAssetMarkets,
  handleGetAssetHistory,
  // Rates
  handleGetRates,
  handleGetRate,
  // Exchanges
  handleGetExchanges,
  handleGetExchange,
  // Markets
  handleGetMarkets
};