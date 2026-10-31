import Link from "next/link";
import type { Metadata } from "next";
import { buttonClass } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export const metadata: Metadata = { title: "Αρχική" };

export default function HomePage() {
  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">Καλώς ήρθες στο webapp</p>
        <h1 className="hero__title">Ο λογαριασμός σου. Ο χώρος σου.</h1>
        <p className="hero__lead">
          Συνδέσου για να δεις τα στοιχεία σου ή δημιούργησε έναν νέο λογαριασμό.
        </p>
        <div className="hero__actions">
          <Link href="/users/login" className={buttonClass()}>
            Σύνδεση
          </Link>
          <Link href="/users/register" className={buttonClass("secondary")}>
            Δημιουργία λογαριασμού
          </Link>
        </div>
      </section>

      <div className="grid-3">
        <Card title="Ο λογαριασμός μου" description="Τα στοιχεία σου, σε ένα μέρος.">
          <p className="muted">
            Δες το προφίλ σου αφού συνδεθείς στον λογαριασμό σου.
          </p>
          <Link href="/users" className={buttonClass("secondary", "sm")}>
            Προβολή λογαριασμού
          </Link>
        </Card>
        <Card title="Επιβεβαίωση email" description="Ολοκλήρωσε την εγγραφή σου.">
          <p className="muted">
            Μετά την εγγραφή θα λάβεις έναν σύνδεσμο επιβεβαίωσης για να ενεργοποιήσεις την πρόσβασή σου.
          </p>
        </Card>
        <Card title="Ανάκτηση πρόσβασης" description="Ξέχασες τον κωδικό σου;">
          <p className="muted">
            Ζήτησε οδηγίες στο email σου και όρισε έναν νέο κωδικό.
          </p>
          <Link href="/users/forgot-password" className={buttonClass("secondary", "sm")}>
            Ανάκτηση κωδικού
          </Link>
        </Card>
      </div>
    </div>
  );
}
