import { NextRequest } from "next/server"
import { connection, after } from "next/server"
import { z } from "zod"
import { requireSuperadmin } from "@/lib/server/auth-helpers"
import { handleError, validationError } from "@/lib/errors"
import { createEmailCategory } from "@/lib/server/services/email-categories"

const createSchema = z.object({
  orgId: z.string().uuid("Invalid organization ID"),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6b7280"),
  keywords: z.array(z.string()).optional(),
})

/**
 * POST /api/super/email-categories
 * Create an email category for any organization (superadmin only)
 */
export async function POST(request: NextRequest) {
  await connection()

  try {
    const session = await requireSuperadmin()

    const body = await request.json()
    const result = createSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const { orgId, ...categoryData } = result.data

    const category = await createEmailCategory({
      orgId,
      userId: session.user.id,
      data: categoryData,
    })

    after(async () => {
      console.log(
        `[AUDIT] Superadmin ${session.user.email} created email category "${categoryData.name}" for org ${orgId}`
      )
    })

    return Response.json({ data: category }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
