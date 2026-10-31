import "server-only";
import { randomUUID } from "node:crypto";
import { makeChangeOrderStatus } from "./application/use-cases/change-order-status";
import { makeCreateOrder } from "./application/use-cases/create-order";
import { makeListOrders } from "./application/use-cases/list-orders";
import type { CreateOrderInput, OrderStatusChange, OrderSummary } from "./contracts";
import type { Order } from "./domain/order";
import { InMemoryOrderRepository } from "./infrastructure/persistence/in-memory-order-repository";

export { OrderError } from "./domain/order";

// Σύνδεση εξαρτήσεων. Για βάση: άλλαξε μόνο την υλοποίηση του repository εδώ.
const orders = new InMemoryOrderRepository();

const createOrderUseCase = makeCreateOrder({ orders, newId: randomUUID, now: () => new Date() });
const listOrdersUseCase = makeListOrders({ orders });
const changeOrderStatusUseCase = makeChangeOrderStatus({ orders });

function toSummary(order: Order): OrderSummary {
  return {
    id: order.id,
    number: order.number,
    customerName: order.customerName,
    amountCents: order.amountCents,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
  };
}

export async function createOrder(input: CreateOrderInput): Promise<OrderSummary> {
  return toSummary(await createOrderUseCase(input));
}

export async function listOrders(): Promise<OrderSummary[]> {
  return (await listOrdersUseCase()).map(toSummary);
}

export async function changeOrderStatus(id: string, change: OrderStatusChange): Promise<OrderSummary> {
  return toSummary(await changeOrderStatusUseCase(id, change));
}
