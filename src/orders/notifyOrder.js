import { env } from '../config/env.js';
import { enqueueMessage } from '../bot/whatsapp.js';
import { buildOrderMessage } from './templates.js';
import { normalizeOrderEvent } from './events.js';

function normalizeOrder(order) {
  if (!order || typeof order !== 'object') return order;

  return {
    ...order,
    code: order.code || order.numeroPedido || order.id,
    customerName: order.customerName || order.nomeCliente || '',
    customerPhone: order.customerPhone || order.telefoneCliente || order.phone || order.telefone,
    items: order.items || order.itens || [],
    total: order.total ?? order.valorTotal,
  };
}

export async function notifyOrderEvent(event, order) {
  const normalizedEvent = normalizeOrderEvent(event);
  const normalizedOrder = normalizeOrder(order);

  if (!normalizedEvent) {
    throw new Error(`Evento de pedido invalido: ${event}`);
  }

  if (!normalizedOrder?.customerPhone) {
    throw new Error('customerPhone/telefoneCliente e obrigatorio.');
  }

  const message = buildOrderMessage(normalizedEvent, normalizedOrder, {
    botName: env.botName,
  });

  if (!message) {
    throw new Error(`Sem template para o evento ${event}.`);
  }

  await enqueueMessage(normalizedOrder.customerPhone, message);

  return {
    event: normalizedEvent,
    originalEvent: event,
    phone: normalizedOrder.customerPhone,
    message,
  };
}
