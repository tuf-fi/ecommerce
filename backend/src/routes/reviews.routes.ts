import { Router } from "express";
import multer from "multer";
import { requireCustomer } from "../middleware/auth";
import { checkoutLimiter } from "../middleware/rateLimit";
import * as reviews from "../controllers/reviews.controller";
import { MAX_REVIEW_PHOTOS } from "../controllers/reviews.controller";

export const reviewsRouter = Router();

// Optional photos (JPG/PNG/WEBP, 3 MB each, up to MAX_REVIEW_PHOTOS) are held in memory just long enough to check and store them.
const photoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024, files: MAX_REVIEW_PHOTOS, fields: 5 } });

reviewsRouter.post("/", checkoutLimiter, requireCustomer, photoUpload.array("photos", MAX_REVIEW_PHOTOS), reviews.createReview);
reviewsRouter.get("/:id/photos/:photoId", reviews.getReviewPhoto);
