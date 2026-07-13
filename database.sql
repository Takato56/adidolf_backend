-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
                              user_id integer NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
                              email character varying NOT NULL UNIQUE,
                              password_hash character varying NOT NULL,
                              full_name character varying NOT NULL,
                              phone character varying,
                              avatar_url text,
                              role character varying NOT NULL DEFAULT 'customer'::character varying CHECK (role::text = ANY (ARRAY['customer'::character varying, 'admin'::character varying, 'staff'::character varying]::text[])),
                              is_active boolean NOT NULL DEFAULT true,
                              created_at timestamp with time zone NOT NULL DEFAULT now(),
                              updated_at timestamp with time zone NOT NULL DEFAULT now(),
                              CONSTRAINT users_pkey PRIMARY KEY (user_id)
);
CREATE TABLE public.addresses (
                                  address_id integer NOT NULL DEFAULT nextval('addresses_address_id_seq'::regclass),
                                  user_id integer NOT NULL,
                                  recipient_name character varying NOT NULL,
                                  phone character varying NOT NULL,
                                  is_default boolean NOT NULL DEFAULT false,
                                  created_at timestamp with time zone NOT NULL DEFAULT now(),
                                  address_details text NOT NULL,
                                  CONSTRAINT addresses_pkey PRIMARY KEY (address_id),
                                  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.categories (
                                   category_id integer NOT NULL DEFAULT nextval('categories_category_id_seq'::regclass),
                                   name character varying NOT NULL,
                                   slug character varying NOT NULL UNIQUE,
                                   description text,
                                   image_url text,
                                   created_at timestamp with time zone NOT NULL DEFAULT now(),
                                   CONSTRAINT categories_pkey PRIMARY KEY (category_id)
);
CREATE TABLE public.products (
                                 product_id integer NOT NULL DEFAULT nextval('products_product_id_seq'::regclass),
                                 category_id integer NOT NULL,
                                 name character varying NOT NULL,
                                 slug character varying NOT NULL UNIQUE,
                                 description text,
                                 base_price numeric NOT NULL CHECK (base_price >= 0::numeric),
  brand character varying,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (product_id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id)
);
CREATE TABLE public.product_variants (
                                         variant_id integer NOT NULL DEFAULT nextval('product_variants_variant_id_seq'::regclass),
                                         product_id integer NOT NULL,
                                         sku character varying NOT NULL UNIQUE,
                                         color character varying,
                                         size character varying,
                                         extra_price numeric NOT NULL DEFAULT 0 CHECK (extra_price >= 0::numeric),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_variants_pkey PRIMARY KEY (variant_id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id)
);
CREATE TABLE public.product_images (
                                       image_id integer NOT NULL DEFAULT nextval('product_images_image_id_seq'::regclass),
                                       product_id integer NOT NULL,
                                       image_url text NOT NULL,
                                       alt_text character varying,
                                       is_primary boolean NOT NULL DEFAULT false,
                                       sort_order integer NOT NULL DEFAULT 0,
                                       CONSTRAINT product_images_pkey PRIMARY KEY (image_id),
                                       CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id)
);
CREATE TABLE public.vouchers (
                                 voucher_id integer NOT NULL DEFAULT nextval('vouchers_voucher_id_seq'::regclass),
                                 code character varying NOT NULL,
                                 discount_type character varying NOT NULL CHECK (discount_type::text = ANY (ARRAY['percent'::character varying, 'fixed'::character varying]::text[])),
  discount_value numeric NOT NULL CHECK (discount_value > 0::numeric),
  max_discount numeric,
  min_order_amount numeric NOT NULL DEFAULT 0,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  valid_from timestamp with time zone NOT NULL,
  valid_to timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  target_user_id integer,
  CONSTRAINT vouchers_pkey PRIMARY KEY (voucher_id),
  CONSTRAINT vouchers_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.carts (
                              cart_id integer NOT NULL DEFAULT nextval('carts_cart_id_seq'::regclass),
                              user_id integer,
                              session_token character varying UNIQUE,
                              created_at timestamp with time zone NOT NULL DEFAULT now(),
                              updated_at timestamp with time zone NOT NULL DEFAULT now(),
                              CONSTRAINT carts_pkey PRIMARY KEY (cart_id),
                              CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.cart_items (
                                   cart_item_id integer NOT NULL DEFAULT nextval('cart_items_cart_item_id_seq'::regclass),
                                   cart_id integer NOT NULL,
                                   product_id integer NOT NULL,
                                   variant_id integer,
                                   quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
                                   added_at timestamp with time zone NOT NULL DEFAULT now(),
                                   CONSTRAINT cart_items_pkey PRIMARY KEY (cart_item_id),
                                   CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(cart_id),
                                   CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id),
                                   CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(variant_id)
);
CREATE TABLE public.orders (
                               order_id integer NOT NULL DEFAULT nextval('orders_order_id_seq'::regclass),
                               user_id integer NOT NULL,
                               address_id integer NOT NULL,
                               voucher_id integer,
                               status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'confirmed'::character varying, 'shipping'::character varying, 'delivered'::character varying, 'cancelled'::character varying]::text[])),
                               subtotal numeric NOT NULL CHECK (subtotal >= 0::numeric),
  discount_amount numeric NOT NULL DEFAULT 0 CHECK (discount_amount >= 0::numeric),
  shipping_fee numeric NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0::numeric),
  total_price numeric NOT NULL CHECK (total_price >= 0::numeric),
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (order_id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(address_id),
  CONSTRAINT orders_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.vouchers(voucher_id)
);
CREATE TABLE public.order_items (
                                    item_id integer NOT NULL DEFAULT nextval('order_items_item_id_seq'::regclass),
                                    order_id integer NOT NULL,
                                    product_id integer NOT NULL,
                                    variant_id integer,
                                    product_name character varying NOT NULL,
                                    variant_info character varying,
                                    unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal numeric NOT NULL CHECK (subtotal >= 0::numeric),
  CONSTRAINT order_items_pkey PRIMARY KEY (item_id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id),
  CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(variant_id)
);
CREATE TABLE public.payments (
                                 payment_id integer NOT NULL DEFAULT nextval('payments_payment_id_seq'::regclass),
                                 order_id integer NOT NULL UNIQUE,
                                 method character varying NOT NULL CHECK (method::text = ANY (ARRAY['COD'::character varying, 'VNPay'::character varying, 'Momo'::character varying, 'ZaloPay'::character varying, 'card'::character varying, 'bank_transfer'::character varying]::text[])),
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying]::text[])),
  amount numeric NOT NULL CHECK (amount >= 0::numeric),
  transaction_id character varying UNIQUE,
  gateway_response text,
  paid_at timestamp with time zone,
  CONSTRAINT payments_pkey PRIMARY KEY (payment_id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id)
);
CREATE TABLE public.shipments (
                                  shipment_id integer NOT NULL DEFAULT nextval('shipments_shipment_id_seq'::regclass),
                                  order_id integer NOT NULL UNIQUE,
                                  carrier character varying NOT NULL,
                                  tracking_number character varying UNIQUE,
                                  status character varying NOT NULL DEFAULT 'preparing'::character varying CHECK (status::text = ANY (ARRAY['preparing'::character varying, 'in_transit'::character varying, 'delivered'::character varying, 'returned'::character varying]::text[])),
                                  shipped_at timestamp with time zone,
                                  estimated_delivery date,
                                  delivered_at timestamp with time zone,
                                  CONSTRAINT shipments_pkey PRIMARY KEY (shipment_id),
                                  CONSTRAINT shipments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id)
);
CREATE TABLE public.reviews (
                                review_id integer NOT NULL DEFAULT nextval('reviews_review_id_seq'::regclass),
                                product_id integer NOT NULL,
                                user_id integer NOT NULL,
                                order_item_id integer,
                                rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
                                comment text,
                                image_urls jsonb,
                                is_approved boolean NOT NULL DEFAULT false,
                                created_at timestamp with time zone NOT NULL DEFAULT now(),
                                CONSTRAINT reviews_pkey PRIMARY KEY (review_id),
                                CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id),
                                CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
                                CONSTRAINT reviews_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(item_id)
);
CREATE TABLE public.users_tokens (
                                     token_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
                                     created_at timestamp with time zone NOT NULL DEFAULT now(),
                                     user_id integer NOT NULL,
                                     refresh_token text NOT NULL UNIQUE,
                                     expired_in timestamp with time zone,
                                     CONSTRAINT users_tokens_pkey PRIMARY KEY (token_id),
                                     CONSTRAINT users_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.voucher_redemptions (
                                            redemption_id bigint NOT NULL DEFAULT nextval('voucher_redemptions_redemption_id_seq'::regclass),
                                            voucher_id integer NOT NULL,
                                            user_id integer NOT NULL,
                                            order_id integer NOT NULL,
                                            discount_amount numeric NOT NULL,
                                            redeemed_at timestamp with time zone NOT NULL DEFAULT now(),
                                            CONSTRAINT voucher_redemptions_pkey PRIMARY KEY (redemption_id),
                                            CONSTRAINT voucher_redemptions_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.vouchers(voucher_id),
                                            CONSTRAINT voucher_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
                                            CONSTRAINT voucher_redemptions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id)
);