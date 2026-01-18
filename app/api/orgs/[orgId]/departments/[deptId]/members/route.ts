import { NextRequest } from "next/server"
import { requireOrgAccess } from "@/lib/server/auth-helpers"
import { ApiError, validationError } from "@/lib/errors"
import { addDepartmentMemberSchema } from "@/lib/validations/departments"
import {
  listDepartmentMembers,
  addDepartmentMember,
  isDepartmentManager,
} from "@/lib/server/services/departments"

type RouteContext = { params: Promise<{ orgId: string; deptId: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { orgId, deptId } = await context.params
    const { org } = await requireOrgAccess(orgId)

    const data = await listDepartmentMembers({ deptId, orgId: org.id })
    return Response.json({ data })
  } catch (error) {
    if (error instanceof ApiError) return error.toResponse()
    console.error("List department members error:", error)
    return new ApiError("INTERNAL_ERROR", "Failed to list department members").toResponse()
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { orgId, deptId } = await context.params
    const { org, session, membership, isSuperadmin } = await requireOrgAccess(orgId)

    // Check if user is org_admin, superadmin, or department manager
    const userRoles = membership?.role.split(",") || []
    const isOrgAdmin = isSuperadmin || userRoles.includes("org_admin") || userRoles.includes("owner")
    const isManager = await isDepartmentManager({
      userId: session.user.id,
      deptId,
    })

    if (!isOrgAdmin && !isManager) {
      throw new ApiError("ROLE_REQUIRED", "Must be org admin or department manager")
    }

    const body = await request.json()
    const result = addDepartmentMemberSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    // Only org_admin can set isManager to true
    if (result.data.isManager && !isOrgAdmin) {
      throw new ApiError("ROLE_REQUIRED", "Only org admin can promote to department manager")
    }

    const member = await addDepartmentMember({
      deptId,
      orgId: org.id,
      addedBy: session.user.id,
      data: result.data,
    })
    return Response.json({ data: member }, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) return error.toResponse()
    console.error("Add department member error:", error)
    return new ApiError("INTERNAL_ERROR", "Failed to add department member").toResponse()
  }
}
