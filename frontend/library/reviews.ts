export type Review = {
    id: number;
    productId: number;
    author: string;
    rating: number;
    text: string;
    date: string;
};

// TODO: replace with real reviews fetched from the backend API — this is mock seed data only.
export const REVIEWS: Review[] = [
    {
        id: 1,
        productId: 1,
        author: "Marga T.",
        rating: 5,
        text: "Been using this for three weeks and the texture change on my chin is real. No stinging, no flaking — just works.",
        date: "2026-06-02",
    },
    {
        id: 2,
        productId: 1,
        author: "Rina D.",
        rating: 4,
        text: "Good serum, a little tacky under makeup if you don't wait long enough to absorb. Otherwise solid.",
        date: "2026-05-18",
    },
    {
        id: 3,
        productId: 2,
        author: "Cel A.",
        rating: 5,
        text: "My barrier was wrecked from over-exfoliating and this brought it back in about a week. Rich but not greasy.",
        date: "2026-06-10",
    },
    {
        id: 4,
        productId: 3,
        author: "Joyce L.",
        rating: 5,
        text: "Finally a gel-cream that doesn't disappear by noon. Combination skin approved.",
        date: "2026-04-29",
    },
    {
        id: 5,
        productId: 10,
        author: "Anne P.",
        rating: 4,
        text: "Fades my post-breakout marks slowly but surely. Patience required, but it's gentle enough for daily use like it says.",
        date: "2026-07-01",
    },
    {
        id: 6,
        productId: 10,
        author: "Sheila K.",
        rating: 5,
        text: "10% azelaic acid and my skin didn't protest at all. Evened out my tone in about a month.",
        date: "2026-06-20",
    },
];

export function getReviewsForProduct(productId: number): Review[] {
    return REVIEWS.filter((r) => r.productId === productId);
}
