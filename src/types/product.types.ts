export interface Product {
    product_id: number;
    category_id: number;
    name: string;
    slug: string;
    description: string;
    base_price: number;
    brand: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateProductDto {
    category_id: number;
    name: string;
    slug: string;
    description: string;
    base_price: number;
    brand: string;
}

export interface UpdateProductDto {
    category_id?: number;
    name?: string;
    slug?: string;
    description?: string;
    base_price?: number;
    brand?: string;
    is_published?: boolean;
}

export interface ProductFilters {
    category_id?: number;
    brand?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
}
