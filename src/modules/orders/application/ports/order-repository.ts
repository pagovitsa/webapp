import type { Order } from "../../domain/order";

export interface OrderRepository {
  /** Όλες οι παραγγελίες, χωρίς εγγυημένη σειρά. */
  list(): Promise<Order[]>;
  /** Η παραγγελία ή `null` αν δεν υπάρχει. */
  findById(id: string): Promise<Order | null>;
  /** Upsert με βάση το `id`. Χωρίς έλεγχο ταυτόχρονων αλλαγών (το τελευταίο save κερδίζει). */
  save(order: Order): Promise<void>;
  /** Επόμενος αριθμός παραγγελίας, π.χ. "ORD-0001". Δεν είναι ατομικός στην υλοποίηση μνήμης. */
  nextNumber(): Promise<string>;
}
