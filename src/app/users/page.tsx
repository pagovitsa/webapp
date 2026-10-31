import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/users/server";
import { UserAccount } from "@/modules/users/presentation/components/user-account";
import { Card } from "@/shared/ui/card";

export const metadata: Metadata = { title: "Ο λογαριασμός μου" };
export default async function UsersPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/users/login");
  return <div className="page"><h1>Ο λογαριασμός μου</h1><Card title="Στοιχεία λογαριασμού"><UserAccount user={user} /></Card></div>;
}
