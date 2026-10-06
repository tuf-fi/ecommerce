import { Router } from "express";
import { z } from "zod";
import { requireStaff } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import * as vouchers from "../controllers/vouchers.controller";

// Discount codes, administrators only. (A customer's own list is GET /vouchers/mine in feeds.routes.ts.)
export const vouchersRouter = Router();
vouchersRouter.use(requireStaff, requireRole("ADMINISTRATOR"));

vouchersRouter.get("/", vouchers.listVouchers);
vouchersRouter.post("/", validate({ body: vouchers.createVoucherSchema }), vouchers.createVoucher);
vouchersRouter.patch("/:id", validate({ params: z.object({ id: z.coerce.number().int().positive() }), body: vouchers.updateVoucherSchema }), vouchers.updateVoucher);
vouchersRouter.delete("/:id", validate({ params: z.object({ id: z.coerce.number().int().positive() }) }), vouchers.deleteVoucher);
