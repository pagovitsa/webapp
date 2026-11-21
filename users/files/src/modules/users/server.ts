import "server-only";
import { headers } from "next/headers";
import { makeRegisterUser } from "./application/use-cases/register-user";
import { makeSignIn } from "./application/use-cases/sign-in";
import { makeSignOut } from "./application/use-cases/sign-out";
import { makeGetCurrentUser } from "./application/use-cases/get-current-user";
import { makeRequestPasswordReset } from "./application/use-cases/request-password-reset";
import { makeResetPassword } from "./application/use-cases/reset-password";
import { BetterAuthIdentityGateway } from "./infrastructure/integrations/better-auth-identity-gateway";
import { handleAuthHttp } from "./infrastructure/integrations/auth-http";
import type { PasswordResetInput, RegisterUserInput, SignInInput, UserProfile } from "./contracts";

export { UserError } from "./domain/user";
const gateway = new BetterAuthIdentityGateway(async () => new Headers(await headers()));
const register = makeRegisterUser({ gateway });
const login = makeSignIn({ gateway });
const logout = makeSignOut({ gateway });
const current = makeGetCurrentUser({ gateway });
const requestReset = makeRequestPasswordReset({ gateway });
const reset = makeResetPassword({ gateway });

export async function registerUser(input: RegisterUserInput): Promise<void> { await register(input); }
export async function signIn(input: SignInInput): Promise<void> { await login(input); }
export async function signOut(): Promise<void> { await logout(); }
export async function requestPasswordReset(email: string): Promise<void> { await requestReset(email); }
export async function resetPassword(input: PasswordResetInput): Promise<void> { await reset(input); }
export async function getCurrentUser(): Promise<UserProfile | null> {
  const user = await current();
  return user ? { ...user, createdAt: user.createdAt.toISOString() } : null;
}
export async function handleAuthRequest(request: Request): Promise<Response> { return handleAuthHttp(request); }
