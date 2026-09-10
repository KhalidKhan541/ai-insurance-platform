import { UserRole } from "@prisma/client";

type Permission =
  | "users:read"
  | "users:write"
  | "users:delete"
  | "policies:read"
  | "policies:write"
  | "policies:delete"
  | "policies:approve"
  | "claims:read"
  | "claims:write"
  | "claims:delete"
  | "claims:approve"
  | "claims:adjust"
  | "customers:read"
  | "customers:write"
  | "customers:delete"
  | "agents:read"
  | "agents:write"
  | "agents:delete"
  | "insurers:read"
  | "insurers:write"
  | "insurers:delete"
  | "products:read"
  | "products:write"
  | "products:delete"
  | "underwriting:read"
  | "underwriting:write"
  | "underwriting:approve"
  | "fraud:read"
  | "fraud:write"
  | "fraud:investigate"
  | "reports:read"
  | "reports:write"
  | "reports:generate"
  | "dashboards:read"
  | "dashboards:write"
  | "dashboards:delete"
  | "communications:read"
  | "communications:write"
  | "communications:send"
  | "audit:read"
  | "settings:read"
  | "settings:write"
  | "billing:read"
  | "billing:write"
  | "legal:read"
  | "legal:write";

const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "users:read",
    "users:write",
    "users:delete",
    "policies:read",
    "policies:write",
    "policies:delete",
    "policies:approve",
    "claims:read",
    "claims:write",
    "claims:delete",
    "claims:approve",
    "claims:adjust",
    "customers:read",
    "customers:write",
    "customers:delete",
    "agents:read",
    "agents:write",
    "agents:delete",
    "insurers:read",
    "insurers:write",
    "insurers:delete",
    "products:read",
    "products:write",
    "products:delete",
    "underwriting:read",
    "underwriting:write",
    "underwriting:approve",
    "fraud:read",
    "fraud:write",
    "fraud:investigate",
    "reports:read",
    "reports:write",
    "reports:generate",
    "dashboards:read",
    "dashboards:write",
    "dashboards:delete",
    "communications:read",
    "communications:write",
    "communications:send",
    "audit:read",
    "settings:read",
    "settings:write",
    "billing:read",
    "billing:write",
    "legal:read",
    "legal:write",
  ],
  ADMIN: [
    "users:read",
    "users:write",
    "policies:read",
    "policies:write",
    "policies:approve",
    "claims:read",
    "claims:write",
    "claims:approve",
    "claims:adjust",
    "customers:read",
    "customers:write",
    "agents:read",
    "agents:write",
    "insurers:read",
    "insurers:write",
    "products:read",
    "products:write",
    "underwriting:read",
    "underwriting:write",
    "underwriting:approve",
    "fraud:read",
    "fraud:write",
    "fraud:investigate",
    "reports:read",
    "reports:write",
    "reports:generate",
    "dashboards:read",
    "dashboards:write",
    "communications:read",
    "communications:write",
    "communications:send",
    "audit:read",
    "settings:read",
    "settings:write",
    "billing:read",
    "billing:write",
    "legal:read",
    "legal:write",
  ],
  UNDERWRITER: [
    "policies:read",
    "policies:write",
    "claims:read",
    "claims:adjust",
    "customers:read",
    "underwriting:read",
    "underwriting:write",
    "fraud:read",
    "reports:read",
    "reports:generate",
    "dashboards:read",
    "dashboards:write",
    "communications:read",
    "communications:write",
  ],
  CLAIMS_ADJUSTER: [
    "policies:read",
    "claims:read",
    "claims:write",
    "claims:adjust",
    "customers:read",
    "fraud:read",
    "reports:read",
    "dashboards:read",
    "dashboards:write",
    "communications:read",
    "communications:write",
    "legal:read",
  ],
  AGENT: [
    "policies:read",
    "policies:write",
    "claims:read",
    "claims:write",
    "customers:read",
    "customers:write",
    "products:read",
    "reports:read",
    "dashboards:read",
    "dashboards:write",
    "communications:read",
    "communications:write",
    "communications:send",
    "billing:read",
  ],
  BROKER: [
    "policies:read",
    "policies:write",
    "claims:read",
    "claims:write",
    "customers:read",
    "customers:write",
    "products:read",
    "agents:read",
    "reports:read",
    "dashboards:read",
    "dashboards:write",
    "communications:read",
    "communications:write",
    "communications:send",
    "billing:read",
  ],
  CUSTOMER: [
    "policies:read",
    "claims:read",
    "claims:write",
    "customers:read",
    "dashboards:read",
    "communications:read",
    "communications:write",
    "billing:read",
  ],
  READ_ONLY: [
    "policies:read",
    "claims:read",
    "customers:read",
    "agents:read",
    "insurers:read",
    "products:read",
    "reports:read",
    "dashboards:read",
    "audit:read",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[role] ?? [];
  return permissions.includes(permission);
}

export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function getPermissionsForRole(role: UserRole): Permission[] {
  return rolePermissions[role] ?? [];
}

export function canAccessResource(
  role: UserRole,
  resource: string,
  action: "read" | "write" | "delete"
): boolean {
  const permission = `${resource}:${action}` as Permission;
  return hasPermission(role, permission);
}

export function canApproveClaims(role: UserRole): boolean {
  return hasPermission(role, "claims:approve");
}

export function canApprovePolicies(role: UserRole): boolean {
  return hasPermission(role, "policies:approve");
}

export function canInvestigateFraud(role: UserRole): boolean {
  return hasPermission(role, "fraud:investigate");
}

export function canManageUsers(role: UserRole): boolean {
  return hasPermission(role, "users:write");
}

export function canManageSettings(role: UserRole): boolean {
  return hasPermission(role, "settings:write");
}

export function canGenerateReports(role: UserRole): boolean {
  return hasPermission(role, "reports:generate");
}

export function canViewAuditLogs(role: UserRole): boolean {
  return hasPermission(role, "audit:read");
}

export type { Permission };
