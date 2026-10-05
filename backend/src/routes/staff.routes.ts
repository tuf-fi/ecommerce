import { Router } from "express";
import { z } from "zod";
import { requireStaff } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import * as staff from "../controllers/staff.controller";

export const staffRouter = Router();

const idParams = z.object({ id: z.coerce.number().int().positive() });

// Managing accounts is administrators only, and the controller adds the "last administrator" and "not yourself" rules.
staffRouter.use(requireStaff, requireRole("ADMINISTRATOR"));
staffRouter.get("/", staff.listStaff);
staffRouter.post("/", validate({ body: staff.createStaffSchema }), staff.createStaff);
staffRouter.patch("/:id", validate({ params: idParams, body: staff.updateStaffSchema }), staff.updateStaff);
staffRouter.delete("/:id", validate({ params: idParams }), staff.deleteStaff);
