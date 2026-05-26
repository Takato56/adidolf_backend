import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.config.js'
// import userRoutes from './routes/user.routes';
// import { errorMiddleware } from './middleware/error.middleware';

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

// Routes
// app.use('/api/users', userRoutes);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// Error handler (must be last)
// app.use(errorMiddleware);

export default app;