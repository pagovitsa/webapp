export type OrderStatus = "draft" | "confirmed" | "cancelled";

export type Order = {
  readonly id: string;
  readonly number: string;
  readonly customerName: string;
  readonly amountCents: number;
  readonly status: OrderStatus;
  readonly createdAt: Date;
};

export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}

export const MAX_AMOUNT_CENTS = 10_000_000;

export function draftOrder(props: Omit<Order, "status">): Order {
  const customerName = props.customerName.trim();

  if (customerName.length < 2) {
    throw new OrderError("Το όνομα πελάτη χρειάζεται τουλάχιστον 2 χαρακτήρες.");
  }
  if (!Number.isInteger(props.amountCents) || props.amountCents <= 0) {
    throw new OrderError("Το ποσό πρέπει να είναι μεγαλύτερο από μηδέν.");
  }
  if (props.amountCents > MAX_AMOUNT_CENTS) {
    throw new OrderError("Το ποσό ξεπερνά το όριο των 100.000 € ανά παραγγελία.");
  }

  return { ...props, customerName, status: "draft" };
}

export function confirmOrder(order: Order): Order {
  if (order.status !== "draft") {
    throw new OrderError("Επιβεβαιώνονται μόνο πρόχειρες παραγγελίες.");
  }
  return { ...order, status: "confirmed" };
}

export function cancelOrder(order: Order): Order {
  if (order.status === "cancelled") {
    throw new OrderError("Η παραγγελία έχει ήδη ακυρωθεί.");
  }
  return { ...order, status: "cancelled" };
}
