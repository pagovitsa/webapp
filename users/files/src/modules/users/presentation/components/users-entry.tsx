import type { AuthEntryQuery } from "../../contracts";
import { parseAuthEntry } from "../schemas/auth-entry";
import { AuthFlow } from "./internal/auth-flow";

export function UsersEntry({ query, signedIn = false }: { query: AuthEntryQuery; signedIn?: boolean }) {
  const entry = parseAuthEntry(query);
  return <main><AuthFlow key={JSON.stringify(entry)} entry={entry} signedIn={signedIn} /></main>;
}
