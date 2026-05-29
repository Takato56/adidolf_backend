import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.config.js'
// import userRoutes from './routes/user.routes';
// import { errorMiddleware } from './middleware/error.middleware';
import { UserModel } from './models/user.model.js'

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({
    // Umcomment this line be4 merge to code
    origin: env.FRONTEND_URL,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// Public
// app.use('/api/auth',       authRoutes);
// app.use('/api/products',   productRoutes);
// app.use('/api/categories', categoryRoutes);

// Authenticated users
// app.use('/api/profile',  authMiddleware, profileRoutes);
// app.use('/api/cart',     authMiddleware, cartRoutes);
// app.use('/api/orders',   authMiddleware, orderRoutes);
// app.use('/api/wishlist', authMiddleware, wishlistRoutes);

// Admin only
// app.use('/api/admin', authMiddleware, adminMiddleware, adminRoutes);

// Error handler (must be last)
// app.use(errorMiddleware);

export default app;