import app from './app.ts';
import { env } from './config/env.config.ts';

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});