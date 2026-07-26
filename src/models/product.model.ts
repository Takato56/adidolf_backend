import { supabase } from '../config/supabase.config';
import {
    type CreateProductDto,
    type Product,
    type ProductFilters,
    type ProductImage,
    type ProductVariant,
    type ProductWithRelations,
    type UpdateProductDto
} from '../types/product.types.js';
import {
    isSupabaseNotFound,
    toDatabaseError
} from '../utils/supabase-error.utils.js';

const productSelect = `
    *,
    category:categories(category_id,name,slug,image_url),
    images:product_images(image_id,product_id,image_url,alt_text,is_primary,sort_order),
    variants:product_variants(variant_id,product_id,sku,color,size,extra_price,stock_quantity,image_url,created_at)
`;

const sortImages = (images: ProductImage[] = []): ProductImage[] =>
    [...images].sort((left, right) => {
        if (left.is_primary !== right.is_primary)
            return left.is_primary ? -1 : 1;
        return left.sort_order - right.sort_order;
    });

const sortVariants = (variants: ProductVariant[] = []): ProductVariant[] =>
    [...variants].sort((left, right) => left.variant_id - right.variant_id);

const normalizeProduct = (
    product: ProductWithRelations
): ProductWithRelations => {
    const images = sortImages(product.images);

    return {
        ...product,
        images,
        variants: sortVariants(product.variants),
        primary_image:
            images.find((image) => image.is_primary) ?? images[0] ?? null
    };
};

const cleanProductPayload = <T extends CreateProductDto | UpdateProductDto>(
    payload: T
): T => {
    const cleaned = { ...payload };

    Object.keys(cleaned).forEach((key) => {
        const typedKey = key as keyof T;
        if (cleaned[typedKey] === undefined) {
            delete cleaned[typedKey];
        }
    });

    return cleaned;
};

const ProductModel = {
    async findAll(filters?: ProductFilters): Promise<ProductWithRelations[]> {
        let query = supabase
            .from('products')
            .select(productSelect)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (filters?.category_id) {
            query = query.eq('category_id', filters.category_id);
        }
        if (filters?.brand) {
            query = query.eq('brand', filters.brand);
        }
        if (filters?.min_price !== undefined) {
            query = query.gte('base_price', filters.min_price);
        }
        if (filters?.max_price !== undefined) {
            query = query.lte('base_price', filters.max_price);
        }
        if (filters?.search) {
            query = query.ilike('name', `%${filters.search}%`);
        }

        const { data, error } = await query;
        if (error) throw toDatabaseError(error);
        return ((data ?? []) as ProductWithRelations[]).map(normalizeProduct);
    },

    async findById(
        id: number,
        includeUnpublished = false
    ): Promise<ProductWithRelations | null> {
        let query = supabase
            .from('products')
            .select(productSelect)
            .eq('product_id', id);

        if (!includeUnpublished) {
            query = query.eq('is_published', true);
        }

        const { data, error } = await query.maybeSingle();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data ? normalizeProduct(data as ProductWithRelations) : null;
    },

    async findBySlug(slug: string): Promise<ProductWithRelations | null> {
        const { data, error } = await supabase
            .from('products')
            .select(productSelect)
            .eq('slug', slug)
            .eq('is_published', true)
            .maybeSingle();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data ? normalizeProduct(data as ProductWithRelations) : null;
    },

    async create(dto: CreateProductDto): Promise<Product> {
        const payload = cleanProductPayload({
            ...dto,
            is_published: dto.is_published ?? false
        });

        const { data, error } = await supabase
            .from('products')
            .insert(payload)
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as Product;
    },

    async update(id: number, dto: UpdateProductDto): Promise<Product> {
        const payload = cleanProductPayload({
            ...dto,
            updated_at: new Date().toISOString()
        } as UpdateProductDto & { updated_at: string });

        const { data, error } = await supabase
            .from('products')
            .update(payload)
            .eq('product_id', id)
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as Product;
    },

    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('products')
            .update({
                is_published: false,
                updated_at: new Date().toISOString()
            })
            .eq('product_id', id);

        if (error) throw toDatabaseError(error);
    }
};

export default ProductModel;
