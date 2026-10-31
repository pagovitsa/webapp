"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatusChange } from "../contracts";
import { changeOrderStatus, createOrder, OrderError } from "../server";
import { parseCreateOrder, type CreateOrderFieldErrors } from "./schemas/create-order-schema";

export type CreateOrderState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      message?: string;
      fieldErrors?: CreateOrderFieldErrors;
      values: { customerName: string; amount: string };
    };

// TODO: έλεγχος ταυτότητας και δικαιωμάτων όταν προστεθεί το src/server/auth.

export async function createOrderAction(_prev: CreateOrderState, formData: FormData): Promise<CreateOrderState> {
  const values = {
    customerName: String(formData.get("customerName") ?? ""),
    amount: String(formData.get("amount") ?? ""),
  };

  const parsed = parseCreateOrder(formData);
  if (!parsed.ok) {
    return { status: "error", fieldErrors: parsed.errors, values };
  }

  try {
    const order = await createOrder(parsed.data);
    revalidatePath("/orders");
    return { status: "success", message: `Δημιουργήθηκε η παραγγελία ${order.number}.` };
  } catch (error) {
    if (error instanceof OrderError) {
      return { status: "error", message: error.message, values };
    }
    throw error;
  }
}

const statusChanges: readonly OrderStatusChange[] = ["confirm", "cancel"];

export async function changeOrderStatusAction(id: string, change: OrderStatusChange): Promise<void> {
  // Τα ορίσματα φτάνουν από τον client: έλεγχος και εδώ.
  if (typeof id !== "string" || !statusChanges.includes(change)) {
    return;
  }

  try {
    await changeOrderStatus(id, change);
  } catch (error) {
    // Μη έγκυρη μετάβαση (π.χ. διπλό κλικ): η λίστα ανανεώνεται και δείχνει την τρέχουσα κατάσταση.
    if (!(error instanceof OrderError)) throw error;
  }
  revalidatePath("/orders");
}
