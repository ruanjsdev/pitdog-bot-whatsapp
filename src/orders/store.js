import fs from 'node:fs/promises';
import path from 'node:path';

const DB_PATH = path.resolve('data/orders.json');

async function ensureDb() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });

  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, '[]\n');
  }
}

async function readOrders() {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, 'utf8');
  return JSON.parse(raw || '[]');
}

async function writeOrders(orders) {
  await ensureDb();
  await fs.writeFile(DB_PATH, `${JSON.stringify(orders, null, 2)}\n`);
}

export async function listOrders() {
  const orders = await readOrders();
  return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function createOrder(input) {
  const orders = await readOrders();
  const now = new Date().toISOString();
  const id = Date.now().toString();
  const items = Array.isArray(input.items) ? input.items : [];
  const calculatedTotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity || item.quantidade || item.qtd || item.qty || 1);
    const price = Number(item.price || item.preco || 0);
    const additions = Array.isArray(item.additions || item.adicionais)
      ? item.additions || item.adicionais
      : [];
    const additionsTotal = additions.reduce((addSum, addition) => addSum + Number(addition.price || addition.preco || 0), 0);

    return sum + quantity * (price + additionsTotal);
  }, 0);

  const order = {
    id,
    code: input.code || id.slice(-5),
    customerName: input.customerName || '',
    customerPhone: input.customerPhone,
    delivery: input.delivery || input.tipoPedido || input.fulfillment || '',
    payment: input.payment || input.formaPagamento || input.paymentMethod || '',
    total: calculatedTotal || input.total || '',
    items,
    notes: input.notes || '',
    status: 'pedido_criado',
    createdAt: now,
    updatedAt: now,
  };

  orders.push(order);
  await writeOrders(orders);

  return order;
}

export async function updateOrderStatus(id, status) {
  const orders = await readOrders();
  const order = orders.find((item) => item.id === id);

  if (!order) {
    throw new Error('Pedido nao encontrado.');
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  await writeOrders(orders);

  return order;
}
