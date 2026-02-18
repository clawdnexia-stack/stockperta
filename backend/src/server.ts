import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`🚀 Backend StockAtelier en écoute sur http://localhost:${env.PORT}`);
});
