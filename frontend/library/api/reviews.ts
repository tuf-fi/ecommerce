import { api } from "./client";
import type { Review } from "../reviews";

export const listProductReviews = (productId: number) =>
    api<{ total: number; reviews: Review[] }>(`/products/${productId}/reviews?pageSize=50`);

export const createReview = (input: { productId: number; rating: number; text: string }) =>
    api<{ review: Review }>("/reviews", { method: "POST", body: JSON.stringify(input) });
