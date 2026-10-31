import type { IdentityGateway } from "../ports/identity-gateway";

export function makeSignOut({ gateway }: { gateway: IdentityGateway }) {
  return async function signOut(): Promise<void> { await gateway.signOut(); };
}
