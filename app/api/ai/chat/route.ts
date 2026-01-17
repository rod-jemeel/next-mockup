import { getAIQueryContext } from "@/lib/server/ai/permissions"
import { chatCompletion, type ChatMessage as APIChatMessage } from "@/lib/server/ai/openrouter"
import { generateSystemPrompt } from "@/lib/server/ai/system-prompt"
import { executeQuery } from "@/lib/server/ai/query-templates"
import { ApiError, handleError } from "@/lib/errors"
import type { QueryTemplateName } from "@/lib/ai/types"

interface AIResponse {
  message: string
  query?: {
    template: QueryTemplateName
    params: Record<string, unknown>
  }
}

/**
 * POST /api/ai/chat
 * Chat endpoint with AI assistant using JSON response format
 * Auth: any authenticated user with org access
 */
export async function POST(request: Request) {
  try {
    // Get AI query context (auth + permissions)
    const context = await getAIQueryContext()
    if (!context) {
      throw new ApiError("UNAUTHORIZED")
    }

    const body = await request.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      throw new ApiError("VALIDATION_ERROR", "Messages array is required")
    }

    // Generate system prompt with user context
    const systemPrompt = generateSystemPrompt(context)

    // Build messages with system prompt
    const chatMessages: APIChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ]

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // First API call to get AI response
          const response = await chatCompletion({
            messages: chatMessages,
            stream: false, // Non-streaming for JSON parsing
            response_format: { type: "json_object" },
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error("OpenRouter API error:", errorText)
            controller.enqueue(encoder.encode(`0:${JSON.stringify("Sorry, I encountered an error with the AI service.")}\n`))
            controller.close()
            return
          }

          const responseData = await response.json()
          const content = responseData.choices?.[0]?.message?.content

          if (!content) {
            controller.enqueue(encoder.encode(`0:${JSON.stringify("No response from AI service.")}\n`))
            controller.close()
            return
          }

          // Parse the JSON response
          let aiResponse: AIResponse
          try {
            aiResponse = JSON.parse(content)
          } catch {
            // If JSON parsing fails, treat the content as a plain message
            controller.enqueue(encoder.encode(`0:${JSON.stringify(content)}\n`))
            controller.close()
            return
          }

          // Stream the initial message
          if (aiResponse.message) {
            controller.enqueue(encoder.encode(`0:${JSON.stringify(aiResponse.message)}\n`))
          }

          // Execute query if requested
          if (aiResponse.query) {
            const { template, params } = aiResponse.query

            // Inject orgId if not provided
            if (!params.orgId) {
              // Use activeOrgId for both regular users and superadmins
              if (context.activeOrgId) {
                params.orgId = context.activeOrgId
              } else if (context.allowedOrgIds && context.allowedOrgIds.length > 0) {
                params.orgId = context.allowedOrgIds[0]
              }
            }

            // Enforce org scope for non-super users
            if (context.scope === "org" && context.allowedOrgIds) {
              if (params.orgId && !context.allowedOrgIds.includes(params.orgId as string)) {
                controller.enqueue(encoder.encode(`0:${JSON.stringify("\n\nSorry, you don't have access to that organization.")}\n`))
                controller.close()
                return
              }
            }

            // Execute the query
            const queryResult = await executeQuery(context, template, params as never)

            if (queryResult.error) {
              controller.enqueue(encoder.encode(`0:${JSON.stringify(`\n\nError fetching data: ${queryResult.error}`)}\n`))
              controller.close()
              return
            }

            // Send the query result data for visualization (d: prefix for data)
            controller.enqueue(encoder.encode(`d:${JSON.stringify(queryResult.data)}\n`))

            // Second API call with query results to get analysis
            const followUpMessages: APIChatMessage[] = [
              ...chatMessages,
              { role: "assistant", content: JSON.stringify(aiResponse) },
              {
                role: "user",
                content: `Here is the query result data. Please analyze it and provide insights:\n\n${JSON.stringify(queryResult.data, null, 2)}\n\nRespond with JSON: {"message": "your analysis with specific numbers and insights"}`,
              },
            ]

            const analysisResponse = await chatCompletion({
              messages: followUpMessages,
              stream: false,
              response_format: { type: "json_object" },
            })

            if (analysisResponse.ok) {
              const analysisData = await analysisResponse.json()
              const analysisContent = analysisData.choices?.[0]?.message?.content

              if (analysisContent) {
                try {
                  const analysis = JSON.parse(analysisContent)
                  if (analysis.message) {
                    controller.enqueue(encoder.encode(`0:${JSON.stringify("\n\n" + analysis.message)}\n`))
                  }
                } catch {
                  controller.enqueue(encoder.encode(`0:${JSON.stringify("\n\n" + analysisContent)}\n`))
                }
              }
            }
          }

          controller.close()
        } catch (error) {
          console.error("Stream error:", error)
          controller.enqueue(
            encoder.encode(`0:${JSON.stringify("Sorry, I encountered an error processing your request.")}\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
