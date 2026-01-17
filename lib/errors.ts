/**
 * Standard API error codes with corresponding HTTP status codes
 */
export const ERROR_CODES = {
  // Authentication (401)
  UNAUTHORIZED: { status: 401, message: "Authentication required" },

  // Authorization (403)
  FORBIDDEN: { status: 403, message: "Access denied" },
  NOT_MEMBER: { status: 403, message: "Not a member of this organization" },
  ROLE_REQUIRED: { status: 403, message: "Insufficient role permissions" },
  SUPERADMIN_REQUIRED: { status: 403, message: "Superadmin access required" },

  // Not Found (404)
  NOT_FOUND: { status: 404, message: "Resource not found" },
  ORG_NOT_FOUND: { status: 404, message: "Organization not found" },
  EXPENSE_NOT_FOUND: { status: 404, message: "Expense not found" },
  ITEM_NOT_FOUND: { status: 404, message: "Inventory item not found" },
  ATTACHMENT_NOT_FOUND: { status: 404, message: "Attachment not found" },

  // Validation (400)
  VALIDATION_ERROR: { status: 400, message: "Validation failed" },
  INVALID_REQUEST: { status: 400, message: "Invalid request" },

  // Conflict (409)
  ALREADY_EXISTS: { status: 409, message: "Resource already exists" },

  // Server Error (500)
  INTERNAL_ERROR: { status: 500, message: "Internal server error" },
  DATABASE_ERROR: { status: 500, message: "Database operation failed" },
} as const

export type ErrorCode = keyof typeof ERROR_CODES

/**
 * Standard API error class for consistent error responses
 */
export class ApiError extends Error {
  public readonly code: ErrorCode
  public readonly status: number

  constructor(code: ErrorCode, message?: string) {
    const errorInfo = ERROR_CODES[code]
    super(message || errorInfo.message)
    this.code = code
    this.status = errorInfo.status
    this.name = "ApiError"
  }

  /**
   * Convert to a Response object for Route Handlers
   */
  toResponse(): Response {
    return Response.json(
      { error: { code: this.code, message: this.message } },
      { status: this.status }
    )
  }
}

/**
 * Create a validation error response from Zod errors
 */
export function validationError(
  errors: { path: PropertyKey[]; message: string }[]
): ApiError {
  const messages = errors.map((e) => `${e.path.map(String).join(".")}: ${e.message}`)
  return new ApiError("VALIDATION_ERROR", messages.join("; "))
}

/**
 * Helper to handle unknown errors in catch blocks
 */
export function handleError(error: unknown): Response {
  if (error instanceof ApiError) {
    return error.toResponse()
  }

  console.error("Unexpected error:", error)
  return new ApiError("INTERNAL_ERROR").toResponse()
}
