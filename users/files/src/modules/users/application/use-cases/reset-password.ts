import { UserError, validatePassword } from "../../domain/user";
import type { IdentityGateway } from "../ports/identity-gateway";

export function makeResetPassword({ gateway }: { gateway: IdentityGateway }) {
  return async function resetPassword(input: { token: string; password: string }): Promise<void> {
    if (!input.token.trim()) throw new UserError("Ο σύνδεσμος ανάκτησης δεν είναι έγκυρος.");
    await gateway.resetPassword({ token: input.token, password: validatePassword(input.password) });
  };
}
