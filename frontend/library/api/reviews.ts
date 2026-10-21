import { api, API_BASE_URL } from "./client";
import type { Review } from "../reviews";

export const MAX_REVIEW_PHOTOS = 4;

// The API sends photo paths; the website needs full addresses to load them from another origin.
const withPhotoUrls = (r: Review): Review => ({ ...r, photos: (r.photos ?? []).map((p) => `${API_BASE_URL}${p}`) });

export const listProductReviews = (productId: number) =>
    api<{ total: number; reviews: Review[] }>(`/products/${productId}/reviews?pageSize=50`).then((d) => ({ ...d, reviews: d.reviews.map(withPhotoUrls) }));

export const createReview = (input: { productId: number; rating: number; text: string; photos?: File[] }) => {
    const { photos = [], ...fields } = input;
    if (photos.length === 0) {
        return api<{ review: Review }>("/reviews", { method: "POST", body: JSON.stringify(fields) }).then((d) => ({ review: withPhotoUrls(d.review) }));
    }
    const form = new FormData();
    form.append("productId", String(fields.productId));
    form.append("rating", String(fields.rating));
    form.append("text", fields.text);
    photos.forEach((p) => form.append("photos", p));
    return api<{ review: Review }>("/reviews", { method: "POST", body: form }).then((d) => ({ review: withPhotoUrls(d.review) }));
};
