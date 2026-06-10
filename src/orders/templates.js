import { ORDER_EVENTS } from './events.js';
import { getSettings, formatGreeting } from '../config/settings.js';

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

  return [
    `💳 Pagamento via PIX\n\nRecebedor:\n${receiver}\n\nNa próxima mensagem vou enviar somente a chave PIX para facilitar copiar e colar.`,
    pixKey,
    total ? `Valor do PIX: ${total}\n\nApós realizar o pagamento, envie o comprovante por aqui para o caixa conferir.` : 'Após realizar o pagamento, envie o comprovante por aqui para o caixa conferir.',
  ];
}

export function buildOrderMessage(event, order) {
  const customerName = order.customerName ? `, ${order.customerName}` : '';
  const itemsSummary = buildItemsSummary(order);
  const totalLine = buildTotalLine(order);

  const messages = {
    [ORDER_EVENTS.created]:
      `🍔 Olá${customerName}! Recebemos seu pedido no Pits Dog.${itemsSummary}${totalLine}\n\n⏳ Seu pedido está aguardando análise e aprovação do caixa.\nAssim que for confirmado, avisamos por aqui. 😉`,

    [ORDER_EVENTS.approved]:
      '✅ Seu pedido foi aprovado pelo caixa e já está em preparo!\n\nEstamos caprichando por aqui. Daqui a pouco avisaremos a próxima etapa.',

    [ORDER_EVENTS.preparing]:
      '👨‍🍳 Seu pedido está em preparo!\n\nAssim que avançar, avisamos por aqui.',

    [ORDER_EVENTS.ready]:
      '🍟 Seu pedido está pronto!\n\nPode retirar no balcão ou aguardar nossa equipe chamar, conforme combinado.',

    [ORDER_EVENTS.outForDelivery]:
      '🛵 Seu pedido saiu para entrega!\n\n📍 Fique atento no endereço informado, por gentileza.',

    [ORDER_EVENTS.finished]:
      '✅ Pedido entregue com sucesso!\n\n🍔 Obrigado por comprar no Pits Dog. Volte sempre! ❤️',

    [ORDER_EVENTS.canceled]:
      '❌ Seu pedido foi cancelado.\n\nCaso tenha alguma dúvida, fale com nosso atendimento.',
  };

  return messages[event];
}
