export const ORDER_EVENTS = {
  created: 'pedido_criado',
  approved: 'pedido_aprovado',
  preparing: 'preparando',
  outForDelivery: 'saiu_entrega',
  finished: 'finalizado',
  canceled: 'cancelado',
};

export const VALID_ORDER_EVENTS = new Set(Object.values(ORDER_EVENTS));

const EVENT_ALIASES = new Map([
  ['pedido_criado', ORDER_EVENTS.created],
  ['criado', ORDER_EVENTS.created],
  ['recebido', ORDER_EVENTS.created],
  ['created', ORDER_EVENTS.created],
  ['pending', ORDER_EVENTS.created],
  ['received', ORDER_EVENTS.created],

  ['pedido_aprovado', ORDER_EVENTS.approved],
  ['aprovado', ORDER_EVENTS.approved],
  ['confirmado', ORDER_EVENTS.approved],
  ['approved', ORDER_EVENTS.approved],
  ['confirmed', ORDER_EVENTS.approved],
  ['accepted', ORDER_EVENTS.approved],

  ['preparando', ORDER_EVENTS.preparing],
  ['em_preparo', ORDER_EVENTS.preparing],
  ['preparing', ORDER_EVENTS.preparing],
  ['in_preparation', ORDER_EVENTS.preparing],

  ['saiu_entrega', ORDER_EVENTS.outForDelivery],
  ['saiu_para_entrega', ORDER_EVENTS.outForDelivery],
  ['em_entrega', ORDER_EVENTS.outForDelivery],
  ['out_for_delivery', ORDER_EVENTS.outForDelivery],
  ['delivery', ORDER_EVENTS.outForDelivery],
  ['dispatched', ORDER_EVENTS.outForDelivery],

  ['finalizado', ORDER_EVENTS.finished],
  ['entregue', ORDER_EVENTS.finished],
  ['delivered', ORDER_EVENTS.finished],
  ['finished', ORDER_EVENTS.finished],
  ['completed', ORDER_EVENTS.finished],

  ['cancelado', ORDER_EVENTS.canceled],
  ['cancelled', ORDER_EVENTS.canceled],
  ['canceled', ORDER_EVENTS.canceled],
]);

export function normalizeOrderEvent(event) {
  const normalized = String(event || '').trim().toLowerCase();
  return EVENT_ALIASES.get(normalized) || null;
}
