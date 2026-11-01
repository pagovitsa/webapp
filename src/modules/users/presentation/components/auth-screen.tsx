import Link from "next/link";
import type { ReactNode, Ref } from "react";
import type { AuthAppearance, AuthMode } from "../../contracts";
import { authAppearance } from "../auth-appearance";
import { AuthForm } from "./auth-form";
import styles from "./auth-screen.module.css";

const content: Record<AuthMode, { title: string; lead: string; note: string }> = {
  login: { title: "Σύνδεση", lead: "Καλώς ήρθες ξανά.", note: "Συνδέσου στον λογαριασμό σου για να συνεχίσεις." },
  register: { title: "Δημιουργία λογαριασμού", lead: "Το επόμενο βήμα ξεκινά εδώ.", note: "Το όνομα και το επώνυμο είναι προαιρετικά." },
  "forgot-password": { title: "Ανάκτηση κωδικού", lead: "Ας βρούμε ξανά την πρόσβασή σου.", note: "Συμπλήρωσε το email σου για να λάβεις οδηγίες ανάκτησης." },
  "reset-password": { title: "Νέος κωδικός", lead: "Μια νέα αρχή, με ασφάλεια.", note: "Διάλεξε έναν νέο κωδικό από 12 έως 128 χαρακτήρες." },
};
const themes: Record<AuthAppearance, { className?: string; eyebrow: string; title: string; detail: string }> = {
  nucleus: { className: styles.nucleus, eyebrow: "Ο ΔΙΚΟΣ ΣΟΥ ΧΩΡΟΣ", title: "Λιγότερα βήματα. Περισσότερες δυνατότητες.", detail: "Όλα όσα χρειάζεσαι, σε ένα μέρος." },
  "smart-save": { className: styles.smartSave, eyebrow: "ΟΛΑ ΣΤΗ ΘΕΣΗ ΤΟΥΣ", title: "Οι δυνατότητές σου ξεκινούν εδώ.", detail: "Ένας λογαριασμός. Μια πιο απλή καθημερινότητα." },
  midnight: { className: styles.midnight, eyebrow: "ΧΩΡΟΣ ΓΙΑ ΚΑΤΙ ΝΕΟ", title: "Η επόμενη ιδέα σου αξίζει χώρο.", detail: "Συνδέσου. Δημιούργησε. Προχώρησε." },
};

type AuthScreenProps = {
  mode: AuthMode;
  appearance?: AuthAppearance;
  token?: string;
  preview?: boolean;
  showForm?: boolean;
  children?: ReactNode;
  onModeChange?: (mode: AuthMode) => void;
  headingRef?: Ref<HTMLHeadingElement>;
};

export function AuthScreen({ mode, appearance = authAppearance, token, preview = false, showForm = true, children, onModeChange, headingRef }: AuthScreenProps) {
  const copy = content[mode];
  const theme = themes[appearance];
  const Heading = preview ? "h2" : "h1";
  return (
    <section className={`${styles.screen} ${theme.className ?? ""} ${preview ? "" : styles.fullScreen} ${mode === "register" ? styles.registration : ""}`} aria-label={`Φόρμα: ${copy.title}`}>
      <aside className={styles.story} aria-label="Καλώς ήρθες στο webapp">
        <Link href="/" className={styles.brand}><span className={styles.mark} aria-hidden="true" />webapp</Link>
        <div className={styles.art} aria-hidden="true">
          <div className={styles.window} /><div className={styles.laptop} />
          <div className={styles.vault}><div className={styles.wheel}><span /><span /><span /></div><div className={styles.handle} /></div>
          <div className={styles.dune} /><div className={styles.duneBack} />
          <span className={styles.spark} /><span className={styles.sparkTwo} />
        </div>
        <div className={styles.storyCopy}>
          <p className={styles.eyebrow}>{theme.eyebrow}</p>
          <p className={styles.storyTitle}>{theme.title}</p>
          <p className={styles.storyDetail}>{theme.detail}</p>
        </div>
        <div className={styles.dots} aria-hidden="true"><span /><span /><span /></div>
      </aside>
      <div className={styles.surface}>
        <div className={styles.content}>
          <p className={styles.lead}>{copy.lead}</p>
          <Heading ref={headingRef} tabIndex={-1} className={styles.title}>{copy.title}</Heading>
          <p className={styles.note}>{copy.note}</p>
          {appearance === "smart-save" && (mode === "login" || mode === "register") && <nav className={styles.tabs} aria-label="Επιλογή λογαριασμού">
            <Link href="/users" onClick={onModeChange ? event => { event.preventDefault(); onModeChange("login"); } : undefined} aria-current={mode === "login" ? "page" : undefined}>Σύνδεση</Link>
            <Link href="/users?form=register" onClick={onModeChange ? event => { event.preventDefault(); onModeChange("register"); } : undefined} aria-current={mode === "register" ? "page" : undefined}>Εγγραφή</Link>
          </nav>}
          {children && <div className={styles.notices}>{children}</div>}
          {showForm ? <AuthForm mode={mode} token={token} preview={preview} onModeChange={onModeChange} /> : onModeChange ? <button type="button" onClick={() => onModeChange("forgot-password")}>Ζήτησε νέο σύνδεσμο ανάκτησης</button> : <Link href="/users?form=forgot-password">Ζήτησε νέο σύνδεσμο ανάκτησης</Link>}
        </div>
        <p className={styles.footer}>Ο λογαριασμός σου. Ο χώρος σου.</p>
      </div>
    </section>
  );
}
