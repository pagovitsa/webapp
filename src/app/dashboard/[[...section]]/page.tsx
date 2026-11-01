import { redirect } from "next/navigation";
export default async function DashboardAliasPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section } = await params;
  redirect(section?.length ? `/dashboards/${section.map(encodeURIComponent).join("/")}` : "/dashboards");
}
