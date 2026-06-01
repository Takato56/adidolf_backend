import { supabase } from '../config/database.config';

export interface Product {
    product_id: number;
    category_id: number;
    name: string;
    slug: string;
    description: string;
    base_price: number;
    brand: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateProductDto {
    category_id: number;
    name: string;
    slug: string;
    description: string;
    base_price: number;
    brand: string;
}

export interface UpdateProductDto {
    category_id?: number;
    name?: string;
    slug?: string;
    description?: string;
    base_price?: number;
    brand?: string;
    is_published?: boolean;
}

export interface ProductFilters {
    category_id?: number;
    brand?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
}

const ProductModel = {

    async findAll(filters?: ProductFilters): Promise<Product[]> {
        let query = supabase
            .from('products')
            .select('*')
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
        if (error) throw new Error(error.message);
        return data;
    },

    async findById(id: number): Promise<Product | null> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('product_id', id)
            .eq('is_published', true)
            .single();

        if (error) return null;
        return data;
    },

    async findBySlug(slug: string): Promise<Product | null> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .single();

        if (error) return null;
        return data;
    },

    async create(dto: CreateProductDto): Promise<Product> {
        const { data, error } = await supabase
            .from('products')
            .insert({ ...dto, is_published: false })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async update(id: number, dto: UpdateProductDto): Promise<Product> {
        const { data, error } = await supabase
            .from('products')
            .update({ ...dto, updated_at: new Date().toISOString() })
            .eq('product_id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('products')
            .update({ is_published: false, updated_at: new Date().toISOString() })
            .eq('product_id', id);

        if (error) throw new Error(error.message);
    },

};

export default ProductModel;