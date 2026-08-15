import type { Request } from "express";

import type { AuditRequestContext } from "../../modules/audit/audit.service";

export function auditRequestContext(request: Request): AuditRequestContext {
  const forwarded = request.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(",")[0]?.trim();
  return {
    ipAddress: forwardedIp || request.ip || null,
    userAgent: request.get("user-agent") || null,
  };
}
