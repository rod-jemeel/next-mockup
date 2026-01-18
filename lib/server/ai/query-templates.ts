/**
 * Query Templates
 * Safe parameterized queries for AI-driven data access
 * NEVER use dynamic SQL - all queries are pre-defined with parameter binding
 */

import { supabase } from "@/lib/server/db"
import type { AIQueryContext, QueryTemplateName, QueryTemplateParams } from "@/lib/ai/types"
import { canAccessOrg, canQueryCrossOrg } from "./permissions"

// Type-safe query executor
type QueryResult<T> = { data: T | null; error: string | null }

/**
 * Execute a pre-defined query template with parameters
 */
export async function executeQuery<T extends QueryTemplateName>(
  context: AIQueryContext,
  template: T,
  params: QueryTemplateParams[T]
): Promise<QueryResult<unknown>> {
  const executor = queryExecutors[template]
  if (!executor) {
    return { data: null, error: `Unknown query template: ${template}` }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await executor(context, params as any)
    return result
  } catch (error) {
    console.error(`Query error for ${template}:`, error)
    return { data: null, error: "Failed to execute query" }
  }
}

// Query executors keyed by template name
const queryExecutors: {
  [K in QueryTemplateName]: (
    context: AIQueryContext,
    params: QueryTemplateParams[K]
  ) => Promise<QueryResult<unknown>>
} = {
  /**
   * Get current price for an item (latest effective_at)
   */
  current_price: async (context, params) => {
    if (!canAccessOrg(context, params.orgId)) {
      return { data: null, error: "Access denied" }
    }

    const { data, error } = await supabase
      .from("inventory_price_history")
      .select(`
        id,
        unit_price,
        vendor,
        effective_at,
        inventory_items!inner(id, name, unit)
      `)
      .eq("org_id", params.orgId)
      .eq("item_id", params.itemId)
      .order("effective_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    const inventoryItem = data.inventory_items as unknown as { name: string; unit: string }

    return {
      data: {
        itemId: params.itemId,
        itemName: inventoryItem.name,
        unit: inventoryItem.unit,
        currentPrice: Number(data.unit_price),
        vendor: data.vendor,
        effectiveAt: data.effective_at,
      },
      error: null,
    }
  },

  /**
   * Get price at a specific date (point-in-time query)
   */
  price_at_date: async (context, params) => {
    if (!canAccessOrg(context, params.orgId)) {
      return { data: null, error: "Access denied" }
    }

    const { data, error } = await supabase
      .from("inventory_price_history")
      .select(`
        id,
        unit_price,
        vendor,
        effective_at,
        inventory_items!inner(id, name, unit)
      `)
      .eq("org_id", params.orgId)
      .eq("item_id", params.itemId)
      .lte("effective_at", params.date)
      .order("effective_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    const inventoryItem = data.inventory_items as unknown as { name: string; unit: string }

    return {
      data: {
        itemId: params.itemId,
        itemName: inventoryItem.name,
        unit: inventoryItem.unit,
        price: Number(data.unit_price),
        vendor: data.vendor,
        effectiveAt: data.effective_at,
        queryDate: params.date,
      },
      error: null,
    }
  },

  /**
   * Get price history for an item since a start date
   */
  price_history: async (context, params) => {
    if (!canAccessOrg(context, params.orgId)) {
      return { data: null, error: "Access denied" }
    }

    const { data: item } = await supabase
      .from("inventory_items")
      .select("name, unit")
      .eq("id", params.itemId)
      .eq("org_id", params.orgId)
      .single()

    const { data, error } = await supabase
      .from("inventory_price_history")
      .select("id, unit_price, vendor, effective_at, note")
      .eq("org_id", params.orgId)
      .eq("item_id", params.itemId)
      .gte("effective_at", params.startDate)
      .order("effective_at", { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    return {
      data: {
        itemId: params.itemId,
        itemName: item?.name,
        unit: item?.unit,
        history: data.map((row) => ({
          price: Number(row.unit_price),
          vendor: row.vendor,
          effectiveAt: row.effective_at,
          note: row.note,
        })),
      },
      error: null,
    }
  },

  /**
   * Get items with biggest price changes in a period
   */
  top_price_changes: async (context, params) => {
    if (!canAccessOrg(context, params.orgId)) {
      return { data: null, error: "Access denied" }
    }

    const limit = params.limit ?? 10

    // Get all items
    const { data: items } = await supabase
      .from("inventory_items")
      .select("id, name, unit")
      .eq("org_id", params.orgId)
      .eq("is_active", true)

    if (!items || items.length === 0) {
      return { data: { items: [] }, error: null }
    }

    // Fetch start and end prices for each item
    const priceChanges = await Promise.all(
      items.map(async (item) => {
        const [startResult, endResult] = await Promise.all([
          supabase
            .from("inventory_price_history")
            .select("unit_price")
            .eq("org_id", params.orgId)
            .eq("item_id", item.id)
            .lte("effective_at", params.startDate)
            .order("effective_at", { ascending: false })
            .limit(1),
          supabase
            .from("inventory_price_history")
            .select("unit_price")
            .eq("org_id", params.orgId)
            .eq("item_id", item.id)
            .order("effective_at", { ascending: false })
            .limit(1),
        ])

        const startPrice = startResult.data?.[0]?.unit_price
        const endPrice = endResult.data?.[0]?.unit_price

        if (startPrice && endPrice) {
          const change = Number(endPrice) - Number(startPrice)
          const percentChange = (change / Number(startPrice)) * 100
          return {
            itemId: item.id,
            itemName: item.name,
            unit: item.unit,
            startPrice: Number(startPrice),
            endPrice: Number(endPrice),
            change,
            percentChange,
          }
        }
        return null
      })
    )

    // Filter out nulls and sort by absolute percent change
    const sorted = priceChanges
      .filter((item): item is NonNullable<typeof item> => item !== null && item.change !== 0)
      .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
      .slice(0, limit)

    return { data: { items: sorted }, error: null }
  },

  /**
   * Get monthly expense totals (including tax breakdown)
   */
  monthly_expenses: async (context, params) => {
    if (!canAccessOrg(context, params.orgId)) {
      return { data: null, error: "Access denied" }
    }

    const { data, error } = await supabase
      .from("expenses")
      .select("id, amount, amount_pre_tax, tax_amount, effective_tax_rate, expense_date")
      .eq("org_id", params.orgId)
      .gte("expense_date", params.startDate)
      .lte("expense_date", params.endDate)

    if (error) {
      return { data: null, error: error.message }
    }

    // Aggregate by month
    const monthlyTotals = new Map<string, { total: number; preTax: number; tax: number; count: number }>()

    for (const expense of data) {
      const month = expense.expense_date.substring(0, 7) // YYYY-MM
      const existing = monthlyTotals.get(month) || { total: 0, preTax: 0, tax: 0, count: 0 }
      existing.total += Number(expense.amount)
      existing.preTax += expense.amount_pre_tax ? Number(expense.amount_pre_tax) : Number(expense.amount)
      existing.tax += expense.tax_amount ? Number(expense.tax_amount) : 0
      existing.count += 1
      monthlyTotals.set(month, existing)
    }

    const months = Array.from(monthlyTotals.entries())
      .map(([month, data]) => ({
        month,
        total: data.total,
        preTaxTotal: data.preTax,
        taxTotal: data.tax,
        effectiveTaxRate: data.preTax > 0 ? (data.tax / data.preTax) * 100 : 0,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const grandTotal = months.reduce((sum, m) => sum + m.total, 0)
    const grandPreTax = months.reduce((sum, m) => sum + m.preTaxTotal, 0)
    const grandTax = months.reduce((sum, m) => sum + m.taxTotal, 0)

    return {
      data: {
        months,
        grandTotal,
        grandPreTaxTotal: grandPreTax,
        grandTaxTotal: grandTax,
        averageTaxRate: grandPreTax > 0 ? (grandTax / grandPreTax) * 100 : 0,
        totalCount: months.reduce((sum, m) => sum + m.count, 0),
      },
      error: null,
    }
  },

  /**
   * Get expenses by category (including tax breakdown)
   */
  expenses_by_category: async (context, params) => {
    if (!canAccessOrg(context, params.orgId)) {
      return { data: null, error: "Access denied" }
    }

    const { data, error } = await supabase
      .from("expenses")
      .select(`
        id,
        amount,
        amount_pre_tax,
        tax_amount,
        expense_categories(id, name)
      `)
      .eq("org_id", params.orgId)
      .gte("expense_date", params.startDate)
      .lte("expense_date", params.endDate)

    if (error) {
      return { data: null, error: error.message }
    }

    // Aggregate by category
    const categoryTotals = new Map<string, { name: string; total: number; preTax: number; tax: number; count: number }>()

    for (const expense of data) {
      const category = expense.expense_categories as unknown as { id: string; name: string } | null
      const catId = category?.id || "uncategorized"
      const catName = category?.name || "Uncategorized"

      const existing = categoryTotals.get(catId) || { name: catName, total: 0, preTax: 0, tax: 0, count: 0 }
      existing.total += Number(expense.amount)
      existing.preTax += expense.amount_pre_tax ? Number(expense.amount_pre_tax) : Number(expense.amount)
      existing.tax += expense.tax_amount ? Number(expense.tax_amount) : 0
      existing.count += 1
      categoryTotals.set(catId, existing)
    }

    const grandTotal = Array.from(categoryTotals.values()).reduce((sum, c) => sum + c.total, 0)
    const grandTax = Array.from(categoryTotals.values()).reduce((sum, c) => sum + c.tax, 0)

    const categories = Array.from(categoryTotals.entries())
      .map(([id, data]) => ({
        categoryId: id,
        categoryName: data.name,
        total: data.total,
        preTaxTotal: data.preTax,
        taxTotal: data.tax,
        count: data.count,
        percentOfTotal: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)

    return {
      data: {
        categories,
        grandTotal,
        grandTaxTotal: grandTax,
      },
      error: null,
    }
  },

  /**
   * Get top vendors by spend (including tax breakdown)
   */
  top_vendors: async (context, params) => {
    if (!canAccessOrg(context, params.orgId)) {
      return { data: null, error: "Access denied" }
    }

    const limit = params.limit ?? 10

    const { data, error } = await supabase
      .from("expenses")
      .select("vendor, amount, amount_pre_tax, tax_amount")
      .eq("org_id", params.orgId)
      .gte("expense_date", params.startDate)
      .lte("expense_date", params.endDate)
      .not("vendor", "is", null)

    if (error) {
      return { data: null, error: error.message }
    }

    // Aggregate by vendor
    const vendorTotals = new Map<string, { total: number; preTax: number; tax: number; count: number }>()

    for (const expense of data) {
      if (!expense.vendor) continue
      const existing = vendorTotals.get(expense.vendor) || { total: 0, preTax: 0, tax: 0, count: 0 }
      existing.total += Number(expense.amount)
      existing.preTax += expense.amount_pre_tax ? Number(expense.amount_pre_tax) : Number(expense.amount)
      existing.tax += expense.tax_amount ? Number(expense.tax_amount) : 0
      existing.count += 1
      vendorTotals.set(expense.vendor, existing)
    }

    const vendors = Array.from(vendorTotals.entries())
      .map(([name, data]) => ({
        vendor: name,
        total: data.total,
        preTaxTotal: data.preTax,
        taxTotal: data.tax,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)

    return { data: { vendors }, error: null }
  },

  /**
   * Search inventory items by name
   */
  search_items: async (context, params) => {
    if (!canAccessOrg(context, params.orgId)) {
      return { data: null, error: "Access denied" }
    }

    const { data, error } = await supabase
      .from("inventory_items")
      .select("id, name, sku, unit, is_active")
      .eq("org_id", params.orgId)
      .ilike("name", `%${params.searchTerm}%`)
      .limit(20)

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: { items: data }, error: null }
  },

  /**
   * Compare item prices across organizations (super user only)
   */
  cross_org_item_prices: async (context, params) => {
    if (!canQueryCrossOrg(context)) {
      return { data: null, error: "Cross-org queries require super user access" }
    }

    // Find items matching the name across all orgs
    const { data: items, error: itemError } = await supabase
      .from("inventory_items")
      .select("id, org_id, name, unit")
      .ilike("name", `%${params.itemName}%`)
      .eq("is_active", true)

    if (itemError) {
      return { data: null, error: itemError.message }
    }

    if (!items || items.length === 0) {
      return { data: { comparisons: [] }, error: null }
    }

    // Get current price for each item
    const comparisons = await Promise.all(
      items.map(async (item) => {
        const { data: price } = await supabase
          .from("inventory_price_history")
          .select("unit_price, vendor, effective_at")
          .eq("org_id", item.org_id)
          .eq("item_id", item.id)
          .order("effective_at", { ascending: false })
          .limit(1)
          .single()

        // Get org name
        const { data: org } = await supabase
          .from("organization")
          .select("name")
          .eq("id", item.org_id)
          .single()

        return {
          orgId: item.org_id,
          orgName: org?.name || "Unknown",
          itemId: item.id,
          itemName: item.name,
          unit: item.unit,
          currentPrice: price ? Number(price.unit_price) : null,
          vendor: price?.vendor,
          effectiveAt: price?.effective_at,
        }
      })
    )

    return {
      data: {
        comparisons: comparisons.filter((c) => c.currentPrice !== null),
      },
      error: null,
    }
  },

  /**
   * Get recurring expense templates for an organization
   */
  recurring_templates: async (context, params) => {
    if (!canAccessOrg(context, params.orgId)) {
      return { data: null, error: "Access denied" }
    }

    const { data, error } = await supabase
      .from("recurring_expense_templates")
      .select(`
        id,
        name,
        vendor,
        estimated_amount,
        frequency,
        typical_day_of_month,
        is_active,
        expense_categories(id, name)
      `)
      .eq("org_id", params.orgId)
      .eq("is_active", true)
      .order("name")

    if (error) {
      return { data: null, error: error.message }
    }

    const templates = data.map((t) => {
      const category = t.expense_categories as unknown as { id: string; name: string } | null
      return {
        id: t.id,
        name: t.name,
        vendor: t.vendor,
        estimatedAmount: t.estimated_amount ? Number(t.estimated_amount) : null,
        frequency: t.frequency,
        typicalDayOfMonth: t.typical_day_of_month,
        categoryName: category?.name || "Uncategorized",
      }
    })

    return {
      data: { templates },
      error: null,
    }
  },

  /**
   * Get expense history for a recurring template (shows monthly variation)
   */
  recurring_expense_history: async (context, params) => {
    if (!canAccessOrg(context, params.orgId)) {
      return { data: null, error: "Access denied" }
    }

    // Get the template info
    const { data: template, error: templateError } = await supabase
      .from("recurring_expense_templates")
      .select("id, name, vendor, estimated_amount")
      .eq("id", params.templateId)
      .eq("org_id", params.orgId)
      .single()

    if (templateError) {
      return { data: null, error: templateError.message }
    }

    // Get expenses linked to this template
    const { data, error } = await supabase
      .from("expenses")
      .select("id, expense_date, amount, amount_pre_tax, tax_amount, notes")
      .eq("org_id", params.orgId)
      .eq("recurring_template_id", params.templateId)
      .gte("expense_date", params.startDate)
      .lte("expense_date", params.endDate)
      .order("expense_date", { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    const history = data.map((e) => ({
      date: e.expense_date,
      month: e.expense_date.substring(0, 7),
      amount: Number(e.amount),
      preTax: e.amount_pre_tax ? Number(e.amount_pre_tax) : null,
      tax: e.tax_amount ? Number(e.tax_amount) : null,
      notes: e.notes,
    }))

    const amounts = history.map((h) => h.amount)
    const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0
    const minAmount = amounts.length > 0 ? Math.min(...amounts) : 0
    const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0

    return {
      data: {
        templateId: template.id,
        templateName: template.name,
        vendor: template.vendor,
        estimatedAmount: template.estimated_amount ? Number(template.estimated_amount) : null,
        history,
        summary: {
          count: history.length,
          total: amounts.reduce((a, b) => a + b, 0),
          average: avgAmount,
          min: minAmount,
          max: maxAmount,
          variance: maxAmount - minAmount,
        },
      },
      error: null,
    }
  },

  /**
   * Compare spending across organizations (super user only, including tax breakdown)
   */
  cross_org_spending: async (context, params) => {
    if (!canQueryCrossOrg(context)) {
      return { data: null, error: "Cross-org queries require super user access" }
    }

    // Get all organizations
    const { data: orgs, error: orgError } = await supabase
      .from("organization")
      .select("id, name")

    if (orgError) {
      return { data: null, error: orgError.message }
    }

    // Get expenses for each org
    const spending = await Promise.all(
      orgs.map(async (org) => {
        const { data: expenses } = await supabase
          .from("expenses")
          .select("amount, amount_pre_tax, tax_amount")
          .eq("org_id", org.id)
          .gte("expense_date", params.startDate)
          .lte("expense_date", params.endDate)

        const total = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
        const preTax = expenses?.reduce((sum, e) => sum + (e.amount_pre_tax ? Number(e.amount_pre_tax) : Number(e.amount)), 0) || 0
        const tax = expenses?.reduce((sum, e) => sum + (e.tax_amount ? Number(e.tax_amount) : 0), 0) || 0
        const count = expenses?.length || 0

        return {
          orgId: org.id,
          orgName: org.name,
          total,
          preTaxTotal: preTax,
          taxTotal: tax,
          count,
        }
      })
    )

    const grandTotal = spending.reduce((sum, s) => sum + s.total, 0)
    const grandTax = spending.reduce((sum, s) => sum + s.taxTotal, 0)

    return {
      data: {
        spending: spending.sort((a, b) => b.total - a.total),
        grandTotal,
        grandTaxTotal: grandTax,
      },
      error: null,
    }
  },
}

/**
 * Get list of available query templates for the user's context
 */
export function getAvailableTemplates(context: AIQueryContext): QueryTemplateName[] {
  const orgTemplates: QueryTemplateName[] = [
    "current_price",
    "price_at_date",
    "price_history",
    "top_price_changes",
    "monthly_expenses",
    "expenses_by_category",
    "top_vendors",
    "search_items",
    "recurring_templates",
    "recurring_expense_history",
  ]

  if (canQueryCrossOrg(context)) {
    return [...orgTemplates, "cross_org_item_prices", "cross_org_spending"]
  }

  return orgTemplates
}
