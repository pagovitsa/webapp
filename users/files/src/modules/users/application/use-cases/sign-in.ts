import type { IdentityGateway } from "../ports/identity-gateway";

export function makeSignIn({ gateway }: { gateway: IdentityGateway }) {
  return async function signIn(input: { username: string; password: string }): Promise<void> {
    await gateway.signIn({ username: input.username.trim().toLowerCase(), password: input.password });
  };
}
