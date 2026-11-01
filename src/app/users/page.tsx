import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getDashboard } from "@/modules/dashboards/server";
import type { AuthEntryQuery } from "@/modules/users/contracts";
import { UsersEntry } from "@/modules/users/presentation/components/users-entry";
import { UserSession } from "@/modules/users/presentation/components/user-session";

export const metadata: Metadata = { title: "Χρήστες", referrer: "no-referrer", robots: { index: false, follow: false } };
export default async function UsersPage({ searchParams }: { searchParams: Promise<AuthEntryQuery> }) {
  await connection();
  const dashboard = await getDashboard();
  const query = await searchParams;
  if (query.form === "reset-password" || query.form === "forgot-password") return <UsersEntry query={query} signedIn={dashboard.status !== "anonymous"} />;
  if (dashboard.status === "ready") redirect("/dashboard");
  return dashboard.status === "anonymous" ? <UsersEntry query={query} /> : <UserSession />;
}
