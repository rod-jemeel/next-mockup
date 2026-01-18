import { NextRequest } from "next/server"
import { requireOrgAccess } from "@/lib/server/auth-helpers"
import { ApiError, validationError } from "@/lib/errors"
import {
  createDepartmentSchema,
  listDepartmentsSchema,
} from "@/lib/validations/departments"
import {
  listDepartments,
  createDepartment,
} from "@/lib/server/services/departments"

type RouteContext = { params: Promise<{ orgId: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { orgId } = await context.params
    const { org } = await requireOrgAccess(orgId)

    const searchParams = request.nextUrl.searchParams
    const query = listDepartmentsSchema.safeParse({
      includeInactive: searchParams.get("includeInactive"),
    })

    if (!query.success) {
      return validationError(query.error.issues).toResponse()
    }

    const data = await listDepartments({ orgId: org.id, query: query.data })
    return Response.json({ data })
  } catch (error) {
    if (error instanceof ApiError) return error.toResponse()
    console.error("List departments error:", error)
    return new ApiError("INTERNAL_ERROR", "Failed to list departments").toResponse()
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { orgId } = await context.params
    const { org, session } = await requireOrgAccess(orgId, ["org_admin"])

    const body = await request.json()
    const result = createDepartmentSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const department = await createDepartment({
      orgId: org.id,
      userId: session.user.id,
      data: result.data,
    })
    return Response.json({ data: department }, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) return error.toResponse()
    console.error("Create department error:", error)
    return new ApiError("INTERNAL_ERROR", "Failed to create department").toResponse()
  }
}
