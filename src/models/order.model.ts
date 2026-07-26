import { supabase } from '../config/supabase.config.js';
import { toOrderError } from '../utils/order-error.utils.js';
import { toDatabaseError } from '../utils/supabase-error.utils.js';
import type { CreateOrderDto, ListOrdersQuery } from '../types/order.types.js';
import type { AdminListOptions, AdminRecord } from '../utils/adminQuery.utils.js';

const ADMIN_ORDER_DEFAULT_ORDER = 'created_at';
const ADMIN_ORDER_SORTABLE_FIELDS = new Set([
    'order_id',
    'user_id',
    'status',
    'created_at',
    'updated_at',
    'address_id',
    'voucher_id'
]);

const ADMIN_ORDER_ITEM_SORTABLE_FIELDS = new Set([
    'item_id',
    'order_id',
    'product_id',
    'variant_id'
]);

const OrderModel = {
    /** GET /admin/orders — mọi đơn hàng, lọc/sắp xếp/phân trang tùy ý. */
    async adminFindAllOrders(options: AdminListOptions): Promise<AdminRecord[]> {
        let query: any = supabase.from('orders').select('*');

        Object.entries(options.filters).forEach(([column, value]) => {
            query = query.eq(column, value);
        });

        const sortColumn =
            options.sort && ADMIN_ORDER_SORTABLE_FIELDS.has(options.sort)
                ? options.sort
                : ADMIN_ORDER_DEFAULT_ORDER;

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

    async adminFindByIdOrder(orderId: number): Promise<AdminRecord | null> {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('order_id', orderId)
            .maybeSingle();

        if (error) throw toDatabaseError(error);
        return data as AdminRecord | null;
    },

    async adminCreateOrder(payload: AdminRecord): Promise<AdminRecord> {
        const { data, error } = await supabase
            .from('orders')
            .insert(payload)
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord;
    },

    async adminUpdateOrder(orderId: number, payload: AdminRecord): Promise<AdminRecord> {
        const { data, error } = await supabase
            .from('orders')
            .update(payload)
            .eq('order_id', orderId)
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord;
    },

    async adminDeleteOrder(orderId: number): Promise<void> {
        const { error } = await supabase.from('orders').delete().eq('order_id', orderId);
        if (error) throw toDatabaseError(error);
    },

    /** GET /admin/order-items — mọi dòng hàng trong mọi đơn, lọc/sắp xếp/phân trang tùy ý. */
    async adminFindAllOrderItems(options: AdminListOptions): Promise<AdminRecord[]> {
        let query: any = supabase.from('order_items').select('*');

        Object.entries(options.filters).forEach(([column, value]) => {
            query = query.eq(column, value);
        });

        const sortColumn =
            options.sort && ADMIN_ORDER_ITEM_SORTABLE_FIELDS.has(options.sort)
                ? options.sort
                : undefined;

        if (sortColumn) {
            query = query.order(sortColumn, {
                ascending: options.ascending ?? false
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

    async adminFindByIdOrderItem(itemId: number): Promise<AdminRecord | null> {
        const { data, error } = await supabase
            .from('order_items')
            .select('*')
            .eq('item_id', itemId)
            .maybeSingle();

        if (error) throw toDatabaseError(error);
        return data as AdminRecord | null;
    },

    async adminCreateOrderItem(payload: AdminRecord): Promise<AdminRecord> {
        const { data, error } = await supabase
            .from('order_items')
            .insert(payload)
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord;
    },

    async adminUpdateOrderItem(
        itemId: number,
        payload: AdminRecord
    ): Promise<AdminRecord> {
        const { data, error } = await supabase
            .from('order_items')
            .update(payload)
            .eq('item_id', itemId)
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord;
    },

    async adminDeleteOrderItem(itemId: number): Promise<void> {
        const { error } = await supabase
            .from('order_items')
            .delete()
            .eq('item_id', itemId);

        if (error) throw toDatabaseError(error);
    },

    /**
     * Tạo đơn hàng từ giỏ của người dùng.
     * Toàn bộ nghiệp vụ nằm trong hàm PostgreSQL create_order_from_cart nên
     * chạy trong một giao dịch duy nhất: chỉ cần một bước thất bại là mọi
     * thay đổi được hoàn tác.
     *
     * Lưu ý: hàm KHÔNG nhận bất kỳ giá trị tiền nào từ client — subtotal,
     * giảm giá, phí vận chuyển và tổng tiền đều do CSDL tự tính.
     */
    async createFromCart(userId: number, dto: CreateOrderDto): Promise<number> {
        const { data, error } = await supabase.rpc('create_order_from_cart', {
            p_user_id: userId,
            p_address_id: dto.address_id,
            p_payment_method: dto.payment_method,
            p_voucher_code: dto.voucher_code ?? null,
            p_note: dto.note ?? null
        });

        if (error) throw toOrderError(error);
        return data as number;
    },

    /**
     * Danh sách đơn của chính người dùng, có phân trang và lọc theo trạng thái.
     */
    async findMine(userId: number, query: ListOrdersQuery) {
        const { limit, offset, status } = query;

        let request = supabase
            .from('orders')
            .select(
                `order_id, status, subtotal, discount_amount, shipping_fee,
                 total_price, created_at, updated_at,
                 payment:payments(method, status, amount),
                 shipment:shipments(carrier, tracking_number, status),
                 items:order_items(item_id, product_name, variant_info,
                                   unit_price, quantity, subtotal)`,
                { count: 'exact' }
            )
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) request = request.eq('status', status);

        const { data, error, count } = await request;
        if (error) throw toDatabaseError(error);

        return { rows: data ?? [], total: count ?? 0 };
    },

    /**
     * Chi tiết một đơn. Quyền sở hữu được kiểm tra ngay trong hàm PostgreSQL,
     * nên không thể xem đơn của người khác kể cả khi đoán đúng order_id.
     */
    async findByIdForUser(orderId: number, userId: number, isAdmin: boolean) {
        const { data, error } = await supabase.rpc('get_order_detail', {
            p_order_id: orderId,
            p_user_id: userId,
            p_is_admin: isAdmin
        });

        if (error) throw toOrderError(error);
        return data;
    },

    /**
     * Hủy đơn: hoàn lại tồn kho, cập nhật thanh toán, nhả lượt voucher.
     * Cũng chạy trọn vẹn trong một giao dịch.
     */
    async cancel(orderId: number, userId: number, isAdmin: boolean): Promise<number> {
        const { data, error } = await supabase.rpc('cancel_order', {
            p_order_id: orderId,
            p_user_id: userId,
            p_is_admin: isAdmin
        });

        if (error) throw toOrderError(error);
        return data as number;
    }
};

export default OrderModel;