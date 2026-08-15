export const SUPPORT_SETTINGS_OPENAPI_ROUTE_SNAPSHOT = {
  "/api/admin/link-reports": ["get"],
  "/api/admin/link-reports/{id}": ["delete", "get", "patch"],
  "/api/admin/settings/appearance": ["get", "patch"],
  "/api/admin/settings/business": ["get", "patch"],
  "/api/business-config": ["get"],
  "/api/member/snippets": ["get", "post"],
  "/api/member/snippets/{id}": ["delete", "get", "patch"],
  "/api/public/link-reports": ["post"],
  "/api/site-config": ["get"],
} as const;
