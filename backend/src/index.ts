import "dotenv/config";
import { app } from "./app";
import { prisma } from "./lib/prisma";
import { cancelStaleUnpaidOrders } from "./services/orders.service";
import { purgeOldSessions } from "./services/adminSession.service";
import { purgeOldProofImages } from "./services/proofRetention.service";

const port = Number(process.env.PORT ?? 4000);
const server = app.listen(port, () => console.log(`API listening on http://localhost:${port}`));

// On a redeploy, stop taking new requests, let running ones finish, then close the database.
function shutdown(signal: string) {
  console.log(`[api] ${signal} received, shutting down`);
  setTimeout(() => process.exit(1), 10_000).unref();
  server.close(() => {
    prisma.$disconnect().finally(() => process.exit(0));
  });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

const SWEEP_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
let lastProofPurge = 0;
setInterval(() => {
  if (Date.now() - lastProofPurge >= DAY_MS) {
    lastProofPurge = Date.now();
    purgeOldProofImages()
      .then((n) => n > 0 && console.log(`[proofs] removed ${n} old screenshot image(s)`))
      .catch((err) => console.error("[proofs] purge failed", err));
  }
  cancelStaleUnpaidOrders()
    .then((n) => n > 0 && console.log(`[orders] cancelled ${n} unpaid order(s) past the hold window`))
    .catch((err) => console.error("[orders] sweep failed", err));
  purgeOldSessions().catch((err) => console.error("[sessions] purge failed", err));
}, SWEEP_MS).unref();
