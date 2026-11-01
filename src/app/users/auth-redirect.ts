import "server-only";
import { redirect } from "next/navigation";
import type { AuthEntryQuery, AuthMode } from "@/modules/users/contracts";

export function redirectToUsers(form: AuthMode, query: AuthEntryQuery) {
  const params = new URLSearchParams();
  if (form !== "login") params.set("form", form);
  for (const key of ["token", "verified", "reset", "error"] as const) {
    const value = query[key];
    if (typeof value === "string") params.set(key, value);
  }
  redirect(params.size ? `/users?${params}` : "/users");
}
