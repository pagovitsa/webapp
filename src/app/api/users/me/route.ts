import { getCurrentUser } from "@/modules/users/server";

export const runtime = "nodejs";
export async function GET() {
  const user = await getCurrentUser();
  return Response.json(user ? { user } : { error: { code: "UNAUTHENTICATED", message: "Απαιτείται σύνδεση." } }, { status: user ? 200 : 401, headers: { "Cache-Control": "no-store" } });
}
