import { type Request, type Response } from 'express';
import ProductModel from '../models/product.model.js';
import ProductImageModel from '../models/productImage.model.js';
import { AppError } from '../middleware/error.middleware.js';
import {
    deleteProductImageFromStorage,
    deleteProductImageFromStorageUrl,
    uploadProductImageToStorage,
    type UploadedProductImage
} from '../services/storage.service.js';
import {
    createProductImagesSchema,
    createProductSchema,
    productFiltersSchema,
    productIdSchema,
    productImageIdSchema,
    updateProductImageSchema,
    updateProductSchema
} from '../validators/product.validator.js';
import { generateSlug } from '../utils/slug.utils.js';
import { type ProductImageInput } from '../types/product.types.js';

const getProductOrThrow = async (id: number, includeUnpublished = false) => {
    const product = await ProductModel.findById(id, includeUnpublished);
    if (!product) throw new AppError('Product not found', 404);
    return product;
};

const assertProductImage = async (productId: number, imageId: number) => {
    const image = await ProductImageModel.findById(imageId);
    if (!image || image.product_id !== productId) {
        throw new AppError('Product image not found', 404);
    }
    return image;
};

const asFiles = (files: Request['files']): Express.Multer.File[] => {
    if (!files) return [];
    if (Array.isArray(files)) return files;

    return Object.values(files).flat();
};

const fieldAt = (value: unknown, index: number): string | undefined => {
    if (Array.isArray(value)) {
        const item = value[index];
        return item === undefined ? undefined : String(item);
    }

    return value === undefined ? undefined : String(value);
};

const boolFieldAt = (value: unknown, index: number): boolean | undefined => {
    const raw = fieldAt(value, index);
    if (raw === undefined || raw === '') return undefined;
    if (raw.toLowerCase() === 'true') return true;
    if (raw.toLowerCase() === 'false') return false;

    throw new AppError('is_primary must be true or false', 400);
};

const numberFieldAt = (value: unknown, index: number): number | undefined => {
    const raw = fieldAt(value, index);
    if (raw === undefined || raw === '') return undefined;

    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new AppError('sort_order must be a non-negative integer', 400);
    }

    return parsed;
};

const toUploadedImageInputs = (
    uploads: UploadedProductImage[],
    body: Request['body']
): ProductImageInput[] =>
    uploads.map((upload, index) => ({
        image_url: upload.image_url,
        alt_text: fieldAt(body.alt_text, index) ?? null,
        is_primary: boolFieldAt(body.is_primary, index),
        sort_order: numberFieldAt(body.sort_order, index) ?? index
    }));

const cleanupUploadedFiles = async (
    uploads: UploadedProductImage[]
): Promise<void> => {
    await Promise.allSettled(
        uploads.map((upload) =>
            deleteProductImageFromStorage(upload.storage_path)
        )
    );
};

export const getAllProducts = async (req: Request, res: Response) => {
    const filters = productFiltersSchema.parse(req.query);
    const products = await ProductModel.findAll(filters);

    res.json({ status: 'success', data: products });
};

export const getProductById = async (req: Request, res: Response) => {
    const id = productIdSchema.parse(req.params.id);
    const product = await getProductOrThrow(id);

    res.json({ status: 'success', data: product });
};

export const getProductBySlug = async (req: Request, res: Response) => {
    const product = await ProductModel.findBySlug(req.params.slug as string);
    if (!product) throw new AppError('Product not found', 404);

    res.json({ status: 'success', data: product });
};

export const createProduct = async (req: Request, res: Response) => {
    const parsed = createProductSchema.parse(req.body);
    const { images = [], ...productPayload } = parsed;
    const product = await ProductModel.create({
        ...productPayload,
        slug: productPayload.slug ?? generateSlug(productPayload.name)
    });

    if (images.length > 0) {
        await ProductImageModel.createMany(product.product_id, images, {
            defaultPrimary: true
        });
    }

    const created = await ProductModel.findById(product.product_id, true);
    res.status(201).json({ status: 'success', data: created ?? product });
};

export const updateProduct = async (req: Request, res: Response) => {
    const id = productIdSchema.parse(req.params.id);
    await getProductOrThrow(id, true);

    const parsed = updateProductSchema.parse(req.body);
    const product = await ProductModel.update(id, {
        ...parsed,
        slug:
            parsed.slug ?? (parsed.name ? generateSlug(parsed.name) : undefined)
    });
    const updated = await ProductModel.findById(product.product_id, true);

    res.json({ status: 'success', data: updated ?? product });
};

export const deleteProduct = async (req: Request, res: Response) => {
    const id = productIdSchema.parse(req.params.id);
    await getProductOrThrow(id, true);

    await ProductModel.delete(id);
    res.status(204).send();
};

export const getProductImages = async (req: Request, res: Response) => {
    const id = productIdSchema.parse(req.params.id);
    await getProductOrThrow(id);

    const images = await ProductImageModel.findByProductId(id);
    res.json({ status: 'success', data: images });
};

export const createProductImages = async (req: Request, res: Response) => {
    const id = productIdSchema.parse(req.params.id);
    await getProductOrThrow(id, true);

    const images = createProductImagesSchema.parse(req.body);
    const existingCount = await ProductImageModel.countByProductId(id);
    const created = await ProductImageModel.createMany(id, images, {
        defaultPrimary: existingCount === 0
    });

    res.status(201).json({ status: 'success', data: created });
};

export const uploadProductImages = async (req: Request, res: Response) => {
    const id = productIdSchema.parse(req.params.id);
    await getProductOrThrow(id, true);

    const files = asFiles(req.files);
    if (files.length === 0) {
        throw new AppError('At least one image file is required', 400);
    }

    const uploads = await Promise.all(
        files.map((file) => uploadProductImageToStorage(id, file))
    );

    try {
        const existingCount = await ProductImageModel.countByProductId(id);
        const images = toUploadedImageInputs(uploads, req.body);
        const created = await ProductImageModel.createMany(id, images, {
            defaultPrimary: existingCount === 0
        });

        res.status(201).json({ status: 'success', data: created });
    } catch (error) {
        await cleanupUploadedFiles(uploads);
        throw error;
    }
};

export const updateProductImage = async (req: Request, res: Response) => {
    const productId = productIdSchema.parse(req.params.id);
    const imageId = productImageIdSchema.parse(req.params.imageId);
    await getProductOrThrow(productId, true);

    const image = await assertProductImage(productId, imageId);
    const parsed = updateProductImageSchema.parse(req.body);
    const updated = await ProductImageModel.update(image, parsed);

    if (parsed.image_url && parsed.image_url !== image.image_url) {
        await deleteProductImageFromStorageUrl(image.image_url).catch(
            (error: unknown) => {
                console.warn('Unable to remove old product image:', error);
            }
        );
    }

    res.json({ status: 'success', data: updated });
};

export const deleteProductImage = async (req: Request, res: Response) => {
    const productId = productIdSchema.parse(req.params.id);
    const imageId = productImageIdSchema.parse(req.params.imageId);
    await getProductOrThrow(productId, true);

    const image = await assertProductImage(productId, imageId);
    await ProductImageModel.delete(imageId);
    await deleteProductImageFromStorageUrl(image.image_url).catch(
        (error: unknown) => {
            console.warn('Unable to remove product image:', error);
        }
    );

    res.status(204).send();
};
