import { registrationData, type Registration } from "../../domain/user";
import type { IdentityGateway } from "../ports/identity-gateway";

export function makeRegisterUser({ gateway }: { gateway: IdentityGateway }) {
  return async function registerUser(input: Registration): Promise<void> {
    await gateway.register(registrationData(input));
  };
}
