export type DashboardRole = "user" | "admin";
export type DashboardIcon = "folder" | "grid" | "settings";
export type DashboardItem = { readonly id: string; readonly title: string; readonly path: string };
export type DashboardCategory = { readonly id: string; readonly title: string; readonly icon: DashboardIcon; readonly children: readonly DashboardItem[] };
export type DashboardView = {
  readonly username: string;
  readonly role: DashboardRole;
  readonly categories: readonly DashboardCategory[];
  readonly selected: DashboardItem;
};
export type DashboardResult =
  | { readonly status: "anonymous" | "forbidden" | "not-found" }
  | { readonly status: "ready"; readonly dashboard: DashboardView };
