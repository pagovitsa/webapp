import { getDashboard } from "@/modules/dashboards/server";

export async function GET(request: Request) {
  const result = await getDashboard(new URL(request.url).searchParams.get("section") ?? "");
  const status = result.status === "ready" ? 200 : result.status === "anonymous" ? 401 : result.status === "forbidden" ? 403 : 404;
  return Response.json(result.status === "ready" ? result.dashboard : { error: result.status }, {
    status, headers: { "Cache-Control": "no-store", "Vary": "Cookie" },
  });
}
