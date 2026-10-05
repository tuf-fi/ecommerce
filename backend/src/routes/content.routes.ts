import { Router } from "express";
import { requireStaff } from "../middleware/auth";
import { requireSection } from "../middleware/section";
import * as content from "../controllers/content.controller";

export const contentRouter = Router();

contentRouter.get("/", content.getAllContent);
contentRouter.get("/:section", content.getContent);
contentRouter.patch("/:section", requireStaff, requireSection("content"), content.saveContent);
