"use client"

import { useChat } from "@/lib/hooks/use-chat"
import { ChatPanel } from "@/components/ai/chat-panel"
import { ResultsPanel } from "@/components/ai/results-panel"

export default function AIPage() {
  const {
    messages,
    input,
    handleSubmit,
    handleInputChange,
    isLoading,
    sendQuery,
    stop,
    latestData,
  } = useChat()

  const handleExport = () => {
    if (!latestData || Object.keys(latestData).length === 0) return

    const dataStr = JSON.stringify(latestData, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ai-query-results-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-[calc(100vh-theme(spacing.12)-2*theme(spacing.4))] -m-4 flex flex-col overflow-hidden">
      <div className="grid flex-1 min-h-0" style={{ gridTemplateColumns: "minmax(320px, 40%) 1fr" }}>
        <ChatPanel
          messages={messages}
          input={input}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onQuerySelect={sendQuery}
          isLoading={isLoading}
          onStop={stop}
        />
        <ResultsPanel data={latestData} onExport={handleExport} />
      </div>
    </div>
  )
}
