import { supabase } from '../config/supabase.config.js';
import {
    isSupabaseNotFound,
    toDatabaseError
} from '../utils/supabase-error.utils.js';
import type { AdminListOptions, AdminRecord } from '../utils/adminQuery.utils.js';

const TABLE = 'shipments';
const PRIMARY_KEY = 'shipment_id';
const SELECT = '*';
const DEFAULT_ORDER: string | undefined = undefined;
const DEFAULT_ORDER_ASCENDING = false;
const SORTABLE_FIELDS = new Set([
    'shipment_id',
    'order_id',
    'shipped_at',
    'estimated_delivery',
    'delivered_at',
    'carrier',
    'tracking_number',
    'status'
]);

const ShipmentModel = {
    async findAll(options: AdminListOptions): Promise<AdminRecord[]> {
        let query: any = supabase.from(TABLE).select(SELECT);

        Object.entries(options.filters).forEach(([column, value]) => {
            query = query.eq(column, value);
        });

        const sortColumn =
            options.sort && SORTABLE_FIELDS.has(options.sort)
                ? options.sort
                : DEFAULT_ORDER;

        if (sortColumn) {
            query = query.order(sortColumn, {
                ascending: options.ascending ?? DEFAULT_ORDER_ASCENDING
            });
        }

        if (options.limit !== undefined) {
            const offset = options.offset ?? 0;
            query = query.range(offset, offset + options.limit - 1);
        }

        const { data, error } = await query;
        if (error) throw toDatabaseError(error);
        return (data ?? []) as AdminRecord[];
    },

    async findById(id: number): Promise<AdminRecord | null> {
        const { data, error } = await supabase
            .from(TABLE)
            .select(SELECT)
            .eq(PRIMARY_KEY, id)
            .single();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord;
    },

    async create(payload: AdminRecord): Promise<AdminRecord> {
        const { data, error } = await supabase
            .from(TABLE)
            .insert(payload)
            .select(SELECT)
            .single();

        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord;
    },

    async update(id: number, payload: AdminRecord): Promise<AdminRecord> {
        const { data, error } = await supabase
            .from(TABLE)
            .update(payload)
            .eq(PRIMARY_KEY, id)
            .select(SELECT)
            .single();

        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord;
    },

    async delete(id: number): Promise<void> {
        const { error } = await supabase.from(TABLE).delete().eq(PRIMARY_KEY, id);
        if (error) throw toDatabaseError(error);
    }
};

export default ShipmentModel;
