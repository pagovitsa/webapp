import { formatCurrency, formatDateTime } from "@/shared/lib/format";
import { Badge, type BadgeTone } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import type { OrderStatus, OrderSummary } from "../../contracts";
import { changeOrderStatusAction } from "../actions";
import styles from "./order-list.module.css";

const statusLabel: Record<OrderStatus, string> = {
  draft: "Πρόχειρη",
  confirmed: "Επιβεβαιωμένη",
  cancelled: "Ακυρωμένη",
};

const statusTone: Record<OrderStatus, BadgeTone> = {
  draft: "neutral",
  confirmed: "success",
  cancelled: "danger",
};

export function OrderList({ orders }: { orders: OrderSummary[] }) {
  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <strong>Καμία παραγγελία ακόμα</strong>
        <span>Δημιούργησε την πρώτη από τη φόρμα.</span>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {orders.map((order) => (
        <li key={order.id} className={styles.row}>
          <div className={styles.main}>
            <span className={styles.customer}>{order.customerName}</span>
            <span className={styles.meta}>
              <span className={styles.number}>{order.number}</span> · {formatDateTime(order.createdAt)}
            </span>
          </div>
          <span className={styles.amount}>{formatCurrency(order.amountCents)}</span>
          <Badge tone={statusTone[order.status]}>{statusLabel[order.status]}</Badge>

          <div className={styles.actions}>
            {order.status === "draft" && (
              <form action={changeOrderStatusAction.bind(null, order.id, "confirm")}>
                <Button type="submit" variant="secondary" size="sm">
                  Επιβεβαίωση
                </Button>
              </form>
            )}
            {order.status !== "cancelled" && (
              <form action={changeOrderStatusAction.bind(null, order.id, "cancel")}>
                <Button type="submit" variant="danger" size="sm">
                  Ακύρωση
                </Button>
              </form>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
