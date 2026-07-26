import { supabase } from '../config/supabase.config';
import {
    type Category,
    type CreateCategoryDto,
    type UpdateCategoryDto
} from '../types/category.types.js';
import {
    isSupabaseNotFound,
    toDatabaseError
} from '../utils/supabase-error.utils.js';
import type { AdminListOptions, AdminRecord } from '../utils/adminQuery.utils.js';

const ADMIN_DEFAULT_ORDER = 'created_at';
const ADMIN_SORTABLE_FIELDS = new Set(['category_id', 'name', 'created_at', 'slug']);

const CategoryModel = {
    /** GET /admin/categories — lọc/sắp xếp/phân trang tùy ý, dùng cho trang quản trị. */
    async adminFindAll(options: AdminListOptions): Promise<AdminRecord[]> {
        let query: any = supabase.from('categories').select('*');

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

    async findAll(sort?: string): Promise<Category[]> {
        let query = supabase.from('categories').select('*');

        if (sort === 'name') {
            query = query.order('name', { ascending: true });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw toDatabaseError(error);
        return data;
    },

    async findById(id: number): Promise<Category | null> {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('category_id', id)
            .single();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data;
    },

    async findByNameOrSlug(
        name?: string,
        slug?: string,
        excludeId?: number
    ): Promise<Category | null> {
        let query = supabase.from('categories').select('*');

        // Build OR filter for name/slug uniqueness check
        const orFilters: string[] = [];
        if (name) orFilters.push(`name.eq.${name}`);
        if (slug) orFilters.push(`slug.eq.${slug}`);
        if (orFilters.length === 0) return null;

        query = query.or(orFilters.join(','));

        // Exclude current category when updating
        if (excludeId !== undefined) {
            query = query.neq('category_id', excludeId);
        }

        const { data, error } = await query.limit(1).single();
        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data;
    },

    async create(dto: CreateCategoryDto): Promise<Category> {
        const { data, error } = await supabase
            .from('categories')
            .insert(dto)
            .select()
            .single();

        if (error) throw toDatabaseError(error);
        return data;
    },

    async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
        const { data, error } = await supabase
            .from('categories')
            .update(dto)
            .eq('category_id', id)
            .select()
            .single();

        if (error) throw toDatabaseError(error);
        return data;
    },

    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('category_id', id);

        if (error) throw toDatabaseError(error);
    },

    async hasProducts(id: number): Promise<boolean> {
        const { count, error } = await supabase
            .from('products')
            .select('product_id', { count: 'exact', head: true })
            .eq('category_id', id);

        if (error) throw toDatabaseError(error);
        return (count ?? 0) > 0;
    }
};

export default CategoryModel;
