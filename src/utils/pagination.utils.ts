const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export interface PaginationParams {
    limit: number;
    offset: number;
}

export interface PaginationMeta extends PaginationParams {
    total: number;
}

export interface PaginatedResponse<T> {
    status: 'success';
    data: T;
    meta: PaginationMeta;
}

interface RawPaginationQuery {
    limit?: unknown;
    offset?: unknown;
    page?: unknown;
}

const toNonNegativeInt = (raw: unknown): number | undefined => {
    if (raw === undefined) return undefined;
    const value = Number(raw);
    return Number.isInteger(value) && value >= 0 ? value : undefined;
};

/**
 * Chuẩn hóa limit/offset/page từ query string.
 * - limit: số nguyên 1..100, mặc định 20; giá trị không hợp lệ dùng mặc định.
 * - offset: ưu tiên `offset` nếu có; nếu không thì suy ra từ `page` (1-based);
 *   mặc định 0.
 */
export const parsePagination = (
    query: RawPaginationQuery
): PaginationParams => {
    const rawLimit = toNonNegativeInt(query.limit);
    const limit =
        rawLimit === undefined || rawLimit < 1
            ? DEFAULT_LIMIT
            : Math.min(rawLimit, MAX_LIMIT);

    const rawOffset = toNonNegativeInt(query.offset);
    if (rawOffset !== undefined) return { limit, offset: rawOffset };

    const rawPage = toNonNegativeInt(query.page);
    if (rawPage !== undefined && rawPage >= 1) {
        return { limit, offset: (rawPage - 1) * limit };
    }

    return { limit, offset: 0 };
};

export const buildPaginationMeta = (
    total: number,
    { limit, offset }: PaginationParams
): PaginationMeta => ({ total, limit, offset });

/**
 * Bọc dữ liệu danh sách theo dạng phản hồi chuẩn:
 * { status: 'success', data, meta: { total, limit, offset } }.
 * Dùng cùng với truy vấn Supabase có `{ count: 'exact' }` trong `.select()`.
 */
export const buildPaginatedResponse = <T>(
    data: T,
    total: number,
    params: PaginationParams
): PaginatedResponse<T> => ({
    status: 'success',
    data,
    meta: buildPaginationMeta(total, params)
});
