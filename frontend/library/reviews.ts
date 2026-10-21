export type Review = {
    id: number;
    productId: number;
    author: string;
    rating: number;
    text: string;
    date: string;
    // Full addresses of the photos the customer attached, in order.
    photos?: string[];
};
