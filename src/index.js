import { env } from './config/env.js';
import { startWhatsapp } from './bot/whatsapp.js';
import { createHttpServer } from './http/server.js';

async function startKeepAlive() {
  if (!env.keepAliveIntervalMs || env.keepAliveIntervalMs <= 0) {
    return;
  }

  const url = `http://127.0.0.1:${env.port}/health`;

  setInterval(async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Keep-alive request falhou com status ${response.status}`);
      }
    } catch (error) {
      console.warn('Falha ao enviar keep-alive para o /health:', error.message);
    }
  }, env.keepAliveIntervalMs);
}

async function main() {
  await startWhatsapp();

  const app = createHttpServer();

  app.listen(env.port, () => {
    console.log(`Bot Pits Dog rodando em http://localhost:${env.port}`);
    console.log('Use GET /health para ver o status e POST /events/order para eventos de pedido.');
    startKeepAlive();
  });
}

main().catch((error) => {
  console.error('Falha ao iniciar o bot:', error);
  process.exit(1);
});
