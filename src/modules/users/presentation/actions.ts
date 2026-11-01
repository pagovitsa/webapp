"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { AuthMode, AuthState, AuthValues } from "../contracts";
import { registerUser, signIn, signOut, requestPasswordReset, resetPassword, UserError } from "../server";
import { parseAuthForm } from "./schemas/auth-schema";

export async function authenticateAction(mode: AuthMode, _previous: AuthState, formData: FormData): Promise<AuthState> {
  // Public registration/login/reset; the auth adapter validates reset-token ownership and sessions.
  if (!["register", "login", "forgot-password", "reset-password"].includes(mode)) return { status: "error", message: "Μη έγκυρη ενέργεια." };
  const values: AuthValues = {};
  for (const key of ["username", "email", "firstName", "lastName"] as const) {
    const value = formData.get(key);
    if (typeof value === "string") values[key] = value.slice(0, 254);
  }
  const result = parseAuthForm(mode, formData);
  if (!result.ok) return { status: "error", fieldErrors: result.errors, values };
  try {
    if (mode === "register") {
      await registerUser(result.data);
      return { status: "success", message: "Η εγγραφή ολοκληρώθηκε. Έλεγξε το email σου για επιβεβαίωση λογαριασμού." };
    }
    if (mode === "forgot-password") {
      await requestPasswordReset(result.data.email);
      return { status: "success", message: "Αν υπάρχει λογαριασμός με αυτό το email, θα λάβεις οδηγίες ανάκτησης." };
    }
    if (mode === "reset-password") await resetPassword(result.data);
    if (mode === "login") await signIn(result.data);
  } catch (error) {
    if (error instanceof UserError) return { status: "error", message: error.message, values };
    throw error;
  }
  revalidatePath("/users");
  redirect(mode === "reset-password" ? "/users?reset=1" : "/");
}

export async function signOutAction(): Promise<void> {
  // The current cookie identifies the session being revoked; repeat logout is safe.
  await signOut();
  revalidatePath("/users");
  redirect("/users");
}
