import type { Metadata } from "next";

export const metadata: Metadata = { title: "__Title__" };

export default async function __Component__Page() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>__Title__</h1>
        <p className="muted">Συνθέτει τα δημόσια components του module __module__.</p>
      </header>
    </div>
  );
}
