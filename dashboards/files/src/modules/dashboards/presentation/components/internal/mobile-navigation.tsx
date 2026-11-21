"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import styles from "../dashboard-shell.module.css";

export function MobileNavigation({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 700px)");
    const closeOnDesktop = () => { if (!mobile.matches) dialog.current?.close(); };
    mobile.addEventListener("change", closeOnDesktop);
    return () => mobile.removeEventListener("change", closeOnDesktop);
  }, []);
  return <div className={styles.mobileNavigation}>
    <Button variant="secondary" onClick={() => dialog.current?.showModal()} aria-haspopup="dialog" aria-controls="dashboard-navigation-dialog">Μενού</Button>
    <dialog ref={dialog} id="dashboard-navigation-dialog" className={styles.drawer} aria-label="Μενού dashboard"
      onClick={event => { if (event.target instanceof Element && event.target.closest("a[href]")) dialog.current?.close(); }}>
      <div className={styles.drawerContent}>
        <Button variant="ghost" onClick={() => dialog.current?.close()}>Κλείσιμο μενού</Button>
        {children}
      </div>
    </dialog>
  </div>;
}
