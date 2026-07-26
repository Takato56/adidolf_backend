import { type CrudResourceConfig } from '../types/crud.types.js';

const timestamps = ['created_at', 'updated_at'];

export const CRUD_RESOURCES: CrudResourceConfig[] = [
    {
        name: 'users',
        table: 'users',
        routePath: '/users',
        primaryKey: 'user_id',
        primaryKeyType: 'number',
        defaultOrder: 'created_at',
        allowedCreateFields: [
            'email',
            'password_hash',
            'full_name',
            'phone',
            'avatar_url',
            'role',
            'is_active'
        ],
        allowedUpdateFields: [
            'email',
            'password_hash',
            'full_name',
            'phone',
            'avatar_url',
            'role',
            'is_active'
        ],
        requiredCreateFields: ['email', 'password_hash', 'full_name'],
        filterFields: ['email', 'role', 'is_active'],
        sortFields: ['user_id', 'email', 'full_name', ...timestamps],
        updatedAtColumn: 'updated_at'
    },
    {
        name: 'addresses',
        table: 'addresses',
        routePath: '/addresses',
        primaryKey: 'address_id',
        primaryKeyType: 'number',
        defaultOrder: 'created_at',
        allowedCreateFields: [
            'user_id',
            'recipient_name',
            'phone',
            'is_default',
            'address_details'
        ],
        allowedUpdateFields: [
            'user_id',
            'recipient_name',
            'phone',
            'is_default',
            'address_details'
        ],
        requiredCreateFields: [
            'user_id',
            'recipient_name',
            'phone',
            'address_details'
        ],
        filterFields: ['user_id', 'is_default'],
        sortFields: ['address_id', 'user_id', 'recipient_name', 'created_at']
    },
    {
        name: 'categories',
        table: 'categories',
        routePath: '/categories',
        primaryKey: 'category_id',
        primaryKeyType: 'number',
        defaultOrder: 'created_at',
        allowedCreateFields: ['name', 'slug', 'description', 'image_url'],
        allowedUpdateFields: ['name', 'slug', 'description', 'image_url'],
        requiredCreateFields: ['name', 'slug'],
        filterFields: ['slug', 'name'],
        sortFields: ['category_id', 'name', 'created_at']
    },
    {
        name: 'products',
        table: 'products',
        routePath: '/products',
        primaryKey: 'product_id',
        primaryKeyType: 'number',
        defaultOrder: 'created_at',
        allowedCreateFields: [
            'category_id',
            'name',
            'slug',
            'description',
            'base_price',
            'brand',
            'is_published'
        ],
        allowedUpdateFields: [
            'category_id',
            'name',
            'slug',
            'description',
            'base_price',
            'brand',
            'is_published'
        ],
        requiredCreateFields: ['category_id', 'name', 'slug', 'base_price'],
        filterFields: ['category_id', 'slug', 'brand', 'is_published'],
        sortFields: [
            'product_id',
            'category_id',
            'name',
            'base_price',
            ...timestamps
        ],
        updatedAtColumn: 'updated_at'
    },
    {
        name: 'product_variants',
        table: 'product_variants',
        routePath: '/product-variants',
        primaryKey: 'variant_id',
        primaryKeyType: 'number',
        defaultOrder: 'created_at',
        allowedCreateFields: [
            'product_id',
            'sku',
            'color',
            'size',
            'extra_price',
            'stock_quantity',
            'image_url'
        ],
        allowedUpdateFields: [
            'product_id',
            'sku',
            'color',
            'size',
            'extra_price',
            'stock_quantity',
            'image_url'
        ],
        requiredCreateFields: ['product_id', 'sku'],
        filterFields: ['product_id', 'sku', 'color', 'size'],
        sortFields: [
            'variant_id',
            'product_id',
            'sku',
            'stock_quantity',
            'created_at'
        ]
    },
    {
        name: 'product_images',
        table: 'product_images',
        routePath: '/product-images',
        primaryKey: 'image_id',
        primaryKeyType: 'number',
        defaultOrder: 'sort_order',
        defaultOrderAscending: true,
        allowedCreateFields: [
            'product_id',
            'image_url',
            'alt_text',
            'is_primary',
            'sort_order'
        ],
        allowedUpdateFields: [
            'product_id',
            'image_url',
            'alt_text',
            'is_primary',
            'sort_order'
        ],
        requiredCreateFields: ['product_id', 'image_url'],
        filterFields: ['product_id', 'is_primary'],
        sortFields: ['image_id', 'product_id', 'sort_order']
    },
    {
        name: 'vouchers',
        table: 'vouchers',
        routePath: '/vouchers',
        primaryKey: 'voucher_id',
        primaryKeyType: 'number',
        defaultOrder: 'valid_from',
        allowedCreateFields: [
            'code',
            'discount_type',
            'discount_value',
            'max_discount',
            'min_order_amount',
            'usage_limit',
            'used_count',
            'valid_from',
            'valid_to',
            'is_active',
            'target_user_id'
        ],
        allowedUpdateFields: [
            'code',
            'discount_type',
            'discount_value',
            'max_discount',
            'min_order_amount',
            'usage_limit',
            'used_count',
            'valid_from',
            'valid_to',
            'is_active',
            'target_user_id'
        ],
        requiredCreateFields: [
            'code',
            'discount_type',
            'discount_value',
            'valid_from',
            'valid_to'
        ],
        filterFields: ['code', 'discount_type', 'is_active', 'target_user_id'],
        sortFields: ['voucher_id', 'code', 'valid_from', 'valid_to']
    },
    {
        name: 'carts',
        table: 'carts',
        routePath: '/carts',
        primaryKey: 'cart_id',
        primaryKeyType: 'number',
        defaultOrder: 'created_at',
        allowedCreateFields: ['user_id', 'session_token'],
        allowedUpdateFields: ['user_id', 'session_token'],
        filterFields: ['user_id', 'session_token'],
        sortFields: ['cart_id', 'user_id', ...timestamps],
        updatedAtColumn: 'updated_at'
    },
    {
        name: 'cart_items',
        table: 'cart_items',
        routePath: '/cart-items',
        primaryKey: 'cart_item_id',
        primaryKeyType: 'number',
        defaultOrder: 'added_at',
        allowedCreateFields: [
            'cart_id',
            'product_id',
            'variant_id',
            'quantity'
        ],
        allowedUpdateFields: [
            'cart_id',
            'product_id',
            'variant_id',
            'quantity'
        ],
        requiredCreateFields: ['cart_id', 'product_id'],
        filterFields: ['cart_id', 'product_id', 'variant_id'],
        sortFields: ['cart_item_id', 'cart_id', 'added_at']
    },
    {
        name: 'orders',
        table: 'orders',
        routePath: '/orders',
        primaryKey: 'order_id',
        primaryKeyType: 'number',
        defaultOrder: 'created_at',
        allowedCreateFields: [
            'user_id',
            'address_id',
            'voucher_id',
            'status',
            'subtotal',
            'discount_amount',
            'shipping_fee',
            'total_price',
            'note'
        ],
        allowedUpdateFields: [
            'user_id',
            'address_id',
            'voucher_id',
            'status',
            'subtotal',
            'discount_amount',
            'shipping_fee',
            'total_price',
            'note'
        ],
        requiredCreateFields: [
            'user_id',
            'address_id',
            'subtotal',
            'total_price'
        ],
        filterFields: ['user_id', 'address_id', 'voucher_id', 'status'],
        sortFields: ['order_id', 'user_id', 'status', ...timestamps],
        updatedAtColumn: 'updated_at'
    },
    {
        name: 'order_items',
        table: 'order_items',
        routePath: '/order-items',
        primaryKey: 'item_id',
        primaryKeyType: 'number',
        allowedCreateFields: [
            'order_id',
            'product_id',
            'variant_id',
            'product_name',
            'variant_info',
            'unit_price',
            'quantity',
            'subtotal'
        ],
        allowedUpdateFields: [
            'order_id',
            'product_id',
            'variant_id',
            'product_name',
            'variant_info',
            'unit_price',
            'quantity',
            'subtotal'
        ],
        requiredCreateFields: [
            'order_id',
            'product_id',
            'product_name',
            'unit_price',
            'quantity',
            'subtotal'
        ],
        filterFields: ['order_id', 'product_id', 'variant_id'],
        sortFields: ['item_id', 'order_id', 'product_id']
    },
    {
        name: 'payments',
        table: 'payments',
        routePath: '/payments',
        primaryKey: 'payment_id',
        primaryKeyType: 'number',
        allowedCreateFields: [
            'order_id',
            'method',
            'status',
            'amount',
            'transaction_id',
            'gateway_response',
            'paid_at'
        ],
        allowedUpdateFields: [
            'order_id',
            'method',
            'status',
            'amount',
            'transaction_id',
            'gateway_response',
            'paid_at'
        ],
        requiredCreateFields: ['order_id', 'method', 'amount'],
        filterFields: ['order_id', 'method', 'status', 'transaction_id'],
        sortFields: ['payment_id', 'order_id', 'amount', 'paid_at']
    },
    {
        name: 'shipments',
        table: 'shipments',
        routePath: '/shipments',
        primaryKey: 'shipment_id',
        primaryKeyType: 'number',
        allowedCreateFields: [
            'order_id',
            'carrier',
            'tracking_number',
            'status',
            'shipped_at',
            'estimated_delivery',
            'delivered_at'
        ],
        allowedUpdateFields: [
            'order_id',
            'carrier',
            'tracking_number',
            'status',
            'shipped_at',
            'estimated_delivery',
            'delivered_at'
        ],
        requiredCreateFields: ['order_id', 'carrier'],
        filterFields: ['order_id', 'carrier', 'tracking_number', 'status'],
        sortFields: [
            'shipment_id',
            'order_id',
            'shipped_at',
            'estimated_delivery',
            'delivered_at'
        ]
    },
    {
        name: 'reviews',
        table: 'reviews',
        routePath: '/reviews',
        primaryKey: 'review_id',
        primaryKeyType: 'number',
        defaultOrder: 'created_at',
        allowedCreateFields: [
            'product_id',
            'user_id',
            'order_item_id',
            'rating',
            'comment',
            'image_urls',
            'is_approved'
        ],
        allowedUpdateFields: [
            'product_id',
            'user_id',
            'order_item_id',
            'rating',
            'comment',
            'image_urls',
            'is_approved'
        ],
        requiredCreateFields: ['product_id', 'user_id', 'rating'],
        filterFields: [
            'product_id',
            'user_id',
            'order_item_id',
            'rating',
            'is_approved'
        ],
        sortFields: [
            'review_id',
            'product_id',
            'user_id',
            'rating',
            'created_at'
        ]
    },
    {
        name: 'voucher_redemptions',
        table: 'voucher_redemptions',
        routePath: '/voucher-redemptions',
        primaryKey: 'redemption_id',
        primaryKeyType: 'number',
        defaultOrder: 'redeemed_at',
        allowedCreateFields: [
            'voucher_id',
            'user_id',
            'order_id',
            'discount_amount'
        ],
        allowedUpdateFields: [
            'voucher_id',
            'user_id',
            'order_id',
            'discount_amount'
        ],
        requiredCreateFields: [
            'voucher_id',
            'user_id',
            'order_id',
            'discount_amount'
        ],
        filterFields: ['voucher_id', 'user_id', 'order_id'],
        sortFields: ['redemption_id', 'voucher_id', 'user_id', 'redeemed_at']
    }
];
