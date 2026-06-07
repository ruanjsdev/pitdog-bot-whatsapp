import express from 'express';
import path from 'node:path';
import { env } from '../config/env.js';
import { getBotStatus } from '../bot/whatsapp.js';
import { notifyOrderEvent } from '../orders/notifyOrder.js';
import { normalizeOrderEvent } from '../orders/events.js';
import { createOrder, listOrders, updateOrderStatus } from '../orders/store.js';
import { normalizePhoneCandidates } from '../utils/phone.js';
import { requireAdminPin } from './adminAuth.js';
import { requireApiToken } from './auth.js';
import { settingsRoutes } from '../bot/settings.js';

export function createHttpServer() {
  const app = express();

  app.use((req, res, next) => {
    const requestOrigin = req.get('origin');
    const allowedOrigin = env.adminOrigin === '*' ? requestOrigin || '*' : env.adminOrigin;

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-pin, x-bot-token, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  });

  app.use(express.json({ limit: '256kb' }));
  app.use(express.static(path.resolve('public')));

  // Rotas de Configuração do Bot (Mensagens, Link, etc)
  app.use('/api/settings', settingsRoutes);

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      bot: getBotStatus(),
    });
  });

  app.get('/api/bot/status', requireAdminPin, (_req, res) => {
    res.json({
      ok: true,
      bot: getBotStatus(),
    });
  });

  async function handleOrderEvent(req, res) {
    try {
      const order = req.body.order || req.body.pedido || req.body;
      const event = req.body.event || req.body.status || order.status;
      const result = await notifyOrderEvent(event, order);

      res.json({
        ok: true,
        result,
      });
    } catch (error) {
      res.status(400).json({
        ok: false,
        error: error.message,
      });
    }
  }

  app.post('/events/order', requireApiToken, handleOrderEvent);
  app.post('/events/order/status', requireApiToken, handleOrderEvent);

  app.post('/api/notify-order', requireAdminPin, handleOrderEvent);

  app.get('/api/orders', requireAdminPin, async (_req, res) => {
    const orders = await listOrders();
    res.json({ ok: true, orders });
  });

  app.get('/api/phone/preview', requireAdminPin, (req, res) => {
    try {
      const candidates = normalizePhoneCandidates(req.query.phone);

      res.json({
        ok: true,
        phone: req.query.phone,
        candidates,
      });
    } catch (error) {
      res.status(400).json({
        ok: false,
        error: error.message,
      });
    }
  });

  app.post('/api/orders', requireAdminPin, async (req, res) => {
    try {
      const order = await createOrder(req.body);
      const notification = await notifyOrderEvent('pedido_criado', order);

      res.status(201).json({
        ok: true,
        order,
        notification,
      });
    } catch (error) {
      res.status(400).json({
        ok: false,
        error: error.message,
      });
    }
  });

  app.patch('/api/orders/:id/status', requireAdminPin, async (req, res) => {
    try {
      const status = normalizeOrderEvent(req.body.status);

      if (!status) {
        throw new Error(`Status invalido: ${req.body.status}`);
      }

      const order = await updateOrderStatus(req.params.id, status);
      const notification = await notifyOrderEvent(status, order);

      res.json({
        ok: true,
        order,
        notification,
      });
    } catch (error) {
      res.status(400).json({
        ok: false,
        error: error.message,
      });
    }
  });

  return app;
}
