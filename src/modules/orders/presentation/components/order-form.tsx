"use client";

import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { createOrderAction, type CreateOrderState } from "../actions";

const initialState: CreateOrderState = { status: "idle" };

export function OrderForm() {
  const [state, formAction, pending] = useActionState(createOrderAction, initialState);
  const failed = state.status === "error" ? state : undefined;

  return (
    <form action={formAction} className="form-stack" noValidate>
      <Field
        label="Πελάτης"
        name="customerName"
        placeholder="π.χ. Μαρία Παπαδοπούλου"
        autoComplete="off"
        defaultValue={failed?.values.customerName}
        error={failed?.fieldErrors?.customerName}
      />
      <Field
        label="Ποσό (€)"
        name="amount"
        inputMode="decimal"
        placeholder="0,00"
        hint="Έως 100.000 €."
        defaultValue={failed?.values.amount}
        error={failed?.fieldErrors?.amount}
      />

      {failed?.message && (
        <p className="form-message form-message--error" role="alert">
          {failed.message}
        </p>
      )}
      {state.status === "success" && (
        <p className="form-message form-message--success" role="status">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Αποθήκευση…" : "Δημιουργία παραγγελίας"}
      </Button>
    </form>
  );
}
