import { openAuthDatabase } from "@/server/database";
import type { DashboardAccessRepository } from "../../application/ports/dashboard-access";

export class PrismaDashboardAccessRepository implements DashboardAccessRepository {
  async findForUser(userId: string) {
    return openAuthDatabase().$transaction(async database => {
      const access = await database.dashboardAccess.findUnique({ where: { userId }, select: { role: true, enabled: true } });
      if (!access) return null;
      const grants = await database.dashboardRolePermission.findMany({ where: { role: access.role }, select: { permission: true } });
      return { ...access, permissions: grants.map(grant => grant.permission) };
    });
  }
}
