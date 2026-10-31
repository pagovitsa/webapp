import type { Metadata } from "next";
import { connection } from "next/server";
import { OrderForm } from "@/modules/orders/presentation/components/order-form";
import { OrderList } from "@/modules/orders/presentation/components/order-list";
import { listOrders } from "@/modules/orders/server";
import { Card } from "@/shared/ui/card";

export const metadata: Metadata = { title: "Παραγγελίες" };

export default async function OrdersPage() {
  await connection();
  const orders = await listOrders();

  return (
    <div className="page">
      <header className="page-header">
        <h1>Παραγγελίες</h1>
        <p className="muted">Δημιούργησε, επιβεβαίωσε ή ακύρωσε παραγγελίες.</p>
      </header>

      <div className="split-layout">
        <Card title="Νέα παραγγελία">
          <OrderForm />
        </Card>
        <Card title="Όλες οι παραγγελίες" description={`${orders.length} συνολικά`}>
          <OrderList orders={orders} />
        </Card>
      </div>
    </div>
  );
}
