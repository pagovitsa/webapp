import type { IdentityGateway } from "../ports/identity-gateway";

export function makeGetCurrentUser({ gateway }: { gateway: IdentityGateway }) {
  return async function getCurrentUser() { return gateway.currentUser(); };
}
