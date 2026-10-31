import type { OrderRepository } from "../../application/ports/order-repository";
import type { Order } from "../../domain/order";

// Προσωρινή αποθήκευση στη μνήμη μέχρι να επιλεγεί βάση και ORM.
// Το globalThis κρατά τα δεδομένα στα hot reloads του dev server· χάνονται σε restart.
const store = globalThis as typeof globalThis & { __ordersStore?: Map<string, Order> };

function orders(): Map<string, Order> {
  store.__ordersStore ??= new Map();
  return store.__ordersStore;
}

export class InMemoryOrderRepository implements OrderRepository {
  async list(): Promise<Order[]> {
    return [...orders().values()];
  }

  async findById(id: string): Promise<Order | null> {
    return orders().get(id) ?? null;
  }

  async save(order: Order): Promise<void> {
    orders().set(order.id, order);
  }

  async nextNumber(): Promise<string> {
    return `ORD-${String(orders().size + 1).padStart(4, "0")}`;
  }
}
