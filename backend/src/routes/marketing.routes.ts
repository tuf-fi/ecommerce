import { Router } from "express";
import { formsLimiter } from "../middleware/rateLimit";
import * as marketing from "../controllers/marketing.controller";

// Mounted at the app root because the three public forms live at /newsletter, /contact and /promo.
export const marketingRouter = Router();

marketingRouter.post("/newsletter/subscribe", formsLimiter, marketing.subscribeNewsletter);
marketingRouter.post("/contact", formsLimiter, marketing.submitContact);
marketingRouter.post("/promo/subscribe", formsLimiter, marketing.subscribePromo);
