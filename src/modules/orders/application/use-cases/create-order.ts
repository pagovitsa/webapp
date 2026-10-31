import { draftOrder, type Order } from "../../domain/order";
import type { OrderRepository } from "../ports/order-repository";

export type CreateOrderCommand = {
  customerName: string;
  amountCents: number;
};

type Deps = {
  orders: OrderRepository;
  newId: () => string;
  now: () => Date;
};

export function makeCreateOrder({ orders, newId, now }: Deps) {
  return async function createOrder(command: CreateOrderCommand): Promise<Order> {
    const order = draftOrder({
      id: newId(),
      number: await orders.nextNumber(),
      customerName: command.customerName,
      amountCents: command.amountCents,
      createdAt: now(),
    });
    await orders.save(order);
    return order;
  };
}
