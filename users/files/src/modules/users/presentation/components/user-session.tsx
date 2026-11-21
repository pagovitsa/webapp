import { SignOutButton } from "./sign-out-button";
import styles from "./user-session.module.css";

export function UserSession() {
  return <main className={styles.session}>
    <h1>Έχεις συνδεθεί</h1>
    <p>Δεν έχει ενεργοποιηθεί dashboard για τον λογαριασμό σου.</p>
    <SignOutButton />
  </main>;
}
