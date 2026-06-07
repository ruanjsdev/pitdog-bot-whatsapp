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

export async function buildGreetingMessage() {
  const settings = await getSettings();
  return formatGreeting(settings);
}

export function buildOrderMessage(event, order) {
  const customerName = order.customerName ? `, ${order.customerName}` : '';
  const itemsSummary = buildItemsSummary(order);
  const totalLine = buildTotalLine(order);

  const messages = {
    [ORDER_EVENTS.created]:
      `🍔 Olá${customerName}! Recebemos seu pedido no Pits Dog.${itemsSummary}${totalLine}\n\n⏳ Seu pedido está aguardando análise e aprovação do caixa.\nAssim que for confirmado, avisamos por aqui. 😉`,

    [ORDER_EVENTS.approved]:
      '✅ Seu pedido foi confirmado pelo caixa!\n\nDaqui a pouco avisaremos quando entrar em preparo.',

    [ORDER_EVENTS.preparing]:
      '👨‍🍳 Seu pedido entrou em preparo!\n\nEstamos caprichando por aqui. Daqui a pouco avisaremos a próxima etapa.',

    [ORDER_EVENTS.ready]:
      '🍟 Seu pedido está pronto!\n\nPode retirar no balcão ou aguarde nossa equipe chamar, conforme combinado.',

    [ORDER_EVENTS.outForDelivery]:
      '🛵 Seu pedido saiu para entrega!\n\n📍 Fique atento no endereço informado, por gentileza.',

    [ORDER_EVENTS.finished]:
      '✅ Pedido entregue com sucesso!\n\n🍔 Obrigado por comprar no Pits Dog. Volte sempre! ❤️',

    [ORDER_EVENTS.canceled]:
      '❌ Seu pedido foi cancelado.\n\nCaso tenha alguma dúvida, fale com nosso atendimento.',
  };

  return messages[event];
}
