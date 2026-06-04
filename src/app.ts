import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.config.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(
    cors({
        origin: env.FRONTEND_URL,
        credentials: true
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// Public
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
// app.use('/api/categories', categoryRoutes);

// Authenticated users
// app.use('/api/profile',  authMiddleware, profileRoutes);
// import { authMiddleware } from './middleware/auth.middleware.js';
// app.use('/api/cart',     authMiddleware, cartRoutes);
// app.use('/api/orders',   authMiddleware, orderRoutes);
// app.use('/api/wishlist', authMiddleware, wishlistRoutes);

// Admin only
// app.use('/api/admin', authMiddleware, adminMiddleware, adminRoutes);

// Error handler
app.use(errorMiddleware);

export default app;
