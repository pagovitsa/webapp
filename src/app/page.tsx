import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getDashboard } from "@/modules/dashboards/server";

export const metadata: Metadata = { title: "Αρχική" };
export default async function HomePage() {
  await connection();
  const result = await getDashboard();
  if (result.status === "anonymous") redirect("/users/login");
  redirect(result.status === "ready" ? "/dashboards" : "/users");
}
