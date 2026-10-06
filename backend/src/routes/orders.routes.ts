import { Router } from "express";
import multer from "multer";
import { requireCustomer, requireStaff, requireStaffOrCustomer, softCustomer } from "../middleware/auth";
import { requireSection } from "../middleware/section";
import { validate, orderNoParams, proofParams } from "../middleware/validate";
import { checkoutLimiter } from "../middleware/rateLimit";
import * as orders from "../controllers/orders.controller";
import * as proofs from "../controllers/proofs.controller";
import * as ordersCsv from "../controllers/ordersCsv.controller";
import * as refunds from "../controllers/refunds.controller";
import { requireRole } from "../middleware/rbac";
import * as audit from "../controllers/audit.controller";

export const ordersRouter = Router();
export const cartRouter = Router();

cartRouter.post("/check", softCustomer, orders.cartCheck);

ordersRouter.post("/", checkoutLimiter, requireCustomer, orders.placeOrder);
ordersRouter.get("/", requireCustomer, orders.myOrders);
ordersRouter.get("/admin", requireStaff, requireSection("orders"), orders.allOrders);
// Spreadsheet export/import of orders: anyone with Orders access, same as working the orders by hand.
const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024, files: 1 } });
ordersRouter.get("/export.csv", requireStaff, requireSection("orders"), ordersCsv.exportOrders);
ordersRouter.post("/import", requireStaff, requireSection("orders"), csvUpload.single("file"), ordersCsv.importOrderStatuses);
// Recording a refund (money already sent back by hand) is administrators only.
ordersRouter.post("/:no/refund", requireStaff, requireSection("orders"), requireRole("ADMINISTRATOR"), validate({ params: orderNoParams, body: refunds.refundSchema }), refunds.recordRefund);
ordersRouter.post("/:no/reopen", requireStaff, requireSection("orders"), requireRole("ADMINISTRATOR"), validate({ params: orderNoParams }), refunds.reopenOrder);
ordersRouter.post("/:no/cancel", requireCustomer, validate({ params: orderNoParams }), orders.cancelMyOrder);
ordersRouter.patch("/:no/status", requireStaff, requireSection("orders"), validate({ params: orderNoParams }), orders.setStatus);
// Screenshots are held in memory just long enough to check and store them: JPG/PNG/WEBP, 3 MB, one file.
const proofUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024, files: 1, fields: 5 } });
ordersRouter.post("/:no/payment-proofs", checkoutLimiter, requireCustomer, validate({ params: orderNoParams }), proofUpload.single("file"), proofs.submitProof);
ordersRouter.get("/:no/payment-proofs/:id/image", requireStaffOrCustomer, validate({ params: proofParams }), proofs.getProofImage);
ordersRouter.patch("/:no/payment-proofs/:id", requireStaff, requireSection("orders"), validate({ params: proofParams, body: proofs.reviewProofSchema }), proofs.reviewProof);
ordersRouter.get("/:no/history", requireStaff, requireSection("orders"), validate({ params: orderNoParams }), audit.orderHistory);
