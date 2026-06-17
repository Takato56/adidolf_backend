export interface Category {
    category_id: number;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    created_at: string;
}

export interface CreateCategoryDto {
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
}

export interface UpdateCategoryDto {
    name?: string;
    slug?: string;
    description?: string;
    image_url?: string;
}
