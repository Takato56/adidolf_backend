import { type Request, type Response } from 'express';
import ProductModel, {
    CreateProductDto,
    UpdateProductDto,
    ProductFilters
} from '../models/product.model';
import { AppError } from '../middleware/error.middleware.js';

export const getAllProducts = async (req: Request, res: Response) => {
    const filters: ProductFilters = {
        category_id: req.query.category_id
            ? Number(req.query.category_id)
            : undefined,
        brand: req.query.brand ? String(req.query.brand) : undefined,
        min_price: req.query.min_price
            ? Number(req.query.min_price)
            : undefined,
        max_price: req.query.max_price
            ? Number(req.query.max_price)
            : undefined,
        search: req.query.search ? String(req.query.search) : undefined
    };

    const products = await ProductModel.findAll(filters);
    res.json({ status: 'success', data: products });
};

export const getProductById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError('Invalid product id', 400);

    const product = await ProductModel.findById(id);
    if (!product) throw new AppError('Product not found', 404);

    res.json({ status: 'success', data: product });
};

export const getProductBySlug = async (req: Request, res: Response) => {
    const product = await ProductModel.findBySlug(req.params.slug as string);
    if (!product) throw new AppError('Product not found', 404);

    res.json({ status: 'success', data: product });
};

export const createProduct = async (req: Request, res: Response) => {
    const dto: CreateProductDto = {
        category_id: req.body.category_id,
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description,
        base_price: req.body.base_price,
        brand: req.body.brand
    };

    const product = await ProductModel.create(dto);
    res.status(201).json({ status: 'success', data: product });
};

export const updateProduct = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError('Invalid product id', 400);

    const existing = await ProductModel.findById(id);
    if (!existing) throw new AppError('Product not found', 404);

    const dto: UpdateProductDto = {
        category_id: req.body.category_id,
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description,
        base_price: req.body.base_price,
        brand: req.body.brand,
        is_published: req.body.is_published
    };

    const product = await ProductModel.update(id, dto);
    res.json({ status: 'success', data: product });
};

export const deleteProduct = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError('Invalid product id', 400);

    const existing = await ProductModel.findById(id);
    if (!existing) throw new AppError('Product not found', 404);

    await ProductModel.delete(id);
    res.status(204).send();
};
