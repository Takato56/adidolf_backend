import { supabase } from '../config/supabase.config.js';
import {
    isSupabaseNotFound,
    toDatabaseError
} from '../utils/supabase-error.utils.js';
import type { PaginationParams } from '../utils/pagination.utils.js';
import type {
    CreateReviewDto,
    Review,
    ReviewWithReviewer,
    UpdateReviewDto
} from '../types/review.types.js';
import type { AdminListOptions, AdminRecord } from '../utils/adminQuery.utils.js';

const ADMIN_DEFAULT_ORDER = 'created_at';
const ADMIN_SORTABLE_FIELDS = new Set([
    'review_id',
    'product_id',
    'user_id',
    'rating',
    'created_at',
    'order_item_id',
    'is_approved'
]);

const reviewWithReviewerSelect = `
    review_id, product_id, user_id, order_item_id, rating, comment,
    image_urls, is_approved, created_at,
    reviewer:users(full_name)
`;

type ReviewRow = Review & { reviewer: { full_name: string } | null };

const ReviewModel = {
    /** GET /admin/reviews — mọi đánh giá (kể cả chưa duyệt), lọc/sắp xếp/phân trang tùy ý. */
    async adminFindAll(options: AdminListOptions): Promise<AdminRecord[]> {
        let query: any = supabase.from('reviews').select('*');

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

    /** Ghi thẳng payload — không giới hạn trường như create() công khai. */
    async adminCreate(payload: AdminRecord): Promise<AdminRecord> {
        const { data, error } = await supabase
            .from('reviews')
            .insert(payload)
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord;
    },

    /** Ghi thẳng payload — không tự đặt lại is_approved=false như update() công khai. */
    async adminUpdate(id: number, payload: AdminRecord): Promise<AdminRecord> {
        const { data, error } = await supabase
            .from('reviews')
            .update(payload)
            .eq('review_id', id)
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as unknown as AdminRecord;
    },

    /** Công khai — chỉ đánh giá đã duyệt, kèm tên người đánh giá, có phân trang. */
    async findApprovedByProduct(
        productId: number,
        { limit, offset }: PaginationParams
    ): Promise<{ rows: ReviewWithReviewer[]; total: number }> {
        const { data, error, count } = await supabase
            .from('reviews')
            .select(reviewWithReviewerSelect, { count: 'exact' })
            .eq('product_id', productId)
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw toDatabaseError(error);

        const rows = ((data ?? []) as unknown as ReviewRow[]).map((row) => ({
            review_id: row.review_id,
            product_id: row.product_id,
            user_id: row.user_id,
            order_item_id: row.order_item_id,
            rating: row.rating,
            comment: row.comment,
            image_urls: row.image_urls,
            is_approved: row.is_approved,
            created_at: row.created_at,
            reviewer_name: row.reviewer?.full_name ?? 'Unknown'
        }));

        return { rows, total: count ?? 0 };
    },

    async findById(id: number): Promise<Review | null> {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('review_id', id)
            .maybeSingle();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        return data as Review | null;
    },

    async create(
        userId: number,
        productId: number,
        dto: CreateReviewDto
    ): Promise<Review> {
        const { data, error } = await supabase
            .from('reviews')
            .insert({
                product_id: productId,
                user_id: userId,
                order_item_id: dto.order_item_id ?? null,
                rating: dto.rating,
                comment: dto.comment ?? null
            })
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as Review;
    },

    /** Sửa đánh giá luôn đặt lại is_approved = false, chờ admin duyệt lại. */
    async update(id: number, dto: UpdateReviewDto): Promise<Review> {
        const { data, error } = await supabase
            .from('reviews')
            .update({ ...dto, is_approved: false })
            .eq('review_id', id)
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as Review;
    },

    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('review_id', id);

        if (error) throw toDatabaseError(error);
    },

    async setApproved(id: number, isApproved: boolean): Promise<Review> {
        const { data, error } = await supabase
            .from('reviews')
            .update({ is_approved: isApproved })
            .eq('review_id', id)
            .select('*')
            .single();

        if (error) throw toDatabaseError(error);
        return data as Review;
    },

    async existsForOrderItem(orderItemId: number): Promise<boolean> {
        const { count, error } = await supabase
            .from('reviews')
            .select('review_id', { count: 'exact', head: true })
            .eq('order_item_id', orderItemId);

        if (error) throw toDatabaseError(error);
        return (count ?? 0) > 0;
    },

    /**
     * Xác nhận order_item thuộc đúng người dùng, đúng sản phẩm, và nằm
     * trong một đơn đã ở trạng thái delivered.
     */
    async findDeliveredOrderItem(
        orderItemId: number,
        userId: number,
        productId: number
    ): Promise<{ item_id: number } | null> {
        const { data, error } = await supabase
            .from('order_items')
            .select('item_id, product_id, order:orders!inner(user_id, status)')
            .eq('item_id', orderItemId)
            .maybeSingle();

        if (isSupabaseNotFound(error)) return null;
        if (error) throw toDatabaseError(error);
        if (!data) return null;

        const row = data as unknown as {
            item_id: number;
            product_id: number;
            order: { user_id: number; status: string } | null;
        };

        if (
            row.product_id !== productId ||
            row.order?.user_id !== userId ||
            row.order?.status !== 'delivered'
        ) {
            return null;
        }

        return { item_id: row.item_id };
    },

    /**
     * Không có order_item_id cụ thể: chỉ cần tồn tại ít nhất một lượt mua
     * sản phẩm này đã được giao (delivered) bởi người dùng.
     */
    async hasDeliveredPurchase(
        userId: number,
        productId: number
    ): Promise<boolean> {
        const { count, error } = await supabase
            .from('order_items')
            .select('item_id, orders!inner(user_id, status)', {
                count: 'exact',
                head: true
            })
            .eq('product_id', productId)
            .eq('orders.user_id', userId)
            .eq('orders.status', 'delivered');

        if (error) throw toDatabaseError(error);
        return (count ?? 0) > 0;
    }
};

export default ReviewModel;
