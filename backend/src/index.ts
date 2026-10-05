import "dotenv/config";
import { app } from "./app";
import { cancelStaleUnpaidOrders } from "./services/orders.service";
import { purgeOldSessions } from "./services/adminSession.service";

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));

const SWEEP_MS = 5 * 60 * 1000;
setInterval(() => {
  cancelStaleUnpaidOrders()
    .then((n) => n > 0 && console.log(`[orders] cancelled ${n} unpaid order(s) past the hold window`))
    .catch((err) => console.error("[orders] sweep failed", err));
  purgeOldSessions().catch((err) => console.error("[sessions] purge failed", err));
}, SWEEP_MS).unref();
