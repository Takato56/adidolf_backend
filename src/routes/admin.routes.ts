import { Router } from 'express';
import { getOverviewStats } from '../controllers/adminStats.controller.js';
import {
    approveReview,
    listAdminReviews,
    getAdminReviewById,
    createAdminReview,
    updateAdminReview,
    deleteAdminReview
} from '../controllers/review.controller.js';
import {
    listAdminUsers,
    getAdminUserById,
    createAdminUser,
    updateAdminUser,
    deleteAdminUser
} from '../controllers/user.controller.js';
import {
    listAdminAddresses,
    getAdminAddressById,
    createAdminAddress,
    updateAdminAddress,
    deleteAdminAddress
} from '../controllers/address.controller.js';
import {
    listAdminCategories,
    getAdminCategoryById,
    createAdminCategory,
    updateAdminCategory,
    deleteAdminCategory
} from '../controllers/category.controller.js';
import {
    listAdminProducts,
    getAdminProductById,
    createAdminProduct,
    updateAdminProduct,
    deleteAdminProduct,
    listAdminProductImages,
    getAdminProductImageById,
    createAdminProductImage,
    updateAdminProductImage,
    deleteAdminProductImage
} from '../controllers/product.controller.js';
import {
    listProductVariants,
    getProductVariantById,
    createProductVariant,
    updateProductVariant,
    deleteProductVariant
} from '../controllers/productVariant.controller.js';
import {
    listAdminVouchers,
    getAdminVoucherById,
    createAdminVoucher,
    updateAdminVoucher,
    deleteAdminVoucher
} from '../controllers/voucher.controller.js';
import {
    listAdminCarts,
    getAdminCartById,
    createAdminCart,
    updateAdminCart,
    deleteAdminCart,
    listAdminCartItems,
    getAdminCartItemById,
    createAdminCartItem,
    updateAdminCartItem,
    deleteAdminCartItem
} from '../controllers/cart.controller.js';
import {
    listAdminOrders,
    getAdminOrderById,
    createAdminOrder,
    updateAdminOrder,
    deleteAdminOrder,
    listAdminOrderItems,
    getAdminOrderItemById,
    createAdminOrderItem,
    updateAdminOrderItem,
    deleteAdminOrderItem
} from '../controllers/order.controller.js';
import {
    listPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment
} from '../controllers/payment.controller.js';
import {
    listShipments,
    getShipmentById,
    createShipment,
    updateShipment,
    deleteShipment
} from '../controllers/shipment.controller.js';
import {
    listVoucherRedemptions,
    getVoucherRedemptionById,
    createVoucherRedemption,
    updateVoucherRedemption,
    deleteVoucherRedemption
} from '../controllers/voucherRedemption.controller.js';

const router = Router();

/** Danh sách tài nguyên admin quản lý — chỉ dùng để hiển thị, không dùng để tạo route. */
const ADMIN_RESOURCES = [
    { name: 'users', path: '/admin/users', table: 'users', primaryKey: 'user_id' },
    {
        name: 'addresses',
        path: '/admin/addresses',
        table: 'addresses',
        primaryKey: 'address_id'
    },
    {
        name: 'categories',
        path: '/admin/categories',
        table: 'categories',
        primaryKey: 'category_id'
    },
    {
        name: 'products',
        path: '/admin/products',
        table: 'products',
        primaryKey: 'product_id'
    },
    {
        name: 'product_variants',
        path: '/admin/product-variants',
        table: 'product_variants',
        primaryKey: 'variant_id'
    },
    {
        name: 'product_images',
        path: '/admin/product-images',
        table: 'product_images',
        primaryKey: 'image_id'
    },
    {
        name: 'vouchers',
        path: '/admin/vouchers',
        table: 'vouchers',
        primaryKey: 'voucher_id'
    },
    { name: 'carts', path: '/admin/carts', table: 'carts', primaryKey: 'cart_id' },
    {
        name: 'cart_items',
        path: '/admin/cart-items',
        table: 'cart_items',
        primaryKey: 'cart_item_id'
    },
    { name: 'orders', path: '/admin/orders', table: 'orders', primaryKey: 'order_id' },
    {
        name: 'order_items',
        path: '/admin/order-items',
        table: 'order_items',
        primaryKey: 'item_id'
    },
    {
        name: 'payments',
        path: '/admin/payments',
        table: 'payments',
        primaryKey: 'payment_id'
    },
    {
        name: 'shipments',
        path: '/admin/shipments',
        table: 'shipments',
        primaryKey: 'shipment_id'
    },
    {
        name: 'reviews',
        path: '/admin/reviews',
        table: 'reviews',
        primaryKey: 'review_id'
    },
    {
        name: 'voucher_redemptions',
        path: '/admin/voucher-redemptions',
        table: 'voucher_redemptions',
        primaryKey: 'redemption_id'
    }
];

router.get('/', (_req, res) => {
    res.json({ status: 'success', data: ADMIN_RESOURCES });
});

router.get('/stats/overview', getOverviewStats);
router.patch('/reviews/:id/approve', approveReview);

router.route('/users').get(listAdminUsers).post(createAdminUser);
router
    .route('/users/:id')
    .get(getAdminUserById)
    .put(updateAdminUser)
    .patch(updateAdminUser)
    .delete(deleteAdminUser);

router.route('/addresses').get(listAdminAddresses).post(createAdminAddress);
router
    .route('/addresses/:id')
    .get(getAdminAddressById)
    .put(updateAdminAddress)
    .patch(updateAdminAddress)
    .delete(deleteAdminAddress);

router.route('/categories').get(listAdminCategories).post(createAdminCategory);
router
    .route('/categories/:id')
    .get(getAdminCategoryById)
    .put(updateAdminCategory)
    .patch(updateAdminCategory)
    .delete(deleteAdminCategory);

router.route('/products').get(listAdminProducts).post(createAdminProduct);
router
    .route('/products/:id')
    .get(getAdminProductById)
    .put(updateAdminProduct)
    .patch(updateAdminProduct)
    .delete(deleteAdminProduct);

router.route('/product-variants').get(listProductVariants).post(createProductVariant);
router
    .route('/product-variants/:id')
    .get(getProductVariantById)
    .put(updateProductVariant)
    .patch(updateProductVariant)
    .delete(deleteProductVariant);

router.route('/product-images').get(listAdminProductImages).post(createAdminProductImage);
router
    .route('/product-images/:id')
    .get(getAdminProductImageById)
    .put(updateAdminProductImage)
    .patch(updateAdminProductImage)
    .delete(deleteAdminProductImage);

router.route('/vouchers').get(listAdminVouchers).post(createAdminVoucher);
router
    .route('/vouchers/:id')
    .get(getAdminVoucherById)
    .put(updateAdminVoucher)
    .patch(updateAdminVoucher)
    .delete(deleteAdminVoucher);

router.route('/carts').get(listAdminCarts).post(createAdminCart);
router
    .route('/carts/:id')
    .get(getAdminCartById)
    .put(updateAdminCart)
    .patch(updateAdminCart)
    .delete(deleteAdminCart);

router.route('/cart-items').get(listAdminCartItems).post(createAdminCartItem);
router
    .route('/cart-items/:id')
    .get(getAdminCartItemById)
    .put(updateAdminCartItem)
    .patch(updateAdminCartItem)
    .delete(deleteAdminCartItem);

router.route('/orders').get(listAdminOrders).post(createAdminOrder);
router
    .route('/orders/:id')
    .get(getAdminOrderById)
    .put(updateAdminOrder)
    .patch(updateAdminOrder)
    .delete(deleteAdminOrder);

router.route('/order-items').get(listAdminOrderItems).post(createAdminOrderItem);
router
    .route('/order-items/:id')
    .get(getAdminOrderItemById)
    .put(updateAdminOrderItem)
    .patch(updateAdminOrderItem)
    .delete(deleteAdminOrderItem);

router.route('/payments').get(listPayments).post(createPayment);
router
    .route('/payments/:id')
    .get(getPaymentById)
    .put(updatePayment)
    .patch(updatePayment)
    .delete(deletePayment);

router.route('/shipments').get(listShipments).post(createShipment);
router
    .route('/shipments/:id')
    .get(getShipmentById)
    .put(updateShipment)
    .patch(updateShipment)
    .delete(deleteShipment);

router.route('/reviews').get(listAdminReviews).post(createAdminReview);
router
    .route('/reviews/:id')
    .get(getAdminReviewById)
    .put(updateAdminReview)
    .patch(updateAdminReview)
    .delete(deleteAdminReview);

router
    .route('/voucher-redemptions')
    .get(listVoucherRedemptions)
    .post(createVoucherRedemption);
router
    .route('/voucher-redemptions/:id')
    .get(getVoucherRedemptionById)
    .put(updateVoucherRedemption)
    .patch(updateVoucherRedemption)
    .delete(deleteVoucherRedemption);

export default router;
