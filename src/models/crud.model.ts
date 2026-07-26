import { supabase } from '../config/supabase.config';
import {
    type CrudListOptions,
    type CrudRecord,
    type CrudResourceConfig
} from '../types/crud.types.js';
import {
    isSupabaseNotFound,
    toDatabaseError
} from '../utils/supabase-error.utils.js';

const getSortFields = (config: CrudResourceConfig): Set<string> =>
    new Set([
        config.primaryKey,
        ...(config.sortFields ?? []),
        ...(config.filterFields ?? []),
        ...(config.defaultOrder ? [config.defaultOrder] : [])
    ]);

export const createCrudModel = (config: CrudResourceConfig) => {
    const select = config.select ?? '*';

    return {
        async findAll(options: CrudListOptions): Promise<CrudRecord[]> {
            let query: any = supabase.from(config.table).select(select);

            Object.entries(options.filters).forEach(([column, value]) => {
                query = query.eq(column, value);
            });

            const sortFields = getSortFields(config);
            const sortColumn =
                options.sort && sortFields.has(options.sort)
                    ? options.sort
                    : config.defaultOrder;

            if (sortColumn) {
                query = query.order(sortColumn, {
                    ascending:
                        options.ascending ??
                        config.defaultOrderAscending ??
                        false
                });
            }

            if (options.limit !== undefined) {
                const offset = options.offset ?? 0;
                query = query.range(offset, offset + options.limit - 1);
            }

            const { data, error } = await query;
            if (error) throw toDatabaseError(error);
            return (data ?? []) as CrudRecord[];
        },

        async findById(id: string | number): Promise<CrudRecord | null> {
            const { data, error } = await supabase
                .from(config.table)
                .select(select)
                .eq(config.primaryKey, id)
                .single();

            if (isSupabaseNotFound(error)) return null;
            if (error) throw toDatabaseError(error);
            return data as unknown as CrudRecord;
        },

        async create(payload: CrudRecord): Promise<CrudRecord> {
            const { data, error } = await supabase
                .from(config.table)
                .insert(payload)
                .select(select)
                .single();

            if (error) throw toDatabaseError(error);
            return data as unknown as CrudRecord;
        },

        async update(
            id: string | number,
            payload: CrudRecord
        ): Promise<CrudRecord> {
            const { data, error } = await supabase
                .from(config.table)
                .update(payload)
                .eq(config.primaryKey, id)
                .select(select)
                .single();

            if (error) throw toDatabaseError(error);
            return data as unknown as CrudRecord;
        },

        async delete(id: string | number): Promise<void> {
            const { error } = await supabase
                .from(config.table)
                .delete()
                .eq(config.primaryKey, id);

            if (error) throw toDatabaseError(error);
        }
    };
};
