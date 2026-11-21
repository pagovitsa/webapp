import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { openAuthDatabase } from "../database";
import { createAuthOptions } from "./options";

function createAuth() {
  const options = createAuthOptions(openAuthDatabase());
  return betterAuth({ ...options, plugins: [...options.plugins, nextCookies()] });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() { return instance ??= createAuth(); }
