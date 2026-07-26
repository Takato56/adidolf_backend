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
import type { AdminListOptions, AdminRecord } from '../utils/adminQuery.utils.js';

const ADMIN_DEFAULT_ORDER = 'created_at';
const ADMIN_SORTABLE_FIELDS = new Set([
    'product_id',
    'category_id',
    'name',
    'base_price',
    'created_at',
    'updated_at',
    'slug',
    'brand',
    'is_published'
]);

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
    /** GET /admin/products — hàng phẳng (không kèm quan hệ), kể cả chưa xuất bản, lọc/sắp xếp/phân trang tùy ý. */
    async adminFindAll(options: AdminListOptions): Promise<AdminRecord[]> {
        let query: any = supabase.from('products').select('*');

        Object.entries(options.filters).forEach(([column, value]) => {
            query = query.eq(column, value);
        });

        const sortColumn =
            options.sort && ADMIN_SORTABLE_FIELDS.has(options.sort)
                ? options.sort
                : ADMIN_DEFAULT_ORDER;

        query = query.order(sortColumn, {
            ascending: options.ascending ?? false
        });

        if (options.limit !== undefined) {
            const offset = options.offset ?? 0;
            query = query.range(offset, offset + options.limit - 1);
        }

        const { data, error } = await query;
        if (error) throw toDatabaseError(error);
        return (data ?? []) as AdminRecord[];
    },

    /** Hàng phẳng cho trang quản trị — không kèm category/images/variants như findById(). */
    async adminFindById(id: number): Promise<AdminRecord | null> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('product_id', id)
            .maybeSingle();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord | null;
    },

    /** Xóa cứng thật sự — khác với delete() công khai (chỉ ẩn is_published). */
    async adminDelete(id: number): Promise<void> {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('product_id', id);

        if (error) throw toDatabaseError(error);
    },

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
