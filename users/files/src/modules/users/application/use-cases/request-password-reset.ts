import type { IdentityGateway } from "../ports/identity-gateway";

export function makeRequestPasswordReset({ gateway }: { gateway: IdentityGateway }) {
  return async function requestPasswordReset(email: string): Promise<void> {
    await gateway.requestPasswordReset(email.trim().toLowerCase());
  };
}
