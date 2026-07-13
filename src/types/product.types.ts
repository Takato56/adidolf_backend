export interface Product {
    product_id: number;
    category_id: number;
    name: string;
    slug: string;
    description: string | null;
    base_price: number;
    brand: string | null;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProductCategory {
    category_id: number;
    name: string;
    slug: string;
    image_url: string | null;
}

export interface ProductVariant {
    variant_id: number;
    product_id: number;
    sku: string;
    color: string | null;
    size: string | null;
    extra_price: number;
    stock_quantity: number;
    image_url: string | null;
    created_at: string;
}

export interface ProductImage {
    image_id: number;
    product_id: number;
    image_url: string;
    alt_text: string | null;
    is_primary: boolean;
    sort_order: number;
}

export interface ProductWithRelations extends Product {
    category?: ProductCategory | null;
    variants?: ProductVariant[];
    images?: ProductImage[];
    primary_image?: ProductImage | null;
}

export interface CreateProductDto {
    category_id: number;
    name: string;
    slug: string;
    description?: string | null;
    base_price: number;
    brand?: string | null;
    is_published?: boolean;
}

export interface UpdateProductDto {
    category_id?: number;
    name?: string;
    slug?: string;
    description?: string | null;
    base_price?: number;
    brand?: string | null;
    is_published?: boolean;
}

export interface ProductImageInput {
    image_url: string;
    alt_text?: string | null;
    is_primary?: boolean;
    sort_order?: number;
}

export interface CreateProductImageDto extends ProductImageInput {
    product_id: number;
}

export interface UpdateProductImageDto {
    image_url?: string;
    alt_text?: string | null;
    is_primary?: boolean;
    sort_order?: number;
}

export interface CreateProductVariantDto {
    product_id: number;
    sku: string;
    color?: string | null;
    size?: string | null;
    extra_price?: number;
    stock_quantity?: number;
    image_url?: string | null;
}

export interface ProductFilters {
    category_id?: number;
    brand?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
}
