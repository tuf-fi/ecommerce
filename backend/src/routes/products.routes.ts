import { Router } from "express";
import multer from "multer";
import { requireStaff } from "../middleware/auth";
import { requireSection } from "../middleware/section";
import * as products from "../controllers/products.controller";
import * as reviews from "../controllers/reviews.controller";

export const productsRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024, files: 1 } });

// Fixed paths must be registered before "/:id".
productsRouter.get("/", products.listProducts);
productsRouter.get("/admin", requireStaff, requireSection("inventory"), products.listProductsAdmin);
productsRouter.get("/export.csv", requireStaff, requireSection("inventory"), products.exportCsv);
productsRouter.post("/import", requireStaff, requireSection("inventory"), upload.single("file"), products.importCsv);
productsRouter.get("/stock-log", requireStaff, requireSection("inventory"), products.stockLogAll);

productsRouter.post("/", requireStaff, requireSection("inventory"), products.createProduct);
productsRouter.get("/:id", products.getProduct);
productsRouter.get("/:id/reviews", reviews.listForProduct);
productsRouter.patch("/:id", requireStaff, requireSection("inventory"), products.updateProduct);
productsRouter.delete("/:id", requireStaff, requireSection("inventory"), products.deleteProduct);
productsRouter.post("/:id/stock-adjustment", requireStaff, requireSection("inventory"), products.stockAdjustment);
productsRouter.get("/:id/stock-log", requireStaff, requireSection("inventory"), products.stockLogForProduct);
