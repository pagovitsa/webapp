import Link from "next/link";
import type { DashboardIcon, DashboardView } from "../../contracts";
import styles from "./dashboard-shell.module.css";
import { MobileNavigation } from "./internal/mobile-navigation";
import { SignOutButton } from "@/modules/users/presentation/components/sign-out-button";

const iconPaths: Record<DashboardIcon, string> = {
  folder: "M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3Z",
  grid: "M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z",
  settings: "M12 3v3m0 12v3M3 12h3m12 0h3M6 6l2 2m8 8 2 2M6 18l2-2m8-8 2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
};
function Icon({ name }: { name: DashboardIcon }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={iconPaths[name]} /></svg>;
}
export function DashboardShell({ dashboard }: { dashboard: DashboardView }) {
  const sidebar = <>
        <Link className={styles.brand} href="/dashboard" prefetch={false}><span aria-hidden="true">w</span>webapp</Link>
        <nav aria-label="Πλοήγηση dashboard" className={styles.navigation}>
          <Link className={styles.overview} href="/dashboard" prefetch={false} aria-current={dashboard.selected.id === "overview" ? "page" : undefined}>
            <Icon name="grid" />Επισκόπηση
          </Link>
          <ul className={styles.categories}>
            {dashboard.categories.map(category => (
              <li key={category.id}>
                <details open className={styles.group}>
                  <summary><Icon name={category.icon} /><span>{category.title}</span><span className={styles.chevron} aria-hidden="true">⌄</span></summary>
                  <ul className={styles.children}>
                    {category.children.map(item => (
                      <li key={item.id}><Link href={`/dashboard/${item.path}`} prefetch={false} aria-current={dashboard.selected.id === item.id ? "page" : undefined}>{item.title}</Link></li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        </nav>
        <SignOutButton formClassName={styles.accountForm} buttonClassName={styles.account} label={`Αποσύνδεση: ${dashboard.username}`}>
          <span className={styles.avatar} aria-hidden="true">{dashboard.username.slice(0, 1).toUpperCase()}</span>
          <span className={styles.identity}><strong>{dashboard.username}</strong><span>{dashboard.role === "admin" ? "Διαχειριστής" : "Χρήστης"}</span></span>
          <span aria-hidden="true">↪</span>
        </SignOutButton>
    </>;
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#dashboard-content">Μετάβαση στο περιεχόμενο</a>
      <aside className={styles.sidebar} aria-label="Πλαϊνή μπάρα dashboard">{sidebar}</aside>
      <main id="dashboard-content" tabIndex={-1} className={styles.content} aria-labelledby="dashboard-title">
        <MobileNavigation>{sidebar}</MobileNavigation>
        <header className={styles.header}>
          <div><p className={styles.eyebrow}>Ο χώρος εργασίας σου</p><h1 id="dashboard-title">{dashboard.selected.title}</h1></div>
          <span className={styles.pill}>Dashboard</span>
        </header>
        <div className={styles.panel}>
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true"><Icon name="grid" /></span>
            <h2>{dashboard.selected.id === "overview" ? "Ο χώρος σου είναι έτοιμος" : "Προσωρινή ενότητα"}</h2>
            <p>Εδώ θα εμφανίζεται το περιεχόμενο της επιλεγμένης ενότητας.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
