import { NextRequest } from "next/server"
import { requireOrgAccess } from "@/lib/server/auth-helpers"
import { ApiError, validationError } from "@/lib/errors"
import { updateDepartmentMemberSchema } from "@/lib/validations/departments"
import {
  updateDepartmentMember,
  removeDepartmentMember,
  isDepartmentManager,
} from "@/lib/server/services/departments"

type RouteContext = { params: Promise<{ orgId: string; deptId: string; memberId: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { orgId, deptId, memberId } = await context.params
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
    const result = updateDepartmentMemberSchema.safeParse(body)

    if (!result.success) {
      return validationError(result.error.issues).toResponse()
    }

    // Only org_admin can change isManager
    if (result.data.isManager !== undefined && !isOrgAdmin) {
      throw new ApiError("ROLE_REQUIRED", "Only org admin can change manager status")
    }

    const member = await updateDepartmentMember({
      memberId,
      deptId,
      orgId: org.id,
      data: result.data,
    })
    return Response.json({ data: member })
  } catch (error) {
    if (error instanceof ApiError) return error.toResponse()
    console.error("Update department member error:", error)
    return new ApiError("INTERNAL_ERROR", "Failed to update department member").toResponse()
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { orgId, deptId, memberId } = await context.params
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

    await removeDepartmentMember({ memberId, deptId, orgId: org.id })
    return new Response(null, { status: 204 })
  } catch (error) {
    if (error instanceof ApiError) return error.toResponse()
    console.error("Remove department member error:", error)
    return new ApiError("INTERNAL_ERROR", "Failed to remove department member").toResponse()
  }
}
