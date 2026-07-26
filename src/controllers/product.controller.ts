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
import {
    type CreateProductDto,
    type ProductImageInput,
    type UpdateProductDto
} from '../types/product.types.js';
import {
    parseNumericId,
    pickAllowedFields,
    assertRequiredFields,
    parseLimit,
    parseOffset,
    parseOrder,
    collectFilters
} from '../utils/adminQuery.utils.js';

const ADMIN_PRODUCT_PRIMARY_KEY = 'product_id';
const ADMIN_PRODUCT_ALLOWED_FIELDS = [
    'category_id',
    'name',
    'slug',
    'description',
    'base_price',
    'brand',
    'is_published'
] as const;
const ADMIN_PRODUCT_REQUIRED_CREATE_FIELDS = [
    'category_id',
    'name',
    'slug',
    'base_price'
] as const;
const ADMIN_PRODUCT_FILTER_FIELDS = ['category_id', 'slug', 'brand', 'is_published'] as const;

const ADMIN_IMAGE_PRIMARY_KEY = 'image_id';
const ADMIN_IMAGE_ALLOWED_FIELDS = [
    'product_id',
    'image_url',
    'alt_text',
    'is_primary',
    'sort_order'
] as const;
const ADMIN_IMAGE_REQUIRED_CREATE_FIELDS = ['product_id', 'image_url'] as const;
const ADMIN_IMAGE_FILTER_FIELDS = ['product_id', 'is_primary'] as const;

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

/** GET /admin/products — hàng phẳng kể cả chưa xuất bản, dùng cho trang quản trị. */
export const listAdminProducts = async (req: Request, res: Response) => {
    const records = await ProductModel.adminFindAll({
        filters: collectFilters(req, ADMIN_PRODUCT_FILTER_FIELDS),
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        ascending: parseOrder(req.query.order)
    });

    res.json({ status: 'success', data: records });
};

export const getAdminProductById = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_PRODUCT_PRIMARY_KEY);
    const record = await ProductModel.adminFindById(id);
    if (!record) throw new AppError('products record not found', 404);

    res.json({ status: 'success', data: record });
};

export const createAdminProduct = async (req: Request, res: Response) => {
    const payload = pickAllowedFields(req.body, ADMIN_PRODUCT_ALLOWED_FIELDS);
    assertRequiredFields(payload, ADMIN_PRODUCT_REQUIRED_CREATE_FIELDS);

    const record = await ProductModel.create(payload as unknown as CreateProductDto);
    res.status(201).json({ status: 'success', data: record });
};

export const updateAdminProduct = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_PRODUCT_PRIMARY_KEY);
    const existing = await ProductModel.adminFindById(id);
    if (!existing) throw new AppError('products record not found', 404);

    const payload = pickAllowedFields(req.body, ADMIN_PRODUCT_ALLOWED_FIELDS);
    if (Object.keys(payload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    const record = await ProductModel.update(id, payload as unknown as UpdateProductDto);
    res.json({ status: 'success', data: record });
};

/** DELETE /admin/products/:id — xóa cứng thật sự, khác với deleteProduct() (chỉ ẩn is_published). */
export const deleteAdminProduct = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_PRODUCT_PRIMARY_KEY);
    const existing = await ProductModel.adminFindById(id);
    if (!existing) throw new AppError('products record not found', 404);

    await ProductModel.adminDelete(id);
    res.status(204).send();
};

/** GET /admin/product-images — CRUD chung cho trang quản trị. */
export const listAdminProductImages = async (req: Request, res: Response) => {
    const records = await ProductImageModel.adminFindAll({
        filters: collectFilters(req, ADMIN_IMAGE_FILTER_FIELDS),
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        ascending: parseOrder(req.query.order)
    });

    res.json({ status: 'success', data: records });
};

export const getAdminProductImageById = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_IMAGE_PRIMARY_KEY);
    const record = await ProductImageModel.findById(id);
    if (!record) throw new AppError('product_images record not found', 404);

    res.json({ status: 'success', data: record });
};

export const createAdminProductImage = async (req: Request, res: Response) => {
    const payload = pickAllowedFields(req.body, ADMIN_IMAGE_ALLOWED_FIELDS);
    assertRequiredFields(payload, ADMIN_IMAGE_REQUIRED_CREATE_FIELDS);

    const record = await ProductImageModel.adminCreate(payload);
    res.status(201).json({ status: 'success', data: record });
};

export const updateAdminProductImage = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_IMAGE_PRIMARY_KEY);
    const existing = await ProductImageModel.findById(id);
    if (!existing) throw new AppError('product_images record not found', 404);

    const payload = pickAllowedFields(req.body, ADMIN_IMAGE_ALLOWED_FIELDS);
    if (Object.keys(payload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    const record = await ProductImageModel.adminUpdate(id, payload);
    res.json({ status: 'success', data: record });
};

export const deleteAdminProductImage = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_IMAGE_PRIMARY_KEY);
    const existing = await ProductImageModel.findById(id);
    if (!existing) throw new AppError('product_images record not found', 404);

    await ProductImageModel.delete(id);
    res.status(204).send();
};
