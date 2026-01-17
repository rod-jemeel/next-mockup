"use client"

import { SendHorizontal, Square } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading?: boolean
  onStop?: () => void
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  onStop,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && value.trim()) {
        onSubmit(e)
      }
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex gap-2 items-end"
      data-slot="chat-input"
    >
      <textarea
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask about your expenses or inventory..."
        className="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-md border border-input bg-input/20 dark:bg-input/30 px-3 py-2 text-xs/relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        rows={1}
        disabled={isLoading}
      />
      {isLoading ? (
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={onStop}
          className="shrink-0"
        >
          <Square className="size-4" />
        </Button>
      ) : (
        <Button
          type="submit"
          size="icon"
          disabled={!value.trim()}
          className="shrink-0"
        >
          <SendHorizontal className="size-4" />
        </Button>
      )}
    </form>
  )
}
