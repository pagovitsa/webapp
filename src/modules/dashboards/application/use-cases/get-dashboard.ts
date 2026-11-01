import { permissionsFor, visibleNavigation } from "../../domain/access";
import { navigation } from "../../domain/navigation";
import type { DashboardAccessRepository, DashboardIdentityGateway } from "../ports/dashboard-access";

export function makeGetDashboard(deps: { repository: DashboardAccessRepository; gateway: DashboardIdentityGateway; enabled: boolean }) {
  return async function getDashboard(section = "") {
    const user = await deps.gateway.currentUser();
    if (!user) return { status: "anonymous" as const };
    const access = await deps.repository.findForUser(user.id);
    const permissions = permissionsFor(access, deps.enabled);
    if (!permissions.includes("dashboard.read") || !access || (access.role !== "admin" && access.role !== "user")) return { status: "forbidden" as const };
    const categories = visibleNavigation(navigation, permissions);
    const selected = section === ""
      ? { id: "overview", title: "Επισκόπηση", path: "" }
      : categories.flatMap(category => category.children).find(item => item.path === section);
    if (!selected) return { status: "not-found" as const };
    const role: "admin" | "user" = access.role;
    return { status: "ready" as const, dashboard: { username: user.username, role, categories, selected } };
  };
}
