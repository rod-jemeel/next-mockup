"use client"

import { useCallback } from "react"
import { useChatStore } from "@/lib/stores/chat-store"
import type { ChatMessage } from "@/lib/stores/chat-store"

// Re-export ChatMessage type for consumers
export type { ChatMessage }

interface UseChatOptions {
  onQuerySelect?: (query: string) => void
}

/**
 * Custom hook for AI chat functionality.
 * Thin wrapper around Zustand store -- maintains identical return API.
 */
export function useChat(options: UseChatOptions = {}) {
  const messages = useChatStore((s) => s.messages)
  const input = useChatStore((s) => s.input)
  const setInput = useChatStore((s) => s.setInput)
  const isLoading = useChatStore((s) => s.isLoading)
  const error = useChatStore((s) => s.error)
  const latestData = useChatStore((s) => s.latestData)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const setMessages = useChatStore((s) => s.setMessages)

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value)
    },
    [setInput]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      sendMessage(input)
    },
    [input, sendMessage]
  )

  const sendQuery = useCallback(
    (query: string) => {
      sendMessage(query)
      options.onQuerySelect?.(query)
    },
    [sendMessage, options]
  )

  const stop = useCallback(() => {
    // Could implement AbortController here if needed
  }, [])

  const reload = useCallback(() => {
    if (messages.length >= 2) {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")
      if (lastUserMessage) {
        setMessages((prev) => prev.slice(0, -2))
        sendMessage(lastUserMessage.content)
      }
    }
  }, [messages, sendMessage, setMessages])

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
