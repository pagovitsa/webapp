import { redirect } from "next/navigation";
export default async function DashboardAliasPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section } = await params;
  redirect(section?.length ? `/dashboard/${section.map(encodeURIComponent).join("/")}` : "/dashboard");
}
