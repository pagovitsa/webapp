export type OrderStatus = "draft" | "confirmed" | "cancelled";

export type OrderSummary = {
  id: string;
  number: string;
  customerName: string;
  amountCents: number;
  status: OrderStatus;
  createdAt: string;
};

export type CreateOrderInput = {
  customerName: string;
  amountCents: number;
};

export type OrderStatusChange = "confirm" | "cancel";
