import { create } from "zustand"
import type { UIComponent } from "@/lib/ai/types"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  ui?: UIComponent[]
  data?: Record<string, unknown>
  createdAt: Date
}

interface ChatState {
  messages: ChatMessage[]
  input: string
  isLoading: boolean
  error: Error | null
  latestData: Record<string, unknown>
}

interface ChatActions {
  setInput: (input: string) => void
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
  sendMessage: (content: string) => Promise<void>
  reset: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useChatStore = create<ChatState & ChatActions>()((set, get) => ({
  messages: [],
  input: "",
  isLoading: false,
  error: null,
  latestData: {},

  setInput: (input) => set({ input }),

  setMessages: (messages) => {
    if (typeof messages === "function") {
      set((state) => ({ messages: messages(state.messages) }))
    } else {
      set({ messages })
    }
  },

  sendMessage: async (content) => {
    const state = get()
    if (!content.trim() || state.isLoading) return

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content,
      createdAt: new Date(),
    }

    const assistantId = generateId()
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date(),
    }

    set((s) => ({
      messages: [...s.messages, userMessage, assistantMessage],
      input: "",
      isLoading: true,
      error: null,
    }))

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...state.messages, userMessage].map((m) => ({
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

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ""
      let accumulatedData: Record<string, unknown> = {}

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n").filter((line) => line.trim())

        for (const line of lines) {
          if (!line.trim()) continue

          if (line.startsWith("0:")) {
            const text = line.slice(2)
            try {
              const parsed = JSON.parse(text)
              if (typeof parsed === "string") {
                accumulatedContent += parsed
              }
            } catch {
              accumulatedContent += text.replace(/^"|"$/g, "")
            }
          }

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

        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantId
              ? { ...m, content: accumulatedContent, data: accumulatedData }
              : m
          ),
        }))
      }

      if (Object.keys(accumulatedData).length > 0) {
        set({ latestData: accumulatedData })
      }
    } catch (err) {
      set((s) => ({
        error: err instanceof Error ? err : new Error("Unknown error"),
        messages: s.messages.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, I encountered an error. Please try again." }
            : m
        ),
      }))
    } finally {
      set({ isLoading: false })
    }
  },

  reset: () =>
    set({
      messages: [],
      input: "",
      isLoading: false,
      error: null,
      latestData: {},
    }),
}))
