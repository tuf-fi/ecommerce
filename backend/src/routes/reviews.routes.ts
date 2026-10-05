import { Router } from "express";
import { requireCustomer } from "../middleware/auth";
import { checkoutLimiter } from "../middleware/rateLimit";
import * as reviews from "../controllers/reviews.controller";

export const reviewsRouter = Router();

reviewsRouter.post("/", checkoutLimiter, requireCustomer, reviews.createReview);
