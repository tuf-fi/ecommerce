import { Router } from "express";
import { requireCustomer, requireStaff } from "../middleware/auth";
import { requireSection } from "../middleware/section";
import { validate } from "../middleware/validate";
import * as feeds from "../controllers/adminFeeds.controller";

// Mounted at the app root: /customers, /notifications and /vouchers.
export const feedsRouter = Router();

feedsRouter.get("/customers", requireStaff, requireSection("customers"), feeds.listCustomers);
feedsRouter.get("/notifications", requireStaff, feeds.listNotifications);
feedsRouter.post("/notifications/read", requireStaff, validate({ body: feeds.markReadSchema }), feeds.markNotificationsRead);
feedsRouter.get("/vouchers/mine", requireCustomer, feeds.myVouchers);
