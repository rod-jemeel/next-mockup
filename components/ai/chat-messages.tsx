"use client"

import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"
import type { ChatMessage } from "@/lib/hooks/use-chat"

interface ChatMessagesProps {
  messages: ChatMessage[]
  isLoading?: boolean
}

/**
 * Simple markdown renderer for chat messages
 * Handles: **bold**, *italic*, - bullets, numbered lists
 */
function renderMarkdown(text: string): React.ReactNode {
  // Split by lines to handle bullets and lists
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let listType: "ul" | "ol" | null = null

  const flushList = () => {
    if (listItems.length > 0) {
      if (listType === "ul") {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc pl-4 my-1 space-y-0.5">
            {listItems}
          </ul>
        )
      } else {
        elements.push(
          <ol key={`list-${elements.length}`} className="list-decimal pl-4 my-1 space-y-0.5">
            {listItems}
          </ol>
        )
      }
      listItems = []
      listType = null
    }
  }

  const renderInlineFormatting = (line: string): React.ReactNode => {
    // Handle **bold** and *italic*
    const parts: React.ReactNode[] = []
    let remaining = line
    let keyIndex = 0

    while (remaining.length > 0) {
      // Check for bold **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
      // Check for italic *text*
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/)

      let firstMatch: RegExpMatchArray | null = null
      let matchType: "bold" | "italic" | null = null

      if (boldMatch && italicMatch) {
        if ((boldMatch.index ?? Infinity) <= (italicMatch.index ?? Infinity)) {
          firstMatch = boldMatch
          matchType = "bold"
        } else {
          firstMatch = italicMatch
          matchType = "italic"
        }
      } else if (boldMatch) {
        firstMatch = boldMatch
        matchType = "bold"
      } else if (italicMatch) {
        firstMatch = italicMatch
        matchType = "italic"
      }

      if (firstMatch && firstMatch.index !== undefined) {
        // Add text before match
        if (firstMatch.index > 0) {
          parts.push(remaining.slice(0, firstMatch.index))
        }

        // Add formatted text
        if (matchType === "bold") {
          parts.push(
            <strong key={`bold-${keyIndex++}`} className="font-semibold">
              {firstMatch[1]}
            </strong>
          )
        } else {
          parts.push(
            <em key={`italic-${keyIndex++}`} className="italic">
              {firstMatch[1]}
            </em>
          )
        }

        remaining = remaining.slice(firstMatch.index + firstMatch[0].length)
      } else {
        parts.push(remaining)
        break
      }
    }

    return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // Check for bullet points
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      if (listType !== "ul") {
        flushList()
        listType = "ul"
      }
      listItems.push(
        <li key={`item-${index}`}>{renderInlineFormatting(trimmed.slice(2))}</li>
      )
      return
    }

    // Check for numbered lists
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/)
    if (numberedMatch) {
      if (listType !== "ol") {
        flushList()
        listType = "ol"
      }
      listItems.push(
        <li key={`item-${index}`}>{renderInlineFormatting(numberedMatch[2])}</li>
      )
      return
    }

    // Not a list item - flush any pending list
    flushList()

    // Handle empty lines
    if (trimmed === "") {
      if (elements.length > 0) {
        elements.push(<br key={`br-${index}`} />)
      }
      return
    }

    // Regular paragraph with inline formatting
    elements.push(
      <span key={`p-${index}`} className="block">
        {renderInlineFormatting(line)}
      </span>
    )
  })

  // Flush any remaining list
  flushList()

  return elements
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  if (messages.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-4" data-slot="chat-messages">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-3",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {message.role === "assistant" && (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="size-4" />
            </div>
          )}
          <div
            className={cn(
              "rounded-lg px-3 py-2 max-w-[85%] text-xs/relaxed",
              message.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            )}
          >
            {message.content ? (
              message.role === "assistant" ? (
                renderMarkdown(message.content)
              ) : (
                message.content
              )
            ) : (
              <span className="text-muted-foreground italic">
                Processing query...
              </span>
            )}
          </div>
          {message.role === "user" && (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <User className="size-4" />
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex gap-3 justify-start">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bot className="size-4" />
          </div>
          <div className="rounded-lg px-3 py-2 bg-muted text-foreground">
            <div className="flex gap-1">
              <span className="size-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="size-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="size-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
