"use client"

import { useState, useCallback } from "react"
import type { UIComponent } from "@/lib/ai/types"

// Simple message type that doesn't rely on AI SDK types
export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  ui?: UIComponent[]
  data?: Record<string, unknown>
  createdAt: Date
}

interface UseChatOptions {
  onQuerySelect?: (query: string) => void
}

/**
 * Custom hook for AI chat functionality
 * Simple implementation without AI SDK React dependencies
 */
export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [latestData, setLatestData] = useState<Record<string, unknown>>({})

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 15)

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value)
    },
    []
  )

  // Send message to API and handle streaming response
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      // Add user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content,
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])
      setInput("")
      setIsLoading(true)
      setError(null)

      // Create assistant message placeholder
      const assistantId = generateId()
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        if (!response.body) {
          throw new Error("No response body")
        }

        // Read the stream
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulatedContent = ""
        let accumulatedData: Record<string, unknown> = {}

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })

          // Process the streaming data
          // The AI SDK returns data in a specific format, parse it
          const lines = chunk.split("\n").filter((line) => line.trim())

          for (const line of lines) {
            // Skip empty lines
            if (!line.trim()) continue

            // Check for text content (format: 0:"text content")
            if (line.startsWith("0:")) {
              const text = line.slice(2)
              try {
                // The text is JSON encoded
                const parsed = JSON.parse(text)
                if (typeof parsed === "string") {
                  accumulatedContent += parsed
                }
              } catch {
                // If not JSON, just append the text
                accumulatedContent += text.replace(/^"|"$/g, "")
              }
            }

            // Check for data content (format: d:{...data object})
            if (line.startsWith("d:")) {
              const dataText = line.slice(2)
              try {
                const parsed = JSON.parse(dataText)
                if (parsed && typeof parsed === "object") {
                  Object.assign(accumulatedData, parsed)
                }
              } catch {
                // Ignore parsing errors
              }
            }
          }

          // Update the assistant message with accumulated content
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: accumulatedContent, data: accumulatedData }
                : m
            )
          )
        }

        // Update latest data for results panel
        if (Object.keys(accumulatedData).length > 0) {
          setLatestData(accumulatedData)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
        // Update assistant message with error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, I encountered an error. Please try again." }
              : m
          )
        )
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading]
  )

  // Handle form submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      sendMessage(input)
    },
    [input, sendMessage]
  )

  // Send a query directly (for suggested queries)
  const sendQuery = useCallback(
    (query: string) => {
      sendMessage(query)
      options.onQuerySelect?.(query)
    },
    [sendMessage, options]
  )

  // Stop generation (not implemented for simple version)
  const stop = useCallback(() => {
    // Could implement AbortController here if needed
  }, [])

  // Reload last message
  const reload = useCallback(() => {
    if (messages.length >= 2) {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")
      if (lastUserMessage) {
        setMessages((prev) => prev.slice(0, -2))
        sendMessage(lastUserMessage.content)
      }
    }
  }, [messages, sendMessage])

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    handleInputChange,
    isLoading,
    error,
    sendQuery,
    reload,
    stop,
    latestData,
  }
}
