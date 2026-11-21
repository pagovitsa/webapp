import { handleAuthRequest } from "@/modules/users/server";

export const runtime = "nodejs";
export async function GET(request: Request) { return handleAuthRequest(request); }
export async function POST(request: Request) { return handleAuthRequest(request); }
