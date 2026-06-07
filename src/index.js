import { env } from './config/env.js';
import { startWhatsapp } from './bot/whatsapp.js';
import { createHttpServer } from './http/server.js';

async function main() {
  await startWhatsapp();

  const app = createHttpServer();

  app.listen(env.port, () => {
    console.log(`Bot Pits Dog rodando em http://localhost:${env.port}`);
    console.log('Use GET /health para ver o status e POST /events/order para eventos de pedido.');
  });
}

main().catch((error) => {
  console.error('Falha ao iniciar o bot:', error);
  process.exit(1);
});
