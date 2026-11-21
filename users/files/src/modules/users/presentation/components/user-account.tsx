import { Button } from "@/shared/ui/button";
import { formatDateTime } from "@/shared/lib/format";
import type { UserProfile } from "../../contracts";
import { signOutAction } from "../actions";

export function UserAccount({ user }: { user: UserProfile }) {
  return <div className="form-stack">
    <dl>
      <dt>Όνομα χρήστη</dt><dd>{user.username}</dd>
      <dt>Email</dt><dd>{user.email}</dd>
      <dt>Όνομα</dt><dd>{user.firstName || "—"}</dd>
      <dt>Επώνυμο</dt><dd>{user.lastName || "—"}</dd>
      <dt>Εγγραφή</dt><dd>{formatDateTime(user.createdAt)}</dd>
    </dl>
    <form action={signOutAction}><Button type="submit" variant="secondary">Αποσύνδεση</Button></form>
  </div>;
}
