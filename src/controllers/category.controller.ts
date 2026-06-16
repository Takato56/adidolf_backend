import { type Request, type Response } from 'express';
import CategoryModel from '../models/category.model.js';
import {
    createCategorySchema,
    updateCategorySchema,
    categoryIdSchema,
    generateSlug
} from '../validators/category.validator.js';
import { AppError } from '../middleware/error.middleware.js';

// ─── POST /categories ─────────────────────────────────────
export const createCategory = async (req: Request, res: Response) => {
    const parsed = createCategorySchema.parse(req.body);

    // Auto-generate slug from name if not provided
    const slug = parsed.slug ?? generateSlug(parsed.name);

    // Check uniqueness
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

// ─── GET /categories ──────────────────────────────────────
export const getAllCategories = async (req: Request, res: Response) => {
    const sort = req.query.sort ? String(req.query.sort) : undefined;
    const categories = await CategoryModel.findAll(sort);

    res.json({ status: 'success', data: categories });
};

// ─── GET /categories/:id ──────────────────────────────────
export const getCategoryById = async (req: Request, res: Response) => {
    const id = categoryIdSchema.parse(req.params.id);

    const category = await CategoryModel.findById(id);
    if (!category) throw new AppError('Category not found', 404);

    res.json({ status: 'success', data: category });
};

// ─── PUT /categories/:id ──────────────────────────────────
export const updateCategory = async (req: Request, res: Response) => {
    const id = categoryIdSchema.parse(req.params.id);
    const parsed = updateCategorySchema.parse(req.body);

    // Ensure category exists
    const existing = await CategoryModel.findById(id);
    if (!existing) throw new AppError('Category not found', 404);

    // If name changed but no new slug provided, auto-generate from new name
    const slug =
        parsed.slug ?? (parsed.name ? generateSlug(parsed.name) : undefined);

    // Check uniqueness (exclude self)
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

// ─── DELETE /categories/:id ───────────────────────────────
export const deleteCategory = async (req: Request, res: Response) => {
    const id = categoryIdSchema.parse(req.params.id);

    const existing = await CategoryModel.findById(id);
    if (!existing) throw new AppError('Category not found', 404);

    // Block deletion if products are attached
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
