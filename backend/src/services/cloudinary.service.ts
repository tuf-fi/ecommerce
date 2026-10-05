import { v2 as cloudinary } from "cloudinary";
import { HttpError } from "../lib/httpError";

export const UPLOAD_FOLDERS = ["products", "content", "avatars"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

const ALLOWED_FORMATS = "jpg,jpeg,png,webp,avif,gif";

// The browser uploads straight to Cloudinary using a signature minted here, so the API secret never leaves the server.
// The signature covers the folder, format whitelist and timestamp; Cloudinary rejects an upload that changes any of them
// or that is older than about an hour.
export function signUpload(folder: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new HttpError(503, "Image uploads aren't configured yet");

  const timestamp = Math.round(Date.now() / 1000);
  const params = { allowed_formats: ALLOWED_FORMATS, folder: `cindyrella/${folder}`, timestamp };
  const signature = cloudinary.utils.api_sign_request(params, apiSecret);
  return { cloudName, apiKey, signature, ...params };
}
