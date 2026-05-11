import { env } from '../config/env.js';
import { enqueueMessage } from '../bot/whatsapp.js';
import { buildOrderMessage } from './templates.js';
import { normalizeOrderEvent } from './events.js';

export async function notifyOrderEvent(event, order) {
  const normalizedEvent = normalizeOrderEvent(event);

  if (!normalizedEvent) {
    throw new Error(`Evento de pedido invalido: ${event}`);
  }

  if (!order?.customerPhone) {
    throw new Error('order.customerPhone e obrigatorio.');
  }

  const message = buildOrderMessage(normalizedEvent, order, {
    botName: env.botName,
  });

  if (!message) {
    throw new Error(`Sem template para o evento ${event}.`);
  }

  await enqueueMessage(order.customerPhone, message);

  return {
    event: normalizedEvent,
    originalEvent: event,
    phone: order.customerPhone,
    message,
  };
}
