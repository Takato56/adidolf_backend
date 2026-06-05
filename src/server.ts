import app from './app.js';
import { env } from './config/env.config.js';
import { connectMongoDB } from './config/database/mongodb.config';

const PORT = env.PORT || 3000;

connectMongoDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
