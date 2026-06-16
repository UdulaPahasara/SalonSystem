const ROLE_DASHBOARD_PATHS = {
  Owner: "/admin-dashboard",
  "Branch Manager": "/branch-dashboard",
  Reception: "/reception-dashboard",
  "Product Manager": "/pm-dashboard",
  Cashier: "/cashier",
  Chashire: "/cashier",
};

export function getDashboardPathForRole(roleName) {
  if (!roleName) return null;
  return ROLE_DASHBOARD_PATHS[roleName] ?? null;
}

export function getRoleDisplayName(roleName) {
  if (roleName === "Cashier" || roleName === "Chashire") return "Cashier";
  return roleName;
}
