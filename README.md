# Adidolf Backend

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.2-lightgrey.svg)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)

A robust TypeScript Express backend for **Adidolf**, an e-commerce platform. This API leverages Supabase Postgres for data persistence and Supabase Storage for managing product assets.

## 🚀 Features

-   **Secure Authentication**: JWT-based auth with access and refresh tokens using Argon2 hashing.
-   **Dynamic Admin Dashboard**: Configuration-driven CRUD routes for managing database resources efficiently.
-   **Advanced Product Management**:
    -   Support for categories, variants (size, color, SKU), and multiple images.
    -   Integrated image upload to Supabase Storage with automatic URL mapping.
    -   Slug-based routing for SEO-friendly product pages.
-   **Data Integrity**: Strict request validation using Zod schemas.
-   **Middleware-Driven**: Dedicated layers for error handling, authentication, and admin authorization.
-   **Scalable Architecture**: Clean separation of concerns (Controllers, Models, Services, Validators).

## 🛠 Tech Stack

-   **Runtime**: [Node.js](https://nodejs.org/) with [tsx](https://github.com/privatenumber/tsx) for development.
-   **Framework**: [Express.js 5](https://expressjs.com/) (latest beta/v5 features).
-   **Language**: [TypeScript 6](https://www.typescriptlang.org/).
-   **Database & Storage**: [Supabase](https://supabase.com/) (Postgres + Storage).
-   **Security**: [Argon2](https://github.com/ranisalt/node-argon2) for password hashing, [JWT](https://github.com/auth0/node-jsonwebtoken) for sessions, and [Helmet](https://helmetjs.github.io/) for HTTP headers.
-   **Validation**: [Zod](https://zod.dev/).
-   **File Handling**: [Multer](https://github.com/expressjs/multer) for multipart image uploads.

## ⚙️ Setup

### Prerequisites

-   Node.js (v18+ recommended)
-   A Supabase project and credentials

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/Takato56/adidolf_backend.git
    cd adidolf_backend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment Variables:
    Copy the example file and fill in your details:
    ```bash
    cp .env.example .env
    ```
    Required keys:
    - `DATABASE_URL` / Supabase connection strings
    - `SUPABASE_URL` & `SUPABASE_ANON_KEY`
    - `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`
    - `SUPABASE_PRODUCT_IMAGE_BUCKET` (Default: `product-images`)

4.  **Supabase Storage**: Ensure a bucket named `product-images` (or your custom name) exists in your Supabase project and is set to "Public" if you want direct URL access.

## 🚦 Running the App

### Development
```bash
npm run dev
```
The server will start on the port defined in `.env` (defaulting to `3000`).

### Production Build
```bash
npm run build
npm start
```

## 📖 API Documentation

### Authentication
-   `POST /auth/register` - Create a new account.
-   `POST /auth/login` - Authenticate and receive tokens.
-   `POST /auth/refresh` - Rotate access tokens using a refresh token.
-   `POST /auth/logout` - Invalidate session.

### Products & Images
-   `GET /products` - List all products.
-   `GET /products/:id` - Get detailed product info.
-   `GET /products/slug/:slug` - Find product by URL slug.
-   `POST /products/:id/images/upload` - Upload multiple images to Supabase (Admin only).
-   `DELETE /products/:id/images/:imageId` - Remove image from DB and Storage (Admin only).

### Categories
-   `GET /categories` - List all categories.
-   `POST /categories` - Create new category (Admin only).

### Admin Tools
-   `GET /admin` - List all manageable resources.
-   `GET /admin/:resource` - Dynamic CRUD access for system resources.

## 📂 Project Structure

```text
src/
├── config/       # App configurations (Supabase, Auth, CRUD resources)
├── controllers/  # Request handlers & logic orchestration
├── middleware/   # Auth, Admin check, Error handling, Multer
├── models/       # Data access layer (Supabase clients)
├── routes/       # API endpoint definitions
├── services/     # Shared business logic & storage helpers
├── types/        # TypeScript interfaces & DTOs
├── utils/        # Shared utility functions (token gen, etc.)
└── validators/   # Zod schemas for request validation
```

## 📜 License

This project is licensed under the [ISC License](LICENSE).
