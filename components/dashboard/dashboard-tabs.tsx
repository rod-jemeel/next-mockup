"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTabState, DashboardTab } from "@/lib/hooks/use-tab-state"
import { LayoutDashboard, Receipt, Package } from "lucide-react"

interface DashboardTabsProps {
  overviewContent: React.ReactNode
  expensesContent: React.ReactNode
  inventoryContent: React.ReactNode
  defaultTab?: DashboardTab
}

export function DashboardTabs({
  overviewContent,
  expensesContent,
  inventoryContent,
  defaultTab = "overview",
}: DashboardTabsProps) {
  const [tab, setTab] = useTabState(defaultTab)

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as DashboardTab)}
      className="w-full"
    >
      <TabsList className="mb-6">
        <TabsTrigger value="overview" className="gap-1.5">
          <LayoutDashboard className="size-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="expenses" className="gap-1.5">
          <Receipt className="size-4" />
          Expenses
        </TabsTrigger>
        <TabsTrigger value="inventory" className="gap-1.5">
          <Package className="size-4" />
          Inventory
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">{overviewContent}</TabsContent>
      <TabsContent value="expenses">{expensesContent}</TabsContent>
      <TabsContent value="inventory">{inventoryContent}</TabsContent>
    </Tabs>
  )
}
