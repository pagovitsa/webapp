import type { Order } from "../../domain/order";
import type { OrderRepository } from "../ports/order-repository";

export function makeListOrders({ orders }: { orders: OrderRepository }) {
  return async function listOrders(): Promise<Order[]> {
    const all = await orders.list();
    return all.toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };
}
