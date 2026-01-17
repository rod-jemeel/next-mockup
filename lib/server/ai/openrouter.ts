/**
 * OpenRouter Client
 * Direct API client using fetch (OpenAI-compatible API)
 */

if (!process.env.OPENROUTER_API_KEY) {
  console.warn("Missing OPENROUTER_API_KEY - AI features will be disabled")
}

export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

/**
 * Get the configured model ID for chat completions
 * Default: xiaomi/mimo-v2-flash:free (free tier model)
 */
export function getModelId() {
  return process.env.OPENROUTER_MODEL || "xiaomi/mimo-v2-flash:free"
}

/**
 * Get default headers for OpenRouter requests
 */
export function getHeaders() {
  return {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Expense Tracker AI",
  }
}

/**
 * Message type for chat API
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool"
  content: string | null
  tool_calls?: Array<{
    id: string
    type: "function"
    function: { name: string; arguments: string }
  }>
  tool_call_id?: string
}

/**
 * Tool definition type
 */
export interface ToolDefinition {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

/**
 * Chat completion request options
 */
export interface ChatCompletionOptions {
  model?: string
  messages: ChatMessage[]
  tools?: ToolDefinition[]
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } }
  stream?: boolean
  response_format?: { type: "json_object" | "text" }
}

/**
 * Make a chat completion request to OpenRouter
 */
export async function chatCompletion(options: ChatCompletionOptions): Promise<Response> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: options.model || getModelId(),
      messages: options.messages,
      tools: options.tools,
      tool_choice: options.tool_choice,
      stream: options.stream ?? false,
      response_format: options.response_format,
    }),
  })

  if (!response.ok && !options.stream) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
  }

  return response
}
