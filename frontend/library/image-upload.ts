"use client";

import { toast } from "sonner";
import { api, ApiError } from "./api/client";

// 3MB fits a typical compressed photo and keeps uploads quick.
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Checked against actual file bytes, not name/declared MIME, since both are spoofable browser-reported hints.
const MAGIC_BYTES: { mime: string; bytes: number[] }[] = [
    { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
    { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
    { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
];

async function sniffImageMime(file: File): Promise<string | null> {
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    for (const { mime, bytes } of MAGIC_BYTES) {
        if (bytes.every((b, i) => head[i] === b)) return mime;
    }
    // WEBP: "RIFF"....(size)...."WEBP" — bytes 0-3 and 8-11.
    if (
        head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
        head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50
    ) {
        return "image/webp";
    }
    return null;
}

export type UploadFolder = "products" | "content" | "avatars";

// `url` is the hosted Cloudinary URL when uploading is set up. If it isn't (the API answers 503), `url` is a local
// base64 preview instead and `hosted` is false: it displays for this session but can't be saved to the server.
export type ImageValidationResult = { ok: true; url: string; hosted: boolean } | { ok: false; reason: string };

function readAsDataUrl(file: File): Promise<string | null> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

// Signed direct upload: our API signs the request (it holds the Cloudinary secret), the browser sends the file straight to Cloudinary.
async function uploadToCloudinary(file: File, folder: UploadFolder): Promise<string> {
    const sig = await api<{ cloudName: string; apiKey: string; signature: string; timestamp: number; folder: string; allowed_formats: string }>(
        "/uploads/signature",
        { method: "POST", body: JSON.stringify({ folder }) }
    );
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);
    form.append("allowed_formats", sig.allowed_formats);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error("Cloudinary rejected the upload");
    const body = (await res.json()) as { secure_url?: string };
    if (!body.secure_url) throw new Error("Cloudinary returned no URL");
    return body.secure_url;
}

// Validates size, declared MIME, and sniffed magic bytes, then uploads. Shared by every upload field so the checks can't drift or be skipped.
export async function validateAndReadImage(file: File, folder: UploadFolder = "content"): Promise<ImageValidationResult> {
    if (file.size > MAX_IMAGE_BYTES) {
        return { ok: false, reason: `Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB) — max ${MAX_IMAGE_BYTES / 1024 / 1024}MB.` };
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return { ok: false, reason: "Unsupported file type — use JPG, PNG, WEBP, or GIF." };
    }
    if (!(await sniffImageMime(file))) return { ok: false, reason: "This file doesn't look like a real image." };

    try {
        return { ok: true, url: await uploadToCloudinary(file, folder), hosted: true };
    } catch (err) {
        if (err instanceof ApiError && err.status === 503) {
            const preview = await readAsDataUrl(file);
            if (!preview) return { ok: false, reason: "Couldn't read this file." };
            toast.message("Image hosting isn't set up yet — this photo shows for now but won't be saved.");
            return { ok: true, url: preview, hosted: false };
        }
        if (err instanceof ApiError) return { ok: false, reason: err.message };
        return { ok: false, reason: "The upload failed. Please try again." };
    }
}
