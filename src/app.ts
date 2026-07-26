import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.config';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import adminRoutes from './routes/admin.routes';
import cartRoutes from './routes/cart.routes';
import voucherRoutes from './routes/voucher.routes';
import orderRoutes from './routes/order.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { adminMiddleware } from './middleware/admin.middleware';

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
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);

// Authenticated users
app.use('/user', userRoutes);
app.use('/cart', authMiddleware, cartRoutes);
app.use('/vouchers', authMiddleware, voucherRoutes);
app.use('/orders', authMiddleware, orderRoutes);
// app.use('/wishlist', authMiddleware, wishlistRoutes);

// Admin only
app.use('/admin', authMiddleware, adminMiddleware, adminRoutes);

// Error handler
app.use(errorMiddleware);

export default app;
