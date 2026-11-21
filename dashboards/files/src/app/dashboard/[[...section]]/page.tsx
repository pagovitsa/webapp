import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { getDashboard } from "@/modules/dashboards/server";
import { DashboardShell } from "@/modules/dashboards/presentation/components/dashboard-shell";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export default async function DashboardPage({ params }: { params: Promise<{ section?: string[] }> }) {
  await connection();
  const { section } = await params;
  const result = await getDashboard(section?.join("/") ?? "");
  if (result.status === "anonymous" || result.status === "forbidden") redirect("/users");
  if (result.status !== "ready") notFound();
  return <DashboardShell dashboard={result.dashboard} />;
}
