import axios from 'axios';

export const SWAGGER_URL = 'https://rest.staging.wagmi.productions/api-docs.json';
export const API_BASE = 'https://rest.staging.wagmi.productions';

export type ParameterDetail = {
  name: string;
  type: string;
  description: string;
  required: boolean;
  enum: string[] | null;
  example: any;
};

export type EndpointDef = {
  toolName: string;
  description: string;
  path: string;
  pathParams: ParameterDetail[];
  queryParams: ParameterDetail[];
};

export const endpointMap: Record<string, EndpointDef> = {};

export async function loadSwaggerEndpoints(): Promise<void> {
  const res = await axios.get(SWAGGER_URL);
  const spec: any = res.data;

  for (const [path, methods] of Object.entries(spec.paths)) {
    if (path.includes('{}')) {
     console.error(`[Swagger] ❌ Invalid path: ${path}`);
  }
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
      .map((p: any) => ({
        name: p.name,
        type: p.schema?.type || 'string',
        description: p.description || `Path parameter: ${p.name}`,
        required: p.required !== false,
        enum: p.schema?.enum || null,
        example: p.example || p.schema?.example || null
      }));

    const queryParams = parameters
      .filter((p: any) => p.in === 'query')
      .map((p: any) => ({
        name: p.name,
        type: p.schema?.type || 'string',
        description: p.description || `Query parameter: ${p.name}`,
        required: p.required === true,
        enum: p.schema?.enum || null,
        example: p.example || p.schema?.example || null
      }));

    endpointMap[toolName] = {
      toolName,
      description: getOp.summary || `Tool for ${path}`,
      path,
      pathParams,
      queryParams
    };
  }

  console.error(`[MCP] Swagger parsed, ${Object.keys(endpointMap).length} tools loaded.`);
  
  // Debug: Log tools with enums
  Object.values(endpointMap).forEach((tool: any) => {
    const paramsWithEnums = [...tool.pathParams, ...tool.queryParams].filter((p: any) => p.enum);
    if (paramsWithEnums.length > 0) {
      console.error(`[MCP] Tool ${tool.toolName} has enum params:`, 
        paramsWithEnums.map((p: any) => `${p.name}: [${p.enum.join(',')}]`).join(', ')
      );
    }
  });
}