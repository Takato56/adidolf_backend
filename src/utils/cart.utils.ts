export interface CartProductImage {
    image_url: string;
    is_primary: boolean;
    sort_order: number;
}

/** Đơn giá luôn tính từ dữ liệu CSDL: giá gốc sản phẩm + phụ phí biến thể. */
export const calculateUnitPrice = (
    basePrice: number,
    extraPrice: number
): number => Number(basePrice) + Number(extraPrice);

export const calculateLineSubtotal = (
    unitPrice: number,
    quantity: number
): number => unitPrice * quantity;

/** Ảnh đại diện: ưu tiên ảnh is_primary, sau đó theo sort_order tăng dần. */
export const pickPrimaryImage = (
    images: CartProductImage[] = []
): string | null => {
    if (images.length === 0) return null;

    const [first] = [...images].sort((left, right) => {
        if (left.is_primary !== right.is_primary)
            return left.is_primary ? -1 : 1;
        return left.sort_order - right.sort_order;
    });

    return first.image_url;
};
