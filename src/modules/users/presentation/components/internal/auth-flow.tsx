"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthEntry, AuthMode } from "../../../contracts";
import { AuthScreen } from "../auth-screen";

export function AuthFlow({ entry, signedIn }: { entry: AuthEntry; signedIn: boolean }) {
  const [mode, setMode] = useState<AuthMode>(entry.mode);
  const [notices, setNotices] = useState(true);
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  const focusHeading = useRef(false);
  useEffect(() => {
    if (focusHeading.current) { heading.current?.focus(); focusHeading.current = false; }
  }, [mode]);
  function changeMode(next: AuthMode) {
    if (signedIn && (next === "login" || next === "register")) { router.replace("/"); return; }
    if (next === mode) return;
    focusHeading.current = true;
    setMode(next);
    setNotices(false);
    window.history.replaceState(window.history.state, "", "/users");
  }
  const invalidReset = mode === "reset-password" && (!entry.token || entry.invalidLink);
  return <AuthScreen key={mode} mode={mode} token={entry.token} headingRef={heading} onModeChange={changeMode} showForm={!invalidReset}>
    {notices && entry.verified && !entry.invalidLink && <p role="status">Το email επιβεβαιώθηκε. Μπορείς να συνδεθείς.</p>}
    {notices && entry.reset && <p role="status">Ο κωδικός άλλαξε. Συνδέσου με τον νέο κωδικό.</p>}
    {notices && entry.invalidLink && <p role="alert">Ο σύνδεσμος δεν είναι έγκυρος ή έχει λήξει. Ζήτησε νέο σύνδεσμο ανάκτησης.</p>}
  </AuthScreen>;
}
