import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { env } from '../config/env.config.js';
import { supabase } from '../config/supabase.config';
import { AppError } from '../middleware/error.middleware.js';

type UploadableFile = {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
};

export type UploadedProductImage = {
    image_url: string;
    storage_path: string;
};

const bucket = env.SUPABASE_PRODUCT_IMAGE_BUCKET;

const sanitizeFileName = (fileName: string): string => {
    const extension = path.extname(fileName).toLowerCase();
    const baseName = path
        .basename(fileName, extension)
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    return `${baseName || 'image'}${extension}`;
};

export const uploadProductImageToStorage = async (
    productId: number,
    file: UploadableFile
): Promise<UploadedProductImage> => {
    const storagePath = `products/${productId}/${Date.now()}-${randomUUID()}-${sanitizeFileName(
        file.originalname
    )}`;

    const { error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });

    if (error) {
        throw new AppError(error.message, 500);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);

    return {
        image_url: data.publicUrl,
        storage_path: storagePath
    };
};

export const deleteProductImageFromStorage = async (
    storagePath: string
): Promise<void> => {
    const { error } = await supabase.storage.from(bucket).remove([storagePath]);
    if (error) throw new AppError(error.message, 500);
};

export const getProductImageStoragePathFromUrl = (
    imageUrl: string
): string | null => {
    try {
        const url = new URL(imageUrl);
        const markers = [
            `/storage/v1/object/public/${bucket}/`,
            `/storage/v1/object/sign/${bucket}/`
        ];
        const marker = markers.find((value) => url.pathname.includes(value));

        if (!marker) return null;

        const pathStart = url.pathname.indexOf(marker) + marker.length;
        return decodeURIComponent(url.pathname.slice(pathStart));
    } catch {
        return null;
    }
};

export const deleteProductImageFromStorageUrl = async (
    imageUrl: string
): Promise<void> => {
    const storagePath = getProductImageStoragePathFromUrl(imageUrl);
    if (!storagePath) return;

    await deleteProductImageFromStorage(storagePath);
};
