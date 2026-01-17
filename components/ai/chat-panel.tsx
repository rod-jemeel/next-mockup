"use client"

import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { SuggestedQuery } from "./suggested-query"
import type { ChatMessage } from "@/lib/hooks/use-chat"

interface ChatPanelProps {
  messages: ChatMessage[]
  input: string
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent) => void
  onQuerySelect: (query: string) => void
  isLoading?: boolean
  onStop?: () => void
  suggestedQueries?: string[]
}

const DEFAULT_SUGGESTIONS = [
  "What were our total expenses last month?",
  "Show me spending by category",
  "Which items had the biggest price changes?",
  "What are our top vendors by spend?",
]

export function ChatPanel({
  messages,
  input,
  onInputChange,
  onSubmit,
  onQuerySelect,
  isLoading,
  onStop,
  suggestedQueries = DEFAULT_SUGGESTIONS,
}: ChatPanelProps) {
  const showSuggestions = messages.length === 0

  return (
    <div
      className="flex flex-col h-full min-h-0 border-r border-border"
      data-slot="chat-panel"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">AI Assistant</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ask questions about your expenses and inventory
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {showSuggestions ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground text-center py-8">
              Start by asking a question or try one of these suggestions:
            </p>
            <div className="flex flex-col gap-2">
              {suggestedQueries.map((query) => (
                <SuggestedQuery
                  key={query}
                  label={query}
                  query={query}
                  onClick={() => onQuerySelect(query)}
                />
              ))}
            </div>
          </div>
        ) : (
          <ChatMessages messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border">
        <ChatInput
          value={input}
          onChange={onInputChange}
          onSubmit={onSubmit}
          isLoading={isLoading}
          onStop={onStop}
        />
      </div>
    </div>
  )
}
