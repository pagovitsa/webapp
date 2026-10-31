import { describe, expect, it } from "vitest";
import { cancelOrder, confirmOrder, draftOrder, MAX_AMOUNT_CENTS, OrderError, type Order } from "./order";

const base = {
  id: "o-1",
  number: "ORD-0001",
  customerName: "Μαρία Παπαδοπούλου",
  amountCents: 4990,
  createdAt: new Date("2026-01-01T10:00:00Z"),
};

function withStatus(status: Order["status"]): Order {
  return { ...draftOrder(base), status };
}

describe("draftOrder", () => {
  it("δημιουργεί πρόχειρη παραγγελία με καθαρισμένο όνομα", () => {
    const order = draftOrder({ ...base, customerName: "  Μαρία  " });
    expect(order.status).toBe("draft");
    expect(order.customerName).toBe("Μαρία");
  });

  it.each([
    ["όνομα < 2 χαρακτήρες", { customerName: " Μ " }],
    ["μηδενικό ποσό", { amountCents: 0 }],
    ["αρνητικό ποσό", { amountCents: -100 }],
    ["μη ακέραιο ποσό", { amountCents: 10.5 }],
    ["ποσό πάνω από το όριο", { amountCents: MAX_AMOUNT_CENTS + 1 }],
  ])("απορρίπτει: %s", (_label, override) => {
    expect(() => draftOrder({ ...base, ...override })).toThrow(OrderError);
  });

  it("δέχεται ακριβώς το όριο", () => {
    expect(draftOrder({ ...base, amountCents: MAX_AMOUNT_CENTS }).amountCents).toBe(MAX_AMOUNT_CENTS);
  });
});

describe("μεταβάσεις κατάστασης", () => {
  it("draft → confirmed", () => {
    expect(confirmOrder(withStatus("draft")).status).toBe("confirmed");
  });

  it.each(["confirmed", "cancelled"] as const)("δεν επιβεβαιώνει %s", (status) => {
    expect(() => confirmOrder(withStatus(status))).toThrow(OrderError);
  });

  it.each(["draft", "confirmed"] as const)("%s → cancelled", (status) => {
    expect(cancelOrder(withStatus(status)).status).toBe("cancelled");
  });

  it("δεν ακυρώνει ήδη ακυρωμένη", () => {
    expect(() => cancelOrder(withStatus("cancelled"))).toThrow(OrderError);
  });

  it("δεν αλλάζει το αρχικό αντικείμενο", () => {
    const draft = withStatus("draft");
    confirmOrder(draft);
    expect(draft.status).toBe("draft");
  });
});
