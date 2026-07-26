import { AppError } from '../middleware/error.middleware.js';

/**
 * Ánh xạ mã lỗi tự định nghĩa trong các hàm PostgreSQL sang mã HTTP.
 * Các mã này được khai báo trong database/migrations/002_create_order_function.sql.
 */
const PG_ERROR_MAP: Record<string, number> = {
    AD001: 400, // giỏ hàng rỗng
    AD002: 400, // địa chỉ không hợp lệ hoặc không thuộc về người dùng
    AD003: 409, // không đủ tồn kho
    AD004: 400, // voucher không hợp lệ
    AD005: 409, // sản phẩm không còn được bán
    AD006: 404, // đơn hàng không tồn tại hoặc không có quyền
    AD007: 409  // trạng thái đơn không cho phép thao tác
};

interface PostgresError {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
}

/**
 * Chuyển lỗi trả về từ supabase.rpc() thành AppError với mã HTTP phù hợp.
 * Thông điệp trong các hàm PostgreSQL đã viết bằng tiếng Việt hướng tới
 * người dùng cuối nên có thể trả thẳng ra client.
 */
export const toOrderError = (error: PostgresError | null): AppError => {
    if (!error) {
        return new AppError('Không thể xử lý đơn hàng', 500);
    }

    const status = error.code ? PG_ERROR_MAP[error.code] : undefined;

    if (status) {
        return new AppError(error.message ?? 'Yêu cầu không hợp lệ', status);
    }

    // Ràng buộc CHECK stock_quantity >= 0 là lớp bảo vệ cuối cùng ở tầng CSDL
    if (error.code === '23514' && error.message?.includes('stock_quantity')) {
        return new AppError('Sản phẩm vừa hết hàng, vui lòng thử lại', 409);
    }

    // Deadlock hoặc serialization failure: client có thể thử lại
    if (error.code === '40P01' || error.code === '40001') {
        return new AppError('Hệ thống đang bận, vui lòng thử lại', 503);
    }

    return new AppError('Không thể xử lý đơn hàng', 500);
};