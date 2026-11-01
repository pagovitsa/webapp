export type DashboardRole = "user" | "admin";
export type DashboardPermission = "dashboard.read" | "administration.read";
export type DashboardIcon = "folder" | "grid" | "settings";
export type DashboardAccess = { readonly role: string; readonly enabled: boolean; readonly permissions: readonly string[] };
export type NavigationItem = { readonly id: string; readonly title: string; readonly path: string; readonly permission: DashboardPermission };
export type NavigationCategory = { readonly id: string; readonly title: string; readonly icon: DashboardIcon; readonly permission: DashboardPermission; readonly children: readonly NavigationItem[] };

export function permissionsFor(access: DashboardAccess | null, moduleEnabled: boolean): readonly DashboardPermission[] {
  if (!moduleEnabled || !access?.enabled) return [];
  if (access.role !== "admin" && access.role !== "user") return [];
  return access.permissions.filter((permission): permission is DashboardPermission =>
    permission === "dashboard.read" || permission === "administration.read");
}

export function visibleNavigation(categories: readonly NavigationCategory[], permissions: readonly DashboardPermission[]): readonly NavigationCategory[] {
  return categories.filter(category => permissions.includes(category.permission))
    .map(category => ({ ...category, children: category.children.filter(item => permissions.includes(item.permission)) }))
    .filter(category => category.children.length > 0);
}
