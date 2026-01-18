import { supabase } from "@/lib/server/db"

/**
 * Seeds mock email data for an organization.
 * Used for demo/MVP purposes only.
 */
export async function seedMockEmailData({
  orgId,
  userId,
  integrationId,
}: {
  orgId: string
  userId: string
  integrationId: string
}): Promise<{ categoriesCount: number; emailsCount: number }> {
  // Create default categories with variety
  const defaultCategories = [
    {
      org_id: orgId,
      name: "Invoice",
      description: "Bills and invoices requiring payment",
      color: "blue",
      keywords: ["invoice", "bill", "payment due", "amount due", "invoice number"],
      sender_patterns: ["*@billing.*", "billing@*", "*@invoices.*", "accounts@*"],
      is_active: true,
      created_by: userId,
    },
    {
      org_id: orgId,
      name: "Utility Bill",
      description: "Electricity, gas, water, and other utility bills",
      color: "yellow",
      keywords: ["electric", "gas", "water", "utility", "energy bill", "power bill"],
      sender_patterns: ["*@energy.*", "*@utilities.*", "*@electric.*", "*@water.*"],
      is_active: true,
      created_by: userId,
    },
    {
      org_id: orgId,
      name: "Vendor Quote",
      description: "Price quotes and proposals from vendors",
      color: "green",
      keywords: ["quote", "proposal", "estimate", "pricing", "quotation"],
      sender_patterns: ["sales@*", "*@quotes.*"],
      is_active: true,
      created_by: userId,
    },
    {
      org_id: orgId,
      name: "Receipt",
      description: "Purchase receipts and confirmations",
      color: "gray",
      keywords: ["receipt", "order confirmation", "purchase confirmation", "thank you for your order"],
      sender_patterns: ["*@receipts.*", "noreply@*"],
      is_active: true,
      created_by: userId,
    },
    {
      org_id: orgId,
      name: "Urgent",
      description: "Time-sensitive emails requiring immediate attention",
      color: "red",
      keywords: ["urgent", "asap", "immediate", "action required", "past due", "final notice"],
      sender_patterns: [],
      is_active: true,
      created_by: userId,
    },
    {
      org_id: orgId,
      name: "Shipping",
      description: "Shipping notifications and tracking updates",
      color: "blue",
      keywords: ["shipped", "tracking", "delivery", "in transit", "out for delivery", "package"],
      sender_patterns: ["*@fedex.com", "*@ups.com", "*@usps.com", "*@dhl.com"],
      is_active: true,
      created_by: userId,
    },
    {
      org_id: orgId,
      name: "Contract",
      description: "Contracts, agreements, and legal documents",
      color: "gray",
      keywords: ["contract", "agreement", "terms", "signature required", "docusign", "sign"],
      sender_patterns: ["*@docusign.com", "*@hellosign.com", "legal@*"],
      is_active: true,
      created_by: userId,
    },
  ]

  const { data: categories, error: catError } = await supabase
    .from("email_categories")
    .upsert(defaultCategories, { onConflict: "org_id,name" })
    .select()

  if (catError) throw catError

  const categoryMap = Object.fromEntries(
    (categories || []).map((c) => [c.name, c.id])
  )

  // Check if emails already exist to avoid re-seeding
  const { count: existingEmailCount } = await supabase
    .from("detected_emails")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("integration_id", integrationId)

  // Skip seeding if emails already exist for this integration
  if (existingEmailCount && existingEmailCount > 0) {
    return {
      categoriesCount: categories?.length || 0,
      emailsCount: 0, // No new emails seeded
    }
  }

  // Create comprehensive mock emails
  const now = new Date()
  const mockEmails = [
    // Recent - today/yesterday
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-1",
      subject: "URGENT: Invoice #INV-2026-0142 Past Due - Action Required",
      sender_email: "billing@acme.com",
      sender_name: "Acme Corp Billing",
      received_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      snippet: "Your invoice for $2,450.00 is now past due. Please submit payment immediately to avoid service interruption. Invoice details attached...",
      category_id: categoryMap["Urgent"] || null,
      auto_categorized: true,
      confidence_score: 0.96,
      is_read: false,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-2",
      subject: "Invoice #INV-2026-0158 from CloudHost Services",
      sender_email: "billing@cloudhost.io",
      sender_name: "CloudHost Billing",
      received_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      snippet: "Your monthly hosting invoice is ready. Amount: $1,299.00. Services: 5x Production Servers, 2TB Storage, CDN...",
      category_id: categoryMap["Invoice"] || null,
      auto_categorized: true,
      confidence_score: 0.94,
      is_read: false,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-3",
      subject: "Your package is out for delivery",
      sender_email: "tracking@fedex.com",
      sender_name: "FedEx",
      received_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      snippet: "Good news! Your package from Office Depot is out for delivery today. Tracking #: 7892341567890. Expected by 5:00 PM...",
      category_id: categoryMap["Shipping"] || null,
      auto_categorized: true,
      confidence_score: 0.98,
      is_read: true,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-4",
      subject: "January Electric Bill - Account #445566",
      sender_email: "noreply@austinenergy.com",
      sender_name: "Austin Energy",
      received_at: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
      snippet: "Your bill for $485.33 is due on February 1st. Usage this month: 2,847 kWh. View your detailed bill online...",
      category_id: categoryMap["Utility Bill"] || null,
      auto_categorized: true,
      confidence_score: 0.95,
      is_read: false,
      is_archived: false,
    },
    // This week
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-5",
      subject: "Contract Ready for Signature - Office Lease Renewal",
      sender_email: "noreply@docusign.com",
      sender_name: "DocuSign",
      received_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      snippet: "Your document is ready for signature. Property Management Co. has sent you 'Office Lease Renewal Agreement 2026'...",
      category_id: categoryMap["Contract"] || null,
      auto_categorized: true,
      confidence_score: 0.97,
      is_read: false,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-6",
      subject: "Quote Request: Office Supplies Bulk Order",
      sender_email: "sales@officemax.com",
      sender_name: "OfficeMax Sales",
      received_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Thank you for your inquiry. Please find attached our quote for 500 units of printer paper, 100 ink cartridges...",
      category_id: categoryMap["Vendor Quote"] || null,
      auto_categorized: true,
      confidence_score: 0.88,
      is_read: true,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-7",
      subject: "Water Bill - Account #789456 - December 2025",
      sender_email: "billing@waterutility.gov",
      sender_name: "City Water Utility",
      received_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Your water bill for December 2025 is $127.50. Usage: 4,500 gallons. Payment due by January 25, 2026...",
      category_id: categoryMap["Utility Bill"] || null,
      auto_categorized: true,
      confidence_score: 0.91,
      is_read: true,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-8",
      subject: "Your FedEx shipment has been delivered",
      sender_email: "tracking@fedex.com",
      sender_name: "FedEx",
      received_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Your package has been delivered! Delivered to: Front Door. Signed by: J. SMITH. Tracking #: 7891234567890...",
      category_id: categoryMap["Shipping"] || null,
      auto_categorized: true,
      confidence_score: 0.97,
      is_read: true,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-9",
      subject: "Order Confirmation #ORD-98765",
      sender_email: "noreply@amazon.com",
      sender_name: "Amazon",
      received_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Thank you for your order! Your order #ORD-98765 has been confirmed. Items: HP LaserJet Toner (3), USB-C Cables (10)...",
      category_id: categoryMap["Receipt"] || null,
      auto_categorized: true,
      confidence_score: 0.85,
      is_read: true,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-10",
      subject: "Meeting Request: Q1 Budget Review",
      sender_email: "cfo@company.com",
      sender_name: "Sarah Johnson (CFO)",
      received_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Hi team, I'd like to schedule a meeting to review our Q1 budget projections. Please confirm your availability for next Tuesday...",
      category_id: null, // Uncategorized
      auto_categorized: false,
      confidence_score: null,
      is_read: true,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-11",
      subject: "Invoice #5567 - Monthly Software Subscription",
      sender_email: "billing@slack.com",
      sender_name: "Slack Billing",
      received_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Your Slack invoice for January 2026 is ready. Amount: $850.00 (50 users x $17/user). Due date: February 5, 2026...",
      category_id: categoryMap["Invoice"] || null,
      auto_categorized: true,
      confidence_score: 0.94,
      is_read: false,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-12",
      subject: "Price Quote: Industrial Shelving Units",
      sender_email: "sales@industrialsupplies.com",
      sender_name: "Industrial Supplies Co",
      received_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "As requested, here is our quote for 10 heavy-duty shelving units. Total: $4,250 with free delivery. Valid for 30 days...",
      category_id: categoryMap["Vendor Quote"] || null,
      auto_categorized: true,
      confidence_score: 0.89,
      is_read: true,
      is_archived: false,
    },
    // Last week
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-13",
      subject: "FINAL NOTICE: Insurance Premium Due",
      sender_email: "billing@insuranceco.com",
      sender_name: "Insurance Co",
      received_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "This is your final notice. Your business insurance premium of $3,200.00 is due immediately. Failure to pay may result in policy cancellation...",
      category_id: categoryMap["Urgent"] || null,
      auto_categorized: true,
      confidence_score: 0.95,
      is_read: true,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-14",
      subject: "Receipt: Staples Order #ST-445566",
      sender_email: "orders@staples.com",
      sender_name: "Staples",
      received_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Thank you for your purchase! Order Total: $234.99. Items: Desk Chair (1), Monitor Stand (2), Keyboard Tray (1)...",
      category_id: categoryMap["Receipt"] || null,
      auto_categorized: true,
      confidence_score: 0.92,
      is_read: true,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-15",
      subject: "Vendor Agreement - Tech Solutions Inc",
      sender_email: "contracts@techsolutions.com",
      sender_name: "Tech Solutions Legal",
      received_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Please review and sign the attached Master Services Agreement for IT support services. Agreement term: 12 months...",
      category_id: categoryMap["Contract"] || null,
      auto_categorized: true,
      confidence_score: 0.91,
      is_read: false,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-16",
      subject: "Natural Gas Bill - January 2026",
      sender_email: "billing@texasgas.com",
      sender_name: "Texas Gas",
      received_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Your natural gas bill for January 2026 is $312.45. Usage: 89 therms. Due date: February 15, 2026...",
      category_id: categoryMap["Utility Bill"] || null,
      auto_categorized: true,
      confidence_score: 0.93,
      is_read: true,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-17",
      subject: "Quote: Bulk Paper Supplies - 2026 Contract",
      sender_email: "enterprise@papersupply.com",
      sender_name: "Paper Supply Co",
      received_at: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Annual contract quote for bulk paper supplies. Estimated annual savings: $2,400. Includes monthly delivery and flexible ordering...",
      category_id: categoryMap["Vendor Quote"] || null,
      auto_categorized: true,
      confidence_score: 0.87,
      is_read: true,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-18",
      subject: "Your UPS package has shipped",
      sender_email: "mcinfo@ups.com",
      sender_name: "UPS",
      received_at: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Your package from Dell Technologies is on its way! Tracking #: 1Z999AA10123456784. Estimated delivery: January 22, 2026...",
      category_id: categoryMap["Shipping"] || null,
      auto_categorized: true,
      confidence_score: 0.96,
      is_read: true,
      is_archived: false,
    },
    // Older
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-19",
      subject: "Invoice #INV-8834 - Monthly Cleaning Service",
      sender_email: "billing@cleanpro.com",
      sender_name: "CleanPro Services",
      received_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Invoice for January 2026 cleaning services. Amount: $650.00. Service dates: Jan 2, 9, 16, 23, 30. Payment due: Feb 10, 2026...",
      category_id: categoryMap["Invoice"] || null,
      auto_categorized: true,
      confidence_score: 0.93,
      is_read: true,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-20",
      subject: "Team Lunch This Friday?",
      sender_email: "mike@company.com",
      sender_name: "Mike Chen",
      received_at: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Hey everyone! Want to do a team lunch this Friday to celebrate finishing the Q4 project? I was thinking that new Italian place...",
      category_id: null, // Uncategorized
      auto_categorized: false,
      confidence_score: null,
      is_read: true,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-21",
      subject: "Receipt: Adobe Creative Cloud Subscription",
      sender_email: "mail@adobe.com",
      sender_name: "Adobe",
      received_at: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Thank you for your payment. Adobe Creative Cloud - All Apps subscription renewed. Amount: $599.88/year. Next billing: Jan 2027...",
      category_id: categoryMap["Receipt"] || null,
      auto_categorized: true,
      confidence_score: 0.88,
      is_read: true,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-22",
      subject: "Internet Service Bill - Business Premium",
      sender_email: "billing@spectrum.com",
      sender_name: "Spectrum Business",
      received_at: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Your Spectrum Business bill is ready. Amount due: $189.99. Services: 500Mbps Internet, Static IP, Phone. Due: Feb 1, 2026...",
      category_id: categoryMap["Utility Bill"] || null,
      auto_categorized: true,
      confidence_score: 0.90,
      is_read: true,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-23",
      subject: "Equipment Rental Quote - Forklift & Pallet Jacks",
      sender_email: "rentals@equipmentdepot.com",
      sender_name: "Equipment Depot",
      received_at: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Quote for warehouse equipment rental: Forklift (monthly): $850, Pallet Jacks (2): $120/month. Includes delivery and pickup...",
      category_id: categoryMap["Vendor Quote"] || null,
      auto_categorized: true,
      confidence_score: 0.86,
      is_read: true,
      is_archived: false,
    },
    {
      org_id: orgId,
      integration_id: integrationId,
      provider_email_id: "mock-email-24",
      subject: "Action Required: Renew Business License",
      sender_email: "noreply@city.gov",
      sender_name: "City Business Services",
      received_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      snippet: "Your business license expires on March 1, 2026. Please renew online or in person. Renewal fee: $175. Late fee: $50...",
      category_id: categoryMap["Urgent"] || null,
      auto_categorized: true,
      confidence_score: 0.84,
      is_read: false,
      is_archived: false,
    },
  ]

  const { data: emails, error: emailError } = await supabase
    .from("detected_emails")
    .insert(mockEmails)
    .select()

  if (emailError) throw emailError

  return {
    categoriesCount: categories?.length || 0,
    emailsCount: emails?.length || 0,
  }
}

/**
 * Seeds forwarding rules for an organization.
 */
export async function seedForwardingRules({
  orgId,
  userId,
}: {
  orgId: string
  userId: string
}): Promise<number> {
  // Get existing categories
  const { data: categories, error: catError } = await supabase
    .from("email_categories")
    .select("id, name")
    .eq("org_id", orgId)

  if (catError) throw catError
  if (!categories || categories.length === 0) return 0

  // Check for existing rules to avoid duplicates
  const { data: existingRules } = await supabase
    .from("email_forwarding_rules")
    .select("name")
    .eq("org_id", orgId)

  const existingRuleNames = new Set((existingRules || []).map((r) => r.name))

  const categoryMap = Object.fromEntries(
    categories.map((c) => [c.name, c.id])
  )

  const allRules = [
    {
      org_id: orgId,
      name: "Invoice Alerts",
      description: "Notify finance team when invoices arrive",
      category_id: categoryMap["Invoice"],
      notify_roles: ["finance", "org_admin"],
      notify_user_ids: [],
      notify_in_app: true,
      forward_email: true,
      is_active: true,
      created_by: userId,
    },
    {
      org_id: orgId,
      name: "Urgent Email Notifications",
      description: "Immediately alert admins for urgent emails",
      category_id: categoryMap["Urgent"],
      notify_roles: ["org_admin"],
      notify_user_ids: [],
      notify_in_app: true,
      forward_email: true,
      is_active: true,
      created_by: userId,
    },
    {
      org_id: orgId,
      name: "Utility Bill Reminders",
      description: "Notify finance when utility bills arrive",
      category_id: categoryMap["Utility Bill"],
      notify_roles: ["finance"],
      notify_user_ids: [],
      notify_in_app: true,
      forward_email: false,
      is_active: true,
      created_by: userId,
    },
    {
      org_id: orgId,
      name: "Vendor Quotes for Inventory",
      description: "Forward vendor quotes to inventory team",
      category_id: categoryMap["Vendor Quote"],
      notify_roles: ["inventory"],
      notify_user_ids: [],
      notify_in_app: true,
      forward_email: false,
      is_active: true,
      created_by: userId,
    },
    {
      org_id: orgId,
      name: "Contract Review",
      description: "Alert admins when contracts need review",
      category_id: categoryMap["Contract"],
      notify_roles: ["org_admin"],
      notify_user_ids: [],
      notify_in_app: true,
      forward_email: true,
      is_active: false, // Disabled example
      created_by: userId,
    },
  ]

  // Filter to only rules with valid categories and not already existing
  const rules = allRules.filter(
    (rule) => rule.category_id && !existingRuleNames.has(rule.name)
  )

  if (rules.length === 0) return 0

  const { data, error } = await supabase
    .from("email_forwarding_rules")
    .insert(rules)
    .select()

  if (error) throw error

  return data?.length || 0
}

/**
 * Seeds a second mock email integration for demo purposes.
 */
export async function seedSecondEmailAccount({
  orgId,
  userId,
}: {
  orgId: string
  userId: string
}): Promise<string | null> {
  // Check if this account already exists
  const { data: existing } = await supabase
    .from("email_integrations")
    .select("id")
    .eq("org_id", orgId)
    .eq("email_address", "finance@company.com")
    .single()

  if (existing) return existing.id

  const { data, error } = await supabase
    .from("email_integrations")
    .insert({
      org_id: orgId,
      user_id: userId,
      provider: "outlook",
      email_address: "finance@company.com",
      is_active: true,
      last_sync_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
      // Mock tokens for demo
      access_token: "mock_access_token_outlook",
      refresh_token: "mock_refresh_token_outlook",
      token_expires_at: new Date(Date.now() + 3600000).toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  return data?.id || null
}
