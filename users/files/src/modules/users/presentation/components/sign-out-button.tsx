import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { signOutAction } from "../actions";

export function SignOutButton({ children = "Αποσύνδεση", formClassName, buttonClassName, label = "Αποσύνδεση" }: {
  children?: ReactNode; formClassName?: string; buttonClassName?: string; label?: string;
}) {
  return <form action={signOutAction} className={formClassName}>
    <Button type="submit" variant="ghost" className={buttonClassName} aria-label={label}>{children}</Button>
  </form>;
}
