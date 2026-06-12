import { enqueueMessage } from '../bot/whatsapp.js';
import { buildOrderMessage, buildPixPaymentMessages, isPixOrder } from './templates.js';
import { normalizeOrderEvent } from './events.js';

function normalizeOrder(order) {
  if (!order || typeof order !== 'object') return order;

  return {
    ...order,
    code: order.code || order.numeroPedido || order.id,
    customerName: order.customerName || order.nomeCliente || '',
    customerPhone: order.customerPhone || order.telefoneCliente || order.phone || order.telefone,
    items: order.items || order.itens || [],
    payment: order.payment || order.formaPagamento || order.paymentMethod || order.metodoPagamento || order.pagamento,
    delivery: order.delivery || order.tipoPedido || order.fulfillment || order.entrega,
    pixKey: order.pixKey || order.chavePix,
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

  const message = await buildOrderMessage(normalizedEvent, normalizedOrder, {
    botName: env.botName,
  });

  if (!message) {
    throw new Error(`Sem template para o evento ${event}.`);
  }

  const queueOptions = {
    retryUntilConnected: true,
    waitForDelivery: false,
  };

  await enqueueMessage(normalizedOrder.customerPhone, message, queueOptions);

  let pixMessagesQueued = 0;

  if (normalizedEvent === 'pedido_criado' && isPixOrder(normalizedOrder)) {
    const pixMessages = await buildPixPaymentMessages(normalizedOrder);

    for (const pixMessage of pixMessages) {
      await enqueueMessage(normalizedOrder.customerPhone, pixMessage, queueOptions);
      pixMessagesQueued += 1;
    }
  }

  return {
    event: normalizedEvent,
    originalEvent: event,
    phone: normalizedOrder.customerPhone,
    message,
    queued: true,
    pixMessageSent: pixMessagesQueued > 0,
    pixMessagesSent: pixMessagesQueued,
    pixMessagesQueued,
  };
}
