import { describe, expect, it } from "vitest";
import { OrderError, type Order } from "../../domain/order";
import type { OrderRepository } from "../ports/order-repository";
import { makeChangeOrderStatus } from "./change-order-status";
import { makeCreateOrder } from "./create-order";
import { makeListOrders } from "./list-orders";

// Fake του port: τα use cases ελέγχονται χωρίς infrastructure.
function fakeRepository(): OrderRepository & { saved: Order[] } {
  const store = new Map<string, Order>();
  const saved: Order[] = [];
  return {
    saved,
    async list() {
      return [...store.values()];
    },
    async findById(id) {
      return store.get(id) ?? null;
    },
    async save(order) {
      saved.push(order);
      store.set(order.id, order);
    },
    async nextNumber() {
      return `ORD-${String(store.size + 1).padStart(4, "0")}`;
    },
  };
}

function setup() {
  const orders = fakeRepository();
  let id = 0;
  let minute = 0;
  const deps = {
    orders,
    newId: () => `o-${++id}`,
    now: () => new Date(Date.UTC(2026, 0, 1, 10, minute++)),
  };
  return {
    orders,
    createOrder: makeCreateOrder(deps),
    listOrders: makeListOrders({ orders }),
    changeOrderStatus: makeChangeOrderStatus({ orders }),
  };
}

describe("create-order", () => {
  it("δημιουργεί και αποθηκεύει πρόχειρη παραγγελία", async () => {
    const { createOrder, orders } = setup();
    const order = await createOrder({ customerName: "Μαρία", amountCents: 4990 });
    expect(order).toMatchObject({ id: "o-1", number: "ORD-0001", status: "draft" });
    expect(orders.saved).toHaveLength(1);
  });

  it("δεν αποθηκεύει όταν παραβιάζεται κανόνας", async () => {
    const { createOrder, orders } = setup();
    await expect(createOrder({ customerName: "Μαρία", amountCents: 0 })).rejects.toThrow(OrderError);
    expect(orders.saved).toHaveLength(0);
  });
});

describe("list-orders", () => {
  it("επιστρέφει από τη νεότερη", async () => {
    const { createOrder, listOrders } = setup();
    await createOrder({ customerName: "Πρώτη", amountCents: 100 });
    await createOrder({ customerName: "Δεύτερη", amountCents: 200 });
    expect((await listOrders()).map((o) => o.customerName)).toEqual(["Δεύτερη", "Πρώτη"]);
  });
});

describe("change-order-status", () => {
  it("φορτώνει, εφαρμόζει τη μετάβαση και αποθηκεύει", async () => {
    const { createOrder, changeOrderStatus, orders } = setup();
    const { id } = await createOrder({ customerName: "Μαρία", amountCents: 100 });
    expect((await changeOrderStatus(id, "confirm")).status).toBe("confirmed");
    expect((await orders.findById(id))?.status).toBe("confirmed");
  });

  it("απορρίπτει άγνωστη παραγγελία", async () => {
    const { changeOrderStatus } = setup();
    await expect(changeOrderStatus("missing", "confirm")).rejects.toThrow(/δεν βρέθηκε/);
  });

  it("απορρίπτει μη επιτρεπτή μετάβαση χωρίς αποθήκευση", async () => {
    const { createOrder, changeOrderStatus, orders } = setup();
    const { id } = await createOrder({ customerName: "Μαρία", amountCents: 100 });
    await changeOrderStatus(id, "cancel");
    const savesBefore = orders.saved.length;
    await expect(changeOrderStatus(id, "confirm")).rejects.toThrow(OrderError);
    expect(orders.saved).toHaveLength(savesBefore);
  });
});
