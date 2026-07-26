# Adidolf Backend

TypeScript Express backend for the Adidolf e-commerce API. The app uses Supabase Postgres for relational data, Supabase Storage for product images, JWT access tokens for authenticated requests, and HTTP-only refresh-token cookies for session rotation.

## Stack

- Node.js with TypeScript
- Express 5
- Supabase Postgres and Supabase Storage
- Argon2 password hashing
- JSON Web Tokens
- Zod request validation
- Multer multipart upload handling
- Node's built-in test runner via `tsx`

## Features

- Customer registration, login, refresh-token rotation, and logout.
- Access-token authentication middleware and admin-role authorization middleware.
- Public category and product read routes.
- Admin-only category and product management.
- Product images stored either as direct image URLs or uploaded files in Supabase Storage.
- Dynamic admin CRUD routes generated from `src/config/resource.config.ts`.
- Central error handling for operational errors, validation failures, and unexpected failures.
- Development-database integration tests that exercise the real route/model paths.

## Requirements

- Node.js 18 or newer
- npm
- A Supabase project with the schema from `database.sql`
- A Supabase Storage bucket for product images

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required variables:

```env
PORT=5678
FRONTEND_URL=http://localhost:3000

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_PRODUCT_IMAGE_BUCKET=product-images

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

NODE_ENV=development
```

`SUPABASE_SERVICE_ROLE_KEY` is preferred for backend database operations. If it is not set, the app falls back to `SUPABASE_ANON_KEY`.

## Installation

```bash
npm install
```

## Running

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

Health check:

```http
GET /health
```

Response:

```json
{ "status": "ok" }
```

## Testing

Run the full suite:

```bash
npm test
```

Run with coverage:

```bash
npm run test:coverage
```

Important: tests use the current development environment and write sample records through the normal API/model logic. They create identifiable `codex-*` sample data in Supabase, upload sample product images to the configured storage bucket, and exercise protected admin routes with generated JWTs. The test runner uses single concurrency to reduce race conditions against shared development services.

Current coverage is about 97% line coverage across `src`.

## Authentication

Access tokens are returned in the login response and should be sent as:

```http
Authorization: Bearer <accessToken>
```

Refresh tokens are stored in an HTTP-only `refreshToken` cookie and persisted in the `users_tokens` table. Refresh rotates the token by deleting the old database token and inserting a new one.

### Auth Routes

| Method | Path             | Auth           | Description                                            |
| ------ | ---------------- | -------------- | ------------------------------------------------------ |
| `POST` | `/auth/register` | Public         | Create a customer account.                             |
| `POST` | `/auth/login`    | Public         | Login and receive an access token plus refresh cookie. |
| `POST` | `/auth/refresh`  | Refresh cookie | Rotate refresh token and return a new access token.    |
| `POST` | `/auth/logout`   | Access token   | Delete refresh token if present and clear cookie.      |

`/auth/login`, `/auth/register`, and `/auth/refresh` share one in-memory, per-IP rate limit (10 requests / 15 minutes combined). Exceeding it returns `429`.

## User Routes

All routes below require an access token (`authMiddleware` is applied for the whole `/user` router).

| Method   | Path                            | Description                                                                     |
| -------- | -------------------------------- | -------------------------------------------------------------------------------- |
| `GET`    | `/user/me`                       | Return the full profile from the database (never includes `password_hash`).      |
| `PATCH`  | `/user/me`                       | Update `full_name`, `phone`, `avatar_url`.                                       |
| `PATCH`  | `/user/me/password`              | Change password: verifies the old password (Argon2), hashes the new one, and revokes all of the account's refresh tokens. |
| `GET`    | `/user/addresses`                | List the current user's own addresses.                                           |
| `POST`   | `/user/addresses`                | Add an address.                                                                  |
| `PUT`    | `/user/addresses/:id`            | Update an address (ownership checked; ties to the current user).                 |
| `DELETE` | `/user/addresses/:id`            | Delete an address; blocked with `400` if an order still references it.           |
| `PATCH`  | `/user/addresses/:id/default`    | Set an address as default and unset the default flag on the account's other addresses. |

## Cart Routes

All cart routes require an access token and operate on the current user's own cart (auto-created on first access, one cart per account).

| Method   | Path                   | Auth         | Description                                                                              |
| -------- | ---------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| `GET`    | `/cart`                | Access token | Get the current cart with items, product/variant details, unit prices, and subtotals.     |
| `POST`   | `/cart/items`          | Access token | Add `{ product_id, variant_id, quantity }`; merges quantity into an existing line.        |
| `PATCH`  | `/cart/items/:itemId`  | Access token | Set the absolute quantity for one cart line.                                              |
| `DELETE` | `/cart/items/:itemId`  | Access token | Remove one cart line.                                                                     |
| `DELETE` | `/cart`                | Access token | Remove all lines from the current cart.                                                   |

Business rules: only published products can be added; the variant must belong to the given product; quantity must be positive and cannot exceed `product_variants.stock_quantity`; unit price is always computed server-side as `products.base_price + product_variants.extra_price`.

## Category Routes

| Method   | Path              | Auth   | Description                                                                   |
| -------- | ----------------- | ------ | ----------------------------------------------------------------------------- |
| `GET`    | `/categories`     | Public | List categories. Supports `?sort=name`.                                       |
| `GET`    | `/categories/:id` | Public | Get one category by ID.                                                       |
| `POST`   | `/categories`     | Admin  | Create a category. Slug is generated from name if omitted.                    |
| `PUT`    | `/categories/:id` | Admin  | Update a category. Slug is regenerated when name changes and slug is omitted. |
| `DELETE` | `/categories/:id` | Admin  | Delete a category if no products are assigned.                                |

Category slugs must be lowercase alphanumeric values separated by single hyphens.

## Product Routes

| Method   | Path                            | Auth   | Description                                                              |
| -------- | ------------------------------- | ------ | ------------------------------------------------------------------------ |
| `GET`    | `/products`                     | Public | List published products.                                                 |
| `GET`    | `/products/:id`                 | Public | Get one published product by ID.                                         |
| `GET`    | `/products/slug/:slug`          | Public | Get one published product by slug.                                       |
| `POST`   | `/products`                     | Admin  | Create a product. Slug is generated from name if omitted.                |
| `PUT`    | `/products/:id`                 | Admin  | Update a product.                                                        |
| `DELETE` | `/products/:id`                 | Admin  | Soft-delete a product by setting `is_published` to `false`.              |
| `GET`    | `/products/:id/images`          | Public | List product images.                                                     |
| `POST`   | `/products/:id/images`          | Admin  | Create product image records from JSON URLs.                             |
| `POST`   | `/products/:id/images/upload`   | Admin  | Upload image files to Supabase Storage and create image records.         |
| `PATCH`  | `/products/:id/images/:imageId` | Admin  | Update one product image record.                                         |
| `DELETE` | `/products/:id/images/:imageId` | Admin  | Delete one product image record and remove storage object when possible. |

Product list filters:

| Query         | Description                           |
| ------------- | ------------------------------------- |
| `category_id` | Positive integer category ID.         |
| `brand`       | Exact brand match.                    |
| `min_price`   | Minimum base price.                   |
| `max_price`   | Maximum base price.                   |
| `search`      | Case-insensitive product-name search. |

Product upload details:

- Multipart field name: `images`
- Maximum files: 10
- Maximum file size: 5 MB each
- Accepted MIME types: `image/*`
- Optional metadata fields: `alt_text`, `is_primary`, `sort_order`
- For multiple files, metadata fields may be repeated and are matched by file order.

## Dynamic Admin CRUD

All dynamic admin routes require both a valid access token and `role: "admin"` in the token payload.

| Method   | Path                   | Description                                           |
| -------- | ---------------------- | ----------------------------------------------------- |
| `GET`    | `/admin`               | List configured admin resources.                      |
| `GET`    | `/admin/:resource`     | List records with filtering, sorting, and pagination. |
| `POST`   | `/admin/:resource`     | Create a record using configured allowed fields.      |
| `GET`    | `/admin/:resource/:id` | Get one record by primary key.                        |
| `PUT`    | `/admin/:resource/:id` | Update a record using configured allowed fields.      |
| `PATCH`  | `/admin/:resource/:id` | Update a record using configured allowed fields.      |
| `DELETE` | `/admin/:resource/:id` | Delete a record.                                      |

List query options:

| Query                    | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| `limit`                  | Integer from 1 to 100.                                    |
| `offset`                 | Non-negative integer.                                     |
| `sort`                   | Must be one of the configured sort/filter/default fields. |
| `order`                  | `asc` or `desc`.                                          |
| configured filter fields | Exact-match filters for the resource.                     |

Configured resources:

- `users`
- `addresses`
- `categories`
- `products`
- `product-variants`
- `product-images`
- `vouchers`
- `carts`
- `cart-items`
- `orders`
- `order-items`
- `payments`
- `shipments`
- `reviews`
- `voucher-redemptions`

`users_tokens` is used by the auth flow but is not exposed as a dynamic admin resource.

## Project Structure

```text
src/
  app.ts                    Express app setup and route mounting
  server.ts                 HTTP server entrypoint
  config/
    env.config.ts           Environment variables and helpers
    resource.config.ts      Dynamic admin CRUD resource definitions
    supabase.config.ts      Supabase client singleton
  controllers/              Route handlers
  middleware/               Auth, admin, upload, and error middleware
  models/                   Supabase data-access layer
  routes/                   Express routers
  services/                 Storage helpers
  types/                    TypeScript DTOs and domain types
  utils/                    Auth, slug, and database-error helpers
  validators/               Zod request schemas
tests/
  config/                   Config helper tests
  integration/              Development DB-backed API path tests
  middleware/               Middleware tests
  models/                   Model tests
  services/                 Service tests
  utils/                    Utility tests
  validators/               Zod schema tests
```

## Data Model

The schema in `database.sql` includes users, refresh tokens, addresses, categories, products, product variants, product images, vouchers, carts, cart items, orders, order items, payments, shipments, reviews, and voucher redemptions.

Key behavior in code:

- Products reference categories.
- Product reads only return published products unless an admin write path explicitly includes unpublished products.
- Product deletion is a soft delete.
- Category deletion is blocked when products still reference the category.
- Product image primary status is normalized so only one image is primary for a product.
- Refresh tokens are stored in `users_tokens`.

## License

ISC
