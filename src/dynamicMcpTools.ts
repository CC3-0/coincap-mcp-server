// dynamicMcpTools.ts

import fetch from 'node-fetch';

export const SWAGGER_URL = 'https://rest.staging.wagmi.productions/api-docs.json';
export const API_BASE = 'https://rest.staging.wagmi.productions';
export const API_KEY = process.env.COINCAP_API_KEY || '';

export type EndpointDef = {
  toolName: string;
  description: string;
  path: string;
  pathParams: string[];
  queryParams: string[];
};

export const endpointMap: Record<string, EndpointDef> = {};

export async function loadSwaggerEndpoints(): Promise<void> {
  const res = await fetch(SWAGGER_URL);
  if (!res.ok) throw new Error(`Failed to load Swagger spec: ${res.statusText}`);
  const spec: any = await res.json();

  for (const [path, methods] of Object.entries(spec.paths)) {
    const getOp = (methods as any).get;
    if (!getOp) continue;

    const toolName = path
      .replace(/^\/v3\//, '')
      .replace(/\//g, '_')
      .replace(/{/g, '')
      .replace(/}/g, '');

    const parameters = getOp.parameters || [];

    const pathParams = parameters
      .filter((p: any) => p.in === 'path')
      .map((p: any) => p.name);

    const queryParams = parameters
      .filter((p: any) => p.in === 'query')
      .map((p: any) => p.name);

    endpointMap[toolName] = {
      toolName,
      description: getOp.summary || `Tool for ${path}`,
      path,
      pathParams,
      queryParams
    };
  }

  console.error(`[MCP] Swagger parsed, ${Object.keys(endpointMap).length} tools loaded.`);
}
