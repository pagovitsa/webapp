import type { Registration, UserIdentity } from "../../domain/user";

export interface IdentityGateway {
  /** Creates an unverified user and sends verification mail; rejects duplicate/invalid identities. */
  register(input: Registration): Promise<void>;
  /** Creates a session cookie; rejects invalid credentials and unverified email. */
  signIn(input: { username: string; password: string }): Promise<void>;
  /** Revokes the current session. Safe to repeat when no session exists. */
  signOut(): Promise<void>;
  /** Returns the authoritative user for the current session, or null. */
  currentUser(): Promise<UserIdentity | null>;
  /** Sends reset instructions when a user exists; never exposes existence in the result. */
  requestPasswordReset(email: string): Promise<void>;
  /** Changes the password using a valid, unused token and revokes previous sessions. */
  resetPassword(input: { token: string; password: string }): Promise<void>;
}
