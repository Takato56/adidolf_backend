import { supabase } from '../config/supabase.config';
import {
    type CreateProductImageDto,
    type ProductImage,
    type ProductImageInput,
    type UpdateProductImageDto
} from '../types/product.types.js';
import {
    isSupabaseNotFound,
    toDatabaseError
} from '../utils/supabase-error.utils.js';

type CreateManyOptions = {
    defaultPrimary?: boolean;
};

const table = 'product_images';

const normalizeCreatePayloads = (
    productId: number,
    images: ProductImageInput[],
    options: CreateManyOptions = {}
): CreateProductImageDto[] => {
    const explicitPrimaryIndex = images.findIndex(
        (image) => image.is_primary === true
    );
    const primaryIndex =
        explicitPrimaryIndex >= 0
            ? explicitPrimaryIndex
            : options.defaultPrimary
              ? 0
              : -1;

    return images.map((image, index) => ({
        product_id: productId,
        image_url: image.image_url,
        alt_text: image.alt_text ?? null,
        is_primary: index === primaryIndex,
        sort_order: image.sort_order ?? index
    }));
};

const cleanUpdatePayload = (
    payload: UpdateProductImageDto
): UpdateProductImageDto => {
    const cleaned = { ...payload };

    Object.keys(cleaned).forEach((key) => {
        const typedKey = key as keyof UpdateProductImageDto;
        if (cleaned[typedKey] === undefined) {
            delete cleaned[typedKey];
        }
    });

    return cleaned;
};

const ProductImageModel = {
    async findById(id: number): Promise<ProductImage | null> {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('image_id', id)
            .maybeSingle();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return (data as ProductImage | null) ?? null;
    },

    async findByProductId(productId: number): Promise<ProductImage[]> {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('product_id', productId)
            .order('is_primary', { ascending: false })
            .order('sort_order', { ascending: true });

        if (error) throw toDatabaseError(error);
        return (data ?? []) as ProductImage[];
    },

    async countByProductId(productId: number): Promise<number> {
        const { count, error } = await supabase
            .from(table)
            .select('image_id', { count: 'exact', head: true })
            .eq('product_id', productId);

        if (error) throw toDatabaseError(error);
        return count ?? 0;
    },

    async clearPrimary(productId: number): Promise<void> {
        const { error } = await supabase
            .from(table)
            .update({ is_primary: false })
            .eq('product_id', productId)
            .eq('is_primary', true);

        if (error) throw toDatabaseError(error);
    },

    async createMany(
        productId: number,
        images: ProductImageInput[],
        options?: CreateManyOptions
    ): Promise<ProductImage[]> {
        if (images.length === 0) return [];

        const payloads = normalizeCreatePayloads(productId, images, options);
        if (payloads.some((image) => image.is_primary)) {
            await this.clearPrimary(productId);
        }

        const { data, error } = await supabase
            .from(table)
            .insert(payloads)
            .select('*')
            .order('is_primary', { ascending: false })
            .order('sort_order', { ascending: true });

        if (error) throw toDatabaseError(error);
        return (data ?? []) as ProductImage[];
    },

    async update(
        image: ProductImage,
        dto: UpdateProductImageDto
    ): Promise<ProductImage> {
        const payload = cleanUpdatePayload(dto);

        if (payload.is_primary) {
            await this.clearPrimary(image.product_id);
        }

        const { data, error } = await supabase
            .from(table)
            .update(payload)
            .eq('image_id', image.image_id)
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as ProductImage;
    },

    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('image_id', id);

        if (error) throw toDatabaseError(error);
    }
};

export default ProductImageModel;
