export interface Review {
    review_id: number;
    product_id: number;
    user_id: number;
    order_item_id: number | null;
    rating: number;
    comment: string | null;
    image_urls: string[] | null;
    is_approved: boolean;
    created_at: string;
}

export interface ReviewWithReviewer extends Review {
    reviewer_name: string;
}

export interface CreateReviewDto {
    rating: number;
    comment?: string;
    order_item_id?: number;
}

export interface UpdateReviewDto {
    rating?: number;
    comment?: string;
}
