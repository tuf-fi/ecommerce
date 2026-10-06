import type { Response } from "express";

// Open "live" connections per customer. In-memory, so it covers a single API process; with several instances a shared
// channel (e.g. Postgres LISTEN/NOTIFY or Redis) would be needed. The 60s refresh on the site still catches anything missed.
const clients = new Map<number, Set<Response>>();

export function subscribe(customerId: number, res: Response) {
  const set = clients.get(customerId) ?? new Set<Response>();
  set.add(res);
  clients.set(customerId, set);
  return () => {
    set.delete(res);
    if (set.size === 0) clients.delete(customerId);
  };
}

export function publish(customerId: number, event: string, data: unknown) {
  for (const res of clients.get(customerId) ?? []) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
