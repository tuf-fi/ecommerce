import type { ActorType, OrderStatus, Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

type Db = Prisma.TransactionClient | typeof prisma;

// Who did something. `name` is snapshotted so the record stays readable if the account is later renamed or deleted.
export type Actor = { type: ActorType; id?: number | null; name: string };

export const SYSTEM_ACTOR: Actor = { type: "SYSTEM", name: "System" };
export const staffActor = (staff: { id: number; name: string }): Actor => ({ type: "STAFF", id: staff.id, name: staff.name });
export const customerActor = (customer: { id: number; name: string }): Actor => ({ type: "CUSTOMER", id: customer.id, name: customer.name });

// Pass the transaction client when the change itself runs in a transaction, so the record commits or rolls back with it.
export function recordOrderStatus(
  db: Db,
  input: { orderId: number; from: OrderStatus | null; to: OrderStatus; actor: Actor; note?: string | null },
) {
  return db.orderStatusHistory.create({
    data: {
      orderId: input.orderId,
      fromStatus: input.from,
      toStatus: input.to,
      actorType: input.actor.type,
      actorId: input.actor.id ?? null,
      actorName: input.actor.name,
      note: input.note ?? null,
    },
  });
}

// Generic trail for anything else. Call after a successful mutation, inside its transaction where there is one.
export function record(
  db: Db,
  input: { entityType: string; entityId: string | number; action: string; actor: Actor; details?: Prisma.InputJsonValue },
) {
  return db.auditLog.create({
    data: {
      entityType: input.entityType,
      entityId: String(input.entityId),
      action: input.action,
      actorType: input.actor.type,
      actorId: input.actor.id ?? null,
      actorName: input.actor.name,
      details: input.details,
    },
  });
}
