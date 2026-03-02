import axios from 'axios'

export const SWAGGER_URL =
  'https://rest.coincap.io/api-docs.json'
export const API_BASE = 'https://rest.coincap.io/v3'

export type ParameterDetail = {
  name: string
  type: string
  description: string
  required: boolean
  enum: string[] | null
  example: any
}

export type BodyParamDetail = {
  name: string
  type: string
  description: string
  required: boolean
}

export type EndpointDef = {
  toolName: string
  description: string
  path: string
  method: 'get' | 'post'
  pathParams: ParameterDetail[]
  queryParams: ParameterDetail[]
  bodyParams: BodyParamDetail[]
}

export const endpointMap: Record<string, EndpointDef> = {}

export async function loadSwaggerEndpoints (): Promise<void> {
  const res = await axios.get(SWAGGER_URL)
  const spec: any = res.data

  const supportedMethods = ['get', 'post'] as const

  for (const [path, methods] of Object.entries(spec.paths)) {
    if (path.includes('{}')) {
      console.error(`[Swagger] ❌ Invalid path: ${path}`)
    }

    for (const method of supportedMethods) {
      const op = (methods as any)[method]
      if (!op) continue

      const toolName = path
        .replace(/^\/v3\//, '')
        .replace(/^\//, '')
        .replace(/\//g, '_')
        .replace(/{/g, '')
        .replace(/}/g, '')
      const uniqueName = method === 'get' ? toolName : `${method}_${toolName}`

      const parameters = op.parameters || []

      const pathParams = parameters
        .filter((p: any) => p.in === 'path')
        .map((p: any) => ({
          name: p.name,
          type: p.schema?.type || 'string',
          description: p.description || `Path parameter: ${p.name}`,
          required: p.required !== false,
          enum: p.schema?.enum || null,
          example: p.example || p.schema?.example || null
        }))

      const queryParams = parameters
        .filter((p: any) => p.in === 'query')
        .map((p: any) => ({
          name: p.name,
          type: p.schema?.type || 'string',
          description: p.description || `Query parameter: ${p.name}`,
          required: p.required === true,
          enum: p.schema?.enum || null,
          example: p.example || p.schema?.example || null
        }))

      // Extract request body properties for POST endpoints
      const bodyParams: BodyParamDetail[] = []
      if (method === 'post' && op.requestBody) {
        const schema =
          op.requestBody.content?.['application/json']?.schema || {}
        const props = schema.properties || {}
        const requiredFields: string[] = schema.required || []
        for (const [propName, propDef] of Object.entries(props)) {
          const p = propDef as any
          bodyParams.push({
            name: propName,
            type: p.type || 'string',
            description: p.description || `Body parameter: ${propName}`,
            required: requiredFields.includes(propName)
          })
        }
      }

      endpointMap[uniqueName] = {
        toolName: uniqueName,
        description: op.summary || `Tool for ${method.toUpperCase()} ${path}`,
        path,
        method,
        pathParams,
        queryParams,
        bodyParams
      }
    }
  }

  console.error(
    `[MCP] Swagger parsed, ${Object.keys(endpointMap).length} tools loaded.`
  )

  // Debug: Log tools with enums
  Object.values(endpointMap).forEach((tool: any) => {
    const paramsWithEnums = [...tool.pathParams, ...tool.queryParams].filter(
      (p: any) => p.enum
    )
    if (paramsWithEnums.length > 0) {
      console.error(
        `[MCP] Tool ${tool.toolName} has enum params:`,
        paramsWithEnums
          .map((p: any) => `${p.name}: [${p.enum.join(',')}]`)
          .join(', ')
      )
    }
  })
}
