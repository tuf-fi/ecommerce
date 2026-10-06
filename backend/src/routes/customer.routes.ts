import { Router } from "express";
import { z } from "zod";
import { requireCustomer } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as data from "../controllers/customerData.controller";
import * as notifications from "../controllers/customerNotifications.controller";

// A signed-in customer's own saved data. Each router is mounted on its own path (see app.ts) and checks sign-in for
// everything it handles, so neither may be mounted at the app root.
const idParams = z.object({ id: z.coerce.number().int().positive() });
const productParams = z.object({ productId: z.coerce.number().int().positive() });

export const addressesRouter = Router();
addressesRouter.use(requireCustomer);
addressesRouter.get("/", data.listAddresses);
addressesRouter.post("/", validate({ body: data.addressSchema }), data.createAddress);
addressesRouter.patch("/:id", validate({ params: idParams, body: data.addressPatchSchema }), data.updateAddress);
addressesRouter.delete("/:id", validate({ params: idParams }), data.deleteAddress);

export const wishlistRouter = Router();
wishlistRouter.use(requireCustomer);
wishlistRouter.get("/", data.getWishlist);
wishlistRouter.post("/merge", validate({ body: data.mergeWishlistSchema }), data.mergeWishlist);
wishlistRouter.put("/:productId", validate({ params: productParams }), data.addToWishlist);
wishlistRouter.delete("/:productId", validate({ params: productParams }), data.removeFromWishlist);

export const myNotificationsRouter = Router();
myNotificationsRouter.use(requireCustomer);
myNotificationsRouter.get("/", notifications.listMine);
myNotificationsRouter.get("/stream", notifications.stream);
myNotificationsRouter.post("/test", notifications.sendTest);
myNotificationsRouter.post("/read", validate({ body: notifications.markReadSchema }), notifications.markRead);
