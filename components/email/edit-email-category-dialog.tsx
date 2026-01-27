"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import type { EmailCategory } from "@/lib/server/services/email-categories"

interface EditEmailCategoryDialogProps {
  category: EmailCategory
  orgId: string
}

export function EditEmailCategoryDialog({ category, orgId }: EditEmailCategoryDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(category.name)
  const [description, setDescription] = useState(category.description || "")
  const [color, setColor] = useState(category.color || "#6b7280")
  const [keywords, setKeywords] = useState<string[]>(category.keywords || [])
  const [keywordInput, setKeywordInput] = useState("")
  const [senderPatterns, setSenderPatterns] = useState<string[]>(category.sender_patterns || [])
  const [patternInput, setPatternInput] = useState("")

  function addKeyword() {
    const trimmed = keywordInput.trim().toLowerCase()
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed])
      setKeywordInput("")
    }
  }

  function removeKeyword(keyword: string) {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  function addPattern() {
    const trimmed = patternInput.trim().toLowerCase()
    if (trimmed && !senderPatterns.includes(trimmed)) {
      setSenderPatterns([...senderPatterns, trimmed])
      setPatternInput("")
    }
  }

  function removePattern(pattern: string) {
    setSenderPatterns(senderPatterns.filter((p) => p !== pattern))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/orgs/${orgId}/email/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          color,
          keywords: keywords.length > 0 ? keywords : [],
          senderPatterns: senderPatterns.length > 0 ? senderPatterns : [],
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to update category")
      }

      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Email Category</DialogTitle>
          <DialogDescription>
            Update the category settings and detection rules
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <FieldError className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                {error}
              </FieldError>
            )}

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Field>
                <FieldLabel htmlFor="edit-name">Name</FieldLabel>
                <Input
                  id="edit-name"
                  placeholder="e.g., Invoice"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-color">Color</FieldLabel>
                <Input
                  id="edit-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={isLoading}
                  className="h-9 w-14 p-1"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="edit-description">Description</FieldLabel>
              <Textarea
                id="edit-description"
                placeholder="Brief description of this category"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={2}
              />
            </Field>

            <Field>
              <FieldLabel>Keywords</FieldLabel>
              <FieldDescription>
                Emails containing these words will be categorized automatically
              </FieldDescription>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., invoice"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addKeyword()
                    }
                  }}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addKeyword}
                  disabled={!keywordInput.trim()}
                >
                  Add
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </Field>

            <Field>
              <FieldLabel>Sender Patterns</FieldLabel>
              <FieldDescription>
                Match emails from specific senders. Use * as wildcard (e.g., *@billing.*)
              </FieldDescription>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., *@billing.*"
                  value={patternInput}
                  onChange={(e) => setPatternInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addPattern()
                    }
                  }}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPattern}
                  disabled={!patternInput.trim()}
                >
                  Add
                </Button>
              </div>
              {senderPatterns.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {senderPatterns.map((p) => (
                    <Badge key={p} variant="secondary" className="gap-1 pr-1">
                      {p}
                      <button
                        type="button"
                        onClick={() => removePattern(p)}
                        className="hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </Field>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !name.trim()}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
