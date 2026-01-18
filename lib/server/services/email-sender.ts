import { supabase } from "@/lib/server/db"

interface SendEmailInput {
  to: string
  toUserId?: string
  subject: string
  html: string
  text?: string
  orgId: string
  sourceType: "forwarding_rule"
  sourceId?: string
  relatedEmailId?: string
}

interface SendEmailResult {
  success: boolean
  provider: "resend" | "mock"
  messageId?: string
  error?: string
}

/**
 * Check if we're in mock mode (no RESEND_API_KEY)
 */
export function isEmailMockMode(): boolean {
  return !process.env.RESEND_API_KEY
}

/**
 * Send an email using Resend or mock mode
 * In mock mode, logs to console and stores in email_send_log with status='mock'
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const isMock = isEmailMockMode()

  if (isMock) {
    return sendMockEmail(input)
  }

  return sendResendEmail(input)
}

/**
 * Mock email sender - logs to console and stores in database
 */
async function sendMockEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const mockId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  // Log to console with nice formatting
  console.log("\n" + "=".repeat(60))
  console.log("📧 MOCK EMAIL SENT (No RESEND_API_KEY configured)")
  console.log("=".repeat(60))
  console.log(`To:      ${input.to}`)
  console.log(`Subject: ${input.subject}`)
  console.log("-".repeat(60))
  console.log("Body (text):")
  console.log(input.text || "(no text version)")
  console.log("-".repeat(60))
  console.log(`Mock ID: ${mockId}`)
  console.log("=".repeat(60) + "\n")

  // Store in email_send_log
  try {
    await supabase.from("email_send_log").insert({
      org_id: input.orgId,
      to_email: input.to,
      to_user_id: input.toUserId || null,
      subject: input.subject,
      source_type: input.sourceType,
      source_id: input.sourceId || null,
      related_email_id: input.relatedEmailId || null,
      status: "mock",
      provider: "mock",
      provider_id: mockId,
    })
  } catch (error) {
    console.error("Failed to log mock email:", error)
  }

  return {
    success: true,
    provider: "mock",
    messageId: mockId,
  }
}

/**
 * Real email sender using Resend
 */
async function sendResendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY!

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "notifications@resend.dev",
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to send email")
    }

    // Store in email_send_log
    await supabase.from("email_send_log").insert({
      org_id: input.orgId,
      to_email: input.to,
      to_user_id: input.toUserId || null,
      subject: input.subject,
      source_type: input.sourceType,
      source_id: input.sourceId || null,
      related_email_id: input.relatedEmailId || null,
      status: "sent",
      provider: "resend",
      provider_id: data.id,
    })

    return {
      success: true,
      provider: "resend",
      messageId: data.id,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    // Log failed attempt
    try {
      await supabase.from("email_send_log").insert({
        org_id: input.orgId,
        to_email: input.to,
        to_user_id: input.toUserId || null,
        subject: input.subject,
        source_type: input.sourceType,
        source_id: input.sourceId || null,
        related_email_id: input.relatedEmailId || null,
        status: "failed",
        provider: "resend",
        error_message: errorMessage,
      })
    } catch {
      console.error("Failed to log email error:", error)
    }

    return {
      success: false,
      provider: "resend",
      error: errorMessage,
    }
  }
}

/**
 * Generate HTML email template for forwarded emails
 */
export function generateForwardedEmailHtml(params: {
  originalSubject: string
  originalSender: string
  originalSenderEmail: string
  originalSnippet: string
  categoryName: string
  ruleName: string
  receivedAt: string
  appUrl: string
  emailId: string
}): { html: string; text: string } {
  const {
    originalSubject,
    originalSender,
    originalSenderEmail,
    originalSnippet,
    categoryName,
    ruleName,
    receivedAt,
    appUrl,
    emailId,
  } = params

  const viewUrl = `${appUrl}/inbox?email=${emailId}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forwarded Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">
      📧 Forwarded by rule: <strong>${ruleName}</strong>
    </p>
    <p style="margin: 0; font-size: 12px; color: #666;">
      Category: <span style="background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${categoryName}</span>
    </p>
  </div>

  <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #1a1a1a;">
      ${originalSubject}
    </h2>

    <div style="font-size: 14px; color: #666; margin-bottom: 16px;">
      <strong>From:</strong> ${originalSender} &lt;${originalSenderEmail}&gt;<br>
      <strong>Received:</strong> ${new Date(receivedAt).toLocaleString()}
    </div>

    <div style="background: #fafafa; border-radius: 4px; padding: 16px; font-size: 14px; color: #444;">
      ${originalSnippet}
    </div>
  </div>

  <div style="margin-top: 20px; text-align: center;">
    <a href="${viewUrl}" style="display: inline-block; background: #1976d2; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500;">
      View Full Email
    </a>
  </div>

  <p style="margin-top: 24px; font-size: 12px; color: #999; text-align: center;">
    This email was automatically forwarded based on your organization's forwarding rules.
  </p>
</body>
</html>
  `.trim()

  const text = `
Forwarded by rule: ${ruleName}
Category: ${categoryName}

---

Subject: ${originalSubject}
From: ${originalSender} <${originalSenderEmail}>
Received: ${new Date(receivedAt).toLocaleString()}

${originalSnippet}

---

View full email: ${viewUrl}

This email was automatically forwarded based on your organization's forwarding rules.
  `.trim()

  return { html, text }
}
