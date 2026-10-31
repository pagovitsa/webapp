import Link from "next/link";
import { buttonClass } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export default function HomePage() {
  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">Next.js · TypeScript · DDD</p>
        <h1 className="hero__title">Μία ενότητα, μία θέση για κάθε κομμάτι κώδικα.</h1>
        <p className="hero__lead">
          Κάθε επιχειρησιακή ενότητα έχει domain, application, infrastructure και presentation. Οι σελίδες συνθέτουν,
          τα modules αποφασίζουν.
        </p>
        <div className="hero__actions">
          <Link href="/orders" className={buttonClass()}>
            Άνοιξε τις παραγγελίες
          </Link>
        </div>
      </section>

      <div className="grid-3">
        <Card title="Παραγγελίες" description="Δοκιμαστικό module για τη δομή.">
          <p className="muted">
            Φόρμα με Server Action, έλεγχος schema, κανόνες στο domain και αποθήκευση πίσω από ένα port.
          </p>
          <Link href="/orders" className={buttonClass("secondary", "sm")}>
            Προβολή
          </Link>
        </Card>
        <Card title="Νέα ενότητα" description="Αντέγραψε το templates/module.">
          <p className="muted">
            Βάλε το αντίγραφο στο <code>src/modules/&lt;όνομα&gt;</code>, γράψε πρώτα το domain και σύνδεσε τις υλοποιήσεις στο{" "}
            <code>server.ts</code>.
          </p>
        </Card>
        <Card title="Όρια" description="Τα ελέγχει το ESLint.">
          <p className="muted">
            Το <code>app/</code> βλέπει μόνο <code>server.ts</code>, <code>contracts.ts</code> και{" "}
            <code>presentation/</code>. Το domain μένει καθαρό TypeScript.
          </p>
        </Card>
      </div>
    </div>
  );
}
