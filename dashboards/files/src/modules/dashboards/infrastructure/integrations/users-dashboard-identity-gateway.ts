import { getCurrentUser } from "@/modules/users/server";
import type { DashboardIdentityGateway } from "../../application/ports/dashboard-access";

export class UsersDashboardIdentityGateway implements DashboardIdentityGateway {
  async currentUser() {
    const user = await getCurrentUser();
    return user ? { id: user.id, username: user.username } : null;
  }
}
