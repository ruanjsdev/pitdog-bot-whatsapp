import { ORDER_EVENTS } from './events.js';
import { getSettings, formatGreeting } from '../config/settings.js';

const orderMessageKeysByEvent = {
  [ORDER_EVENTS.created]: 'created',
  [ORDER_EVENTS.approved]: 'approved',
  [ORDER_EVENTS.preparing]: 'preparing',
  [ORDER_EVENTS.ready]: 'ready',
  [ORDER_EVENTS.outForDelivery]: 'outForDelivery',
  [ORDER_EVENTS.finished]: 'finished',
  [ORDER_EVENTS.canceled]: 'canceled',
};

function formatMoney(value) {
  if (value === undefined || value === null || value === '') return null;

  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getItemName(item) {
  return item.name || item.nome || item.productName || item.produto || item.nomeProduto || item.nomeCombo || 'Item';
}

function getItemQuantity(item) {
  return item.quantity || item.quantidade || item.qtd || item.qty || 1;
}

function getItemObservation(item) {
  return item.observation || item.observacao || item.obs || item.note || item.notes || '';
}

function getItemAdditions(item) {
  const additions = item.additions || item.adicionais || item.additionalItems || item.extras || [];

  if (!Array.isArray(additions)) return [];

  return additions
    .map((addition) => {
      if (typeof addition === 'string') return addition;
      return addition.name || addition.nome || addition.nomeAdicional || addition.description || addition.descricao || '';
    })
    .filter(Boolean);
}

function buildItemsSummary(order) {
  const items = order.items || order.itens || [];

  if (!Array.isArray(items) || items.length === 0) return '';

  const lines = items.flatMap((item) => {
    const itemLines = [`• ${getItemQuantity(item)}x ${getItemName(item)}`];
    const additions = getItemAdditions(item);
    const observation = getItemObservation(item);

    additions.forEach((addition) => {
      itemLines.push(`  + ${addition}`);
    });

    if (observation) {
      itemLines.push(`  Obs: ${observation}`);
    }

    return itemLines;
  });

  return `\n\n🧾 Resumo do pedido:\n${lines.join('\n')}`;
}

function buildTotalLine(order) {
  const total = formatMoney(order.total ?? order.valorTotal ?? order.totalValue);

  return total ? `\n\n💰 Total: ${total}` : '';
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function isPixOrder(order) {
  const payment = normalizeText(
    order.payment ||
      order.formaPagamento ||
      order.paymentMethod ||
      order.metodoPagamento ||
      order.pagamento ||
      ''
  );

  return payment.includes('pix');
}

export async function buildGreetingMessage() {
  const settings = await getSettings();
  return formatGreeting(settings);
}

export async function buildPixPaymentMessages(order) {
  const settings = await getSettings();
  const pixKey = String(order.pixKey || order.chavePix || settings.pixKey || '').trim();

  if (!pixKey) return [];

  const receiver = String(settings.pixReceiverName || settings.botName || 'Pits Dog').trim();
  const total = formatMoney(order.total ?? order.valorTotal ?? order.totalValue);
  const pixPaymentMessage = applyTemplate(settings.pixPaymentMessage, {
    pix_receiver: receiver,
    pix_key: pixKey,
    total: total || '',
  });
  const pixProofMessage = applyTemplate(settings.pixProofMessage, {
    pix_receiver: receiver,
    pix_key: pixKey,
    total: total || '',
  });

  return [
    pixPaymentMessage,
    pixKey,
    [total ? `Valor do PIX: ${total}` : '', pixProofMessage].filter(Boolean).join('\n\n'),
  ].filter(Boolean);
}

function applyTemplate(template = '', variables = {}) {
  return String(template || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
    return variables[key] ?? '';
  });
}

export async function buildOrderMessage(event, order) {
  const settings = await getSettings();
  const customerName = order.customerName ? `, ${order.customerName}` : '';
  const itemsSummary = buildItemsSummary(order);
  const totalLine = buildTotalLine(order);
  const messageKey = orderMessageKeysByEvent[event] || event;
  const template = settings.orderMessages?.[messageKey] || settings.orderMessages?.[event];

  if (!template) return null;

  return applyTemplate(template, {
    customer_name: customerName,
    items: itemsSummary,
    total: totalLine,
  });
}
