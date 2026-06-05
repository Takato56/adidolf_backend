# Adidolf Backend

A TypeScript-based Express backend for the Adidolf application, featuring authentication with JWT, MongoDB for data persistence, and Supabase integration.

## Features

- **Authentication**: JWT-based authentication (Access & Refresh tokens) with Argon2 password hashing.
- **Database**: MongoDB integration using Mongoose.
- **Supabase**: Integrated for additional storage or database features.
- **Security**: Helmet for HTTP headers security, CORS configuration, and cookie-parsing.
- **Validation**: Request validation using Zod.
- **TypeScript**: Fully typed codebase for better developer experience and reliability.

## Tech Stack

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose), Supabase
- **Auth**: JSON Web Tokens (JWT), Argon2
- **Validation**: Zod
- **Development**: Nodemon, tsx

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB instance
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Takato56/adidolf_backend.git
   cd adidolf_backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your credentials.
   ```bash
   cp .env.example .env
   ```

### Running the Application

- **Development Mode**:
  ```bash
  npm run dev
  ```
  The server will start at `http://localhost:5678` (or the port specified in your `.env`).

- **Production Build**:
  ```bash
  npm run build
  npm start
  ```

## Project Structure

```text
src/
├── config/       # Configuration files (DB, Env)
├── controllers/  # Request handlers
├── middleware/   # Custom Express middlewares
├── models/       # Mongoose models
├── routes/       # API route definitions
├── services/     # Business logic
├── types/        # TypeScript type definitions
├── utils/        # Helper functions
└── validators/   # Zod validation schemas
```

## API Endpoints (Brief Overview)

- `GET /health`: Health check endpoint.
- `POST /auth/register`: Register a new user.
- `POST /auth/login`: Login and receive tokens.
- `POST /auth/refresh`: Refresh access token.
- `GET /products`: List products.

## License

ISC
