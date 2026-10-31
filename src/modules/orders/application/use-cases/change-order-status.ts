import { cancelOrder, confirmOrder, OrderError, type Order } from "../../domain/order";
import type { OrderRepository } from "../ports/order-repository";

export type OrderStatusChange = "confirm" | "cancel";

const transitions: Record<OrderStatusChange, (order: Order) => Order> = {
  confirm: confirmOrder,
  cancel: cancelOrder,
};

export function makeChangeOrderStatus({ orders }: { orders: OrderRepository }) {
  return async function changeOrderStatus(id: string, change: OrderStatusChange): Promise<Order> {
    const order = await orders.findById(id);
    if (!order) {
      throw new OrderError("Η παραγγελία δεν βρέθηκε.");
    }
    const updated = transitions[change](order);
    await orders.save(updated);
    return updated;
  };
}
