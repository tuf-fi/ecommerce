import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.routes";
import { productsRouter } from "./routes/products.routes";
import { cartRouter, ordersRouter } from "./routes/orders.routes";
import { auditRouter } from "./routes/audit.routes";
import { contentRouter } from "./routes/content.routes";
import { reviewsRouter } from "./routes/reviews.routes";
import { marketingRouter } from "./routes/marketing.routes";
import { uploadsRouter } from "./routes/uploads.routes";
import { staffRouter } from "./routes/staff.routes";
import { feedsRouter } from "./routes/feeds.routes";
import { apiLimiter } from "./middleware/rateLimit";
import { HttpError } from "./lib/httpError";

export const app = express();

// Set TRUST_PROXY to the number of reverse proxies in front of the API (e.g. 1) so rate limits see real client addresses.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000", credentials: true }));
app.use(apiLimiter);
// CMS sections can be a few hundred KB of JSON.
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Route mounting is added phase by phase (see BACKEND_ROADMAP.md).
app.use("/auth", authRouter);
app.use("/products", productsRouter);
app.use("/cart", cartRouter);
app.use("/orders", ordersRouter);
app.use("/audit-log", auditRouter);
app.use("/content", contentRouter);
app.use("/reviews", reviewsRouter);
app.use("/uploads", uploadsRouter);
app.use("/staff", staffRouter);
app.use(feedsRouter);
app.use(marketingRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  const code = (err as { code?: string }).code;
  if (code === "P2002") return res.status(409).json({ error: "That value is already in use" });
  if (code === "P2003") return res.status(409).json({ error: "This record is referenced by other data" });
  if (err instanceof SyntaxError && "body" in err) return res.status(400).json({ error: "Invalid JSON" });
  if (code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "File too large" });
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
