import { type Request, type Response } from 'express';
import CategoryModel from '../models/category.model.js';
import { AppError } from '../middleware/error.middleware.js';
import {
    categoryIdSchema,
    createCategorySchema,
    generateSlug,
    updateCategorySchema
} from '../validators/category.validator.js';
import type { CreateCategoryDto, UpdateCategoryDto } from '../types/category.types.js';
import {
    parseNumericId,
    pickAllowedFields,
    assertRequiredFields,
    parseLimit,
    parseOffset,
    parseOrder,
    collectFilters
} from '../utils/adminQuery.utils.js';

const ADMIN_PRIMARY_KEY = 'category_id';
const ADMIN_ALLOWED_FIELDS = ['name', 'slug', 'description', 'image_url'] as const;
const ADMIN_REQUIRED_CREATE_FIELDS = ['name', 'slug'] as const;
const ADMIN_FILTER_FIELDS = ['slug', 'name'] as const;

/** GET /admin/categories — CRUD chung cho trang quản trị, không áp ràng buộc trùng tên/slug. */
export const listAdminCategories = async (req: Request, res: Response) => {
    const records = await CategoryModel.adminFindAll({
        filters: collectFilters(req, ADMIN_FILTER_FIELDS),
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        ascending: parseOrder(req.query.order)
    });

    res.json({ status: 'success', data: records });
};

export const getAdminCategoryById = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_PRIMARY_KEY);
    const record = await CategoryModel.findById(id);
    if (!record) throw new AppError('categories record not found', 404);

    res.json({ status: 'success', data: record });
};

export const createAdminCategory = async (req: Request, res: Response) => {
    const payload = pickAllowedFields(req.body, ADMIN_ALLOWED_FIELDS);
    assertRequiredFields(payload, ADMIN_REQUIRED_CREATE_FIELDS);

    const record = await CategoryModel.create(payload as unknown as CreateCategoryDto);
    res.status(201).json({ status: 'success', data: record });
};

export const updateAdminCategory = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_PRIMARY_KEY);
    const existing = await CategoryModel.findById(id);
    if (!existing) throw new AppError('categories record not found', 404);

    const payload = pickAllowedFields(req.body, ADMIN_ALLOWED_FIELDS);
    if (Object.keys(payload).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    const record = await CategoryModel.update(id, payload as unknown as UpdateCategoryDto);
    res.json({ status: 'success', data: record });
};

export const deleteAdminCategory = async (req: Request, res: Response) => {
    const id = parseNumericId(req.params.id, ADMIN_PRIMARY_KEY);
    const existing = await CategoryModel.findById(id);
    if (!existing) throw new AppError('categories record not found', 404);

    await CategoryModel.delete(id);
    res.status(204).send();
};

export const createCategory = async (req: Request, res: Response) => {
    const parsed = createCategorySchema.parse(req.body);
    const slug = parsed.slug ?? generateSlug(parsed.name);
    const existing = await CategoryModel.findByNameOrSlug(parsed.name, slug);

    if (existing) {
        throw new AppError(
            existing.name === parsed.name
                ? 'A category with this name already exists'
                : 'A category with this slug already exists',
            409
        );
    }

    const category = await CategoryModel.create({
        name: parsed.name,
        slug,
        description: parsed.description,
        image_url: parsed.image_url
    });

    res.status(201).json({ status: 'success', data: category });
};

export const getAllCategories = async (req: Request, res: Response) => {
    const sort = req.query.sort ? String(req.query.sort) : undefined;
    const categories = await CategoryModel.findAll(sort);

    res.json({ status: 'success', data: categories });
};

export const getCategoryById = async (req: Request, res: Response) => {
    const id = categoryIdSchema.parse(req.params.id);
    const category = await CategoryModel.findById(id);

    if (!category) throw new AppError('Category not found', 404);

    res.json({ status: 'success', data: category });
};

export const updateCategory = async (req: Request, res: Response) => {
    const id = categoryIdSchema.parse(req.params.id);
    const parsed = updateCategorySchema.parse(req.body);
    const existing = await CategoryModel.findById(id);

    if (!existing) throw new AppError('Category not found', 404);

    const slug =
        parsed.slug ?? (parsed.name ? generateSlug(parsed.name) : undefined);
    const duplicate = await CategoryModel.findByNameOrSlug(
        parsed.name,
        slug,
        id
    );

    if (duplicate) {
        throw new AppError(
            duplicate.name === parsed.name
                ? 'A category with this name already exists'
                : 'A category with this slug already exists',
            409
        );
    }

    const category = await CategoryModel.update(id, {
        ...parsed,
        slug
    });

    res.json({ status: 'success', data: category });
};

export const deleteCategory = async (req: Request, res: Response) => {
    const id = categoryIdSchema.parse(req.params.id);
    const existing = await CategoryModel.findById(id);

    if (!existing) throw new AppError('Category not found', 404);

    const hasProducts = await CategoryModel.hasProducts(id);
    if (hasProducts) {
        throw new AppError(
            'Cannot delete category: products are still assigned to it',
            400
        );
    }

    await CategoryModel.delete(id);

    res.json({ status: 'success', message: 'Category deleted successfully' });
};
