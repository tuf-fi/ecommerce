import { Router } from "express";
import { requireStaff } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import * as audit from "../controllers/audit.controller";

export const auditRouter = Router();

auditRouter.get("/", requireStaff, requireRole("ADMINISTRATOR"), audit.listAuditLog);
