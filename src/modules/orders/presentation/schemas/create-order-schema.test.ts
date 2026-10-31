import { describe, expect, it } from "vitest";
import { parseCreateOrder } from "./create-order-schema";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("parseCreateOrder", () => {
  it.each([
    ["49,90", 4990],
    ["49.90", 4990],
    ["10", 1000],
    [" 0,5 ", 50],
  ])("μετατρέπει το ποσό %s σε %i λεπτά", (amount, cents) => {
    const result = parseCreateOrder(form({ customerName: "Μαρία", amount }));
    expect(result).toEqual({ ok: true, data: { customerName: "Μαρία", amountCents: cents } });
  });

  it.each([
    ["κενό", "", /Συμπλήρωσε/],
    ["μη αριθμός", "abc", /αριθμός/],
    ["3 δεκαδικά", "1,999", /δύο δεκαδικά/],
  ])("απορρίπτει ποσό: %s", (_label, amount, message) => {
    const result = parseCreateOrder(form({ customerName: "Μαρία", amount }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.amount).toMatch(message);
  });

  it("απαιτεί όνομα πελάτη", () => {
    const result = parseCreateOrder(form({ customerName: "   ", amount: "10" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.customerName).toBeDefined();
  });

  it("αφήνει τους επιχειρησιακούς κανόνες στο domain (μηδέν και αρνητικά περνούν τη μορφή)", () => {
    expect(parseCreateOrder(form({ customerName: "Μαρία", amount: "0" })).ok).toBe(true);
    expect(parseCreateOrder(form({ customerName: "Μαρία", amount: "-5" })).ok).toBe(true);
  });
});
