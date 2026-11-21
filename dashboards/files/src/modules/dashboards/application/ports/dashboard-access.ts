import type { DashboardAccess } from "../../domain/access";

export interface DashboardAccessRepository {
  /** Reads the user's activation, role and its database permissions consistently; null if absent. Storage failures propagate. */
  findForUser(userId: string): Promise<DashboardAccess | null>;
}
export interface DashboardIdentityGateway {
  /** Resolves the current server session, or null. Never accepts identity from request input. */
  currentUser(): Promise<{ readonly id: string; readonly username: string } | null>;
}
