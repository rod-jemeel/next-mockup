import { NextRequest } from "next/server"
import { requireOrgAccess } from "@/lib/server/auth-helpers"
import { ApiError, validationError } from "@/lib/errors"
import { updateDepartmentSchema } from "@/lib/validations/departments"
import {
  getDepartment,
  updateDepartment,
  deleteDepartment,
  isDepartmentManager,
} from "@/lib/server/services/departments"

type RouteContext = { params: Promise<{ orgId: string; deptId: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { orgId, deptId } = await context.params
    const { org } = await requireOrgAccess(orgId)

    const department = await getDepartment({ deptId, orgId: org.id })
    return Response.json({ data: department })
  } catch (error) {
    if (error instanceof ApiError) return error.toResponse()
    console.error("Get department error:", error)
    return new ApiError("INTERNAL_ERROR", "Failed to get department").toResponse()
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { orgId, deptId } = await context.params
    const { org, session, membership } = await requireOrgAccess(orgId)

    // Check if user is org_admin or department manager
    const userRoles = membership?.role.split(",") || []
    const isOrgAdmin = userRoles.includes("org_admin") || userRoles.includes("owner")
    const isManager = await isDepartmentManager({
      userId: session.user.id,
      deptId,
    })

    if (!isOrgAdmin && !isManager) {
      throw new ApiError("ROLE_REQUIRED", "Must be org admin or department manager")
    }

    const body = await request.json()
    const result = updateDepartmentSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    const department = await updateDepartment({
      deptId,
      orgId: org.id,
      data: result.data,
    })
    return Response.json({ data: department })
  } catch (error) {
    if (error instanceof ApiError) return error.toResponse()
    console.error("Update department error:", error)
    return new ApiError("INTERNAL_ERROR", "Failed to update department").toResponse()
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { orgId, deptId } = await context.params
    const { org } = await requireOrgAccess(orgId, ["org_admin"])

    await deleteDepartment({ deptId, orgId: org.id })
    return new Response(null, { status: 204 })
  } catch (error) {
    if (error instanceof ApiError) return error.toResponse()
    console.error("Delete department error:", error)
    return new ApiError("INTERNAL_ERROR", "Failed to delete department").toResponse()
  }
}
