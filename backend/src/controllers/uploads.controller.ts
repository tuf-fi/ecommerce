import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";
import { COOKIE_NAMES, verifyToken } from "../lib/jwt";
import { signUpload, UPLOAD_FOLDERS } from "../services/cloudinary.service";

const bodySchema = z.object({ folder: z.enum(UPLOAD_FOLDERS) });

// Staff may upload catalogue and site images; a signed-in customer may upload only their own avatar.
export async function uploadSignature(req: Request, res: Response) {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Choose a valid upload folder");
  const { folder } = parsed.data;

  const staffId = verifyToken("staff", req.cookies?.[COOKIE_NAMES.staff]);
  const staff = staffId === null ? null : await prisma.staffMember.findUnique({ where: { id: staffId }, select: { id: true } });
  const customerId = verifyToken("customer", req.cookies?.[COOKIE_NAMES.customer]);

  // Folder decides who is acting, so a browser holding both sessions still works.
  if (folder === "avatars") {
    if (customerId === null) throw new HttpError(staff ? 403 : 401, staff ? "Sign in as a customer to upload an avatar" : "Not signed in");
  } else if (!staff) {
    throw new HttpError(customerId !== null ? 403 : 401, customerId !== null ? "Not allowed to upload there" : "Not signed in");
  }
  res.json(signUpload(folder));
}
