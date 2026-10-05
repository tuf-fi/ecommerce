import { Router } from "express";
import { uploadSignLimiter } from "../middleware/rateLimit";
import * as uploads from "../controllers/uploads.controller";

export const uploadsRouter = Router();

uploadsRouter.post("/signature", uploadSignLimiter, uploads.uploadSignature);
