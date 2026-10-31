"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import type { AuthMode, AuthState } from "../../contracts";
import { authenticateAction } from "../actions";
import styles from "./auth-form.module.css";

const initial: AuthState = { status: "idle" };
const labels: Record<AuthMode, string> = { register: "Δημιουργία λογαριασμού", login: "Σύνδεση", "forgot-password": "Αποστολή οδηγιών", "reset-password": "Αλλαγή κωδικού" };

export function AuthForm({ mode, token = "", preview = false }: { mode: AuthMode; token?: string; preview?: boolean }) {
  const [state, action, pending] = useActionState(authenticateAction.bind(null, mode), initial);
  const values = state.status === "error" ? state.values : undefined;
  const errors = state.fieldErrors;
  return (
    <div className="form-stack">
      <form action={action} className="form-stack" noValidate>
        <fieldset className={styles.fields} disabled={preview}>
        {mode === "reset-password" && <input type="hidden" name="token" value={token} />}
        {(mode === "login" || mode === "register") && <Field label="Όνομα χρήστη" name="username" autoComplete="username" maxLength={30} required defaultValue={values?.username} error={errors?.username} />}
        {(mode === "register" || mode === "forgot-password") && <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={values?.email} error={errors?.email} />}
        {mode === "register" && <>
          <Field label="Όνομα" name="firstName" autoComplete="given-name" maxLength={100} defaultValue={values?.firstName} error={errors?.firstName} />
          <Field label="Επώνυμο" name="lastName" autoComplete="family-name" maxLength={100} defaultValue={values?.lastName} error={errors?.lastName} />
        </>}
        {mode !== "forgot-password" && <Field label={mode === "reset-password" ? "Νέος κωδικός" : "Κωδικός"} name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required error={errors?.password} hint={mode === "login" ? undefined : "Από 12 έως 128 χαρακτήρες."} />}
        {(mode === "register" || mode === "reset-password") && <Field label="Επιβεβαίωση κωδικού" name="confirmPassword" type="password" autoComplete="new-password" required error={errors?.confirmPassword} />}
        {errors?.token && <p role="alert" className="form-message form-message--error">{errors.token}</p>}
        {state.message && <p role={state.status === "success" ? "status" : "alert"} className={`form-message form-message--${state.status === "success" ? "success" : "error"}`}>{state.message}</p>}
        <Button type="submit" className={preview ? styles.previewButton : undefined} disabled={pending || preview}>{pending ? "Περίμενε…" : labels[mode]}</Button>
        </fieldset>
      </form>
      <nav aria-label="Λογαριασμός">
        {mode !== "login" && <p><Link href="/users/login">Σύνδεση</Link></p>}
        {mode !== "register" && <p><Link href="/users/register">Εγγραφή</Link></p>}
        {mode === "login" && <p><Link href="/users/forgot-password">Ξέχασα τον κωδικό μου</Link></p>}
      </nav>
    </div>
  );
}
