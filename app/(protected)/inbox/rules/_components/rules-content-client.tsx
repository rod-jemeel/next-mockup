"use client"

import { useState } from "react"
import { RuleCard, RuleCardSkeleton } from "@/components/email/rule-card"
import { NewRuleDialog } from "@/components/email/new-rule-dialog"
import { EditRuleDialog } from "@/components/email/edit-rule-dialog"
import type { ForwardingRuleWithCategory } from "@/lib/server/services/forwarding-rules"
import type { EmailCategory } from "@/lib/server/services/email-categories"
import type { DepartmentWithMembers } from "@/lib/server/services/departments"

interface RulesContentClientProps {
  rules: ForwardingRuleWithCategory[]
  categories: EmailCategory[]
  departments: DepartmentWithMembers[]
  orgId: string
}

export function RulesContentClient({
  rules,
  categories,
  departments,
  orgId,
}: RulesContentClientProps) {
  const [editingRule, setEditingRule] = useState<ForwardingRuleWithCategory | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  function handleEdit(rule: ForwardingRuleWithCategory) {
    setEditingRule(rule)
    setEditDialogOpen(true)
  }

  if (categories.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <NewRuleDialog categories={categories} departments={departments} />
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-sm text-muted-foreground">No email categories defined</p>
          <p className="text-xs text-muted-foreground">
            Create email categories in Settings first before creating forwarding rules
          </p>
        </div>
      </div>
    )
  }

  if (rules.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <NewRuleDialog categories={categories} departments={departments} />
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-sm text-muted-foreground">No forwarding rules yet</p>
          <p className="text-xs text-muted-foreground">
            Create a rule to automatically notify team members about important emails
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewRuleDialog categories={categories} departments={departments} />
      </div>
      <div className="space-y-3">
        {rules.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            orgId={orgId}
            departments={departments}
            onEdit={handleEdit}
          />
        ))}
      </div>
      <EditRuleDialog
        rule={editingRule}
        categories={categories}
        departments={departments}
        orgId={orgId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  )
}

export function RulesContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="h-8 w-24 bg-muted rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <RuleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
