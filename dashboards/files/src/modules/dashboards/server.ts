import "server-only";
import { makeGetDashboard } from "./application/use-cases/get-dashboard";
import { UsersDashboardIdentityGateway } from "./infrastructure/integrations/users-dashboard-identity-gateway";
import { PrismaDashboardAccessRepository } from "./infrastructure/persistence/prisma-dashboard-access-repository";
import type { DashboardResult } from "./contracts";

const get = makeGetDashboard({
  gateway: new UsersDashboardIdentityGateway(),
  repository: new PrismaDashboardAccessRepository(),
  enabled: true,
});
export async function getDashboard(section = ""): Promise<DashboardResult> {
  const result = await get(section);
  if (result.status !== "ready") return result;
  const { dashboard } = result;
  return { status: "ready", dashboard: {
    username: dashboard.username, role: dashboard.role,
    selected: { id: dashboard.selected.id, title: dashboard.selected.title, path: dashboard.selected.path },
    categories: dashboard.categories.map(category => ({
      id: category.id, title: category.title, icon: category.icon,
      children: category.children.map(item => ({ id: item.id, title: item.title, path: item.path })),
    })),
  } };
}
