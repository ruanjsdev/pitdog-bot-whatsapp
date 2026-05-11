const form = document.querySelector('#orderForm');
const feedback = document.querySelector('#feedback');
const ordersEl = document.querySelector('#orders');
const botStatus = document.querySelector('#botStatus');
const refreshButton = document.querySelector('#refreshButton');
const menuEl = document.querySelector('#menu');
const cartItemsEl = document.querySelector('#cartItems');
const cartTotalEl = document.querySelector('#cartTotal');

const menu = [
  {
    category: 'Burgues',
    items: [
      ['X-Salada', 10],
      ['Simples', 16],
      ['X Calabresa', 20],
      ['X Bacon', 20],
      ['X Egg', 20],
      ['Pits Mac', 20],
      ['X Egg Bacon', 22],
      ['Crispy', 25],
      ['Pits Burguer', 27],
      ['X-Tudo', 34],
      ['Aloprado', 40],
    ],
  },
  {
    category: 'Cachorro quente',
    items: [
      ['Hot Dog', 8],
      ['Dogão', 9],
      ['Misto', 8],
      ['Calabresa', 10],
      ['Bacon', 10],
      ['Carne Seca', 10],
      ['Calabresa + Salsicha', 12],
      ['Carne Seca + Calabresa', 13],
      ['Pits Dog', 16],
      ['Tudão Cachorro Quente', 22],
    ],
  },
  {
    category: 'Combos',
    items: [
      ['Combo Barca', 32],
      ['Combo Casal', 50],
      ['Combo Amigos', 70],
      ['Combo Família', 90],
    ],
  },
  {
    category: 'Bebidas',
    items: [
      ['Água', 4],
      ['Suco no Copo 320ml', 7],
      ['Refrigerante Lata', 6],
      ['Refrigerante 1L', 10],
      ['Refrigerante 2L', 14],
      ['Corona', 12],
      ['Heineken', 12],
      ['Skol 600ml', 10],
    ],
  },
  {
    category: 'Porção de batata',
    items: [
      ['Batata Simples', 15],
      ['Batata com Cheddar e Bacon', 22],
    ],
  },
  {
    category: 'Adicionais',
    isAddition: true,
    items: [
      ['Salsicha', 2],
      ['Calabresa', 3],
      ['Ovo', 2],
      ['Cheddar', 3],
      ['Carne Seca', 3],
      ['Queijo Mussarela', 4],
      ['Molho Barbecue', 3],
      ['Bacon', 4],
      ['Carne de Hambúrguer', 6],
      ['Cebola Caramelizada', 3],
    ],
  },
];

const statuses = [
  ['pedido_aprovado', 'Aprovar'],
  ['preparando', 'Preparando'],
  ['saiu_entrega', 'Saiu entrega'],
  ['finalizado', 'Finalizar'],
  ['cancelado', 'Cancelar'],
];

let cart = [];
let selectedCartId = null;

function getPin() {
  const pin = new FormData(form).get('pin') || localStorage.getItem('adminPin') || '';
  if (pin) localStorage.setItem('adminPin', pin);
  return pin;
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': getPin(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Falha na requisicao.');
  }

  return data;
}

function formatMoney(value) {
  if (!value) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function itemUnitTotal(item) {
  const additionsTotal = item.additions.reduce((sum, addition) => sum + addition.price, 0);
  return item.price + additionsTotal;
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + item.quantity * itemUnitTotal(item), 0);
}

function addProduct(name, price, isAddition = false) {
  if (isAddition) {
    const selectedItem = cart.find((item) => item.id === selectedCartId);

    if (!selectedItem) {
      feedback.textContent = 'Selecione um lanche no carrinho antes de adicionar extra.';
      return;
    }

    selectedItem.additions.push({ name, price });
    renderCart();
    return;
  }

  const existing = cart.find((item) => item.name === name && item.additions.length === 0 && !item.observation);

  if (existing) {
    existing.quantity += 1;
    selectedCartId = existing.id;
  } else {
    const item = {
      id: crypto.randomUUID(),
      name,
      price,
      quantity: 1,
      observation: '',
      additions: [],
    };

    cart.push(item);
    selectedCartId = item.id;
  }

  renderCart();
}

function renderMenu() {
  menuEl.innerHTML = menu.map((section) => `
    <section class="menuSection">
      <h3>${section.category}</h3>
      <div class="menuItems">
        ${section.items.map(([name, price]) => `
          <button type="button" class="menuItem" data-name="${escapeHtml(name)}" data-price="${price}" data-addition="${section.isAddition ? 'true' : 'false'}">
            <span>${escapeHtml(name)}</span>
            <strong>${formatMoney(price)}</strong>
          </button>
        `).join('')}
      </div>
    </section>
  `).join('');
}

function renderCart() {
  cartTotalEl.textContent = formatMoney(cartTotal());

  if (!cart.length) {
    cartItemsEl.innerHTML = '<p class="orderMeta">Escolha os produtos no cardapio.</p>';
    return;
  }

  cartItemsEl.innerHTML = cart.map((item) => `
    <article class="cartItem ${item.id === selectedCartId ? 'selected' : ''}" data-cart-id="${item.id}">
      <button type="button" class="cartSelect" data-action="select">Selecionar</button>
      <div>
        <strong>${item.quantity}x ${escapeHtml(item.name)}</strong>
        <span>${formatMoney(item.quantity * itemUnitTotal(item))}</span>
      </div>
      ${item.additions.length ? `
        <ul>
          ${item.additions.map((addition) => `<li>+ ${escapeHtml(addition.name)}</li>`).join('')}
        </ul>
      ` : ''}
      <input class="itemObs" data-action="obs" value="${escapeHtml(item.observation)}" placeholder="Obs do item, ex: sem milho">
      <div class="cartControls">
        <button type="button" data-action="minus">-</button>
        <button type="button" data-action="plus">+</button>
        <button type="button" data-action="remove">Remover</button>
      </div>
    </article>
  `).join('');
}

function orderItemsForSubmit() {
  return cart.map((item) => ({
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    observation: item.observation,
    additions: item.additions,
  }));
}

function renderOrders(orders) {
  if (!orders.length) {
    ordersEl.innerHTML = '<p class="orderMeta">Nenhum pedido criado ainda.</p>';
    return;
  }

  ordersEl.innerHTML = orders.map((order) => `
    <article class="order">
      <strong>#${order.code} - ${order.customerName || 'Cliente'}</strong>
      <div class="orderMeta">
        WhatsApp: ${order.customerPhone}<br>
        Total: ${formatMoney(order.total)}<br>
        Status: ${order.status}
      </div>
      <div class="actions">
        ${statuses.map(([status, label]) => `
          <button type="button" data-id="${order.id}" data-status="${status}">${label}</button>
        `).join('')}
      </div>
    </article>
  `).join('');
}

async function loadOrders() {
  const data = await request('/api/orders');
  renderOrders(data.orders);
}

async function loadHealth() {
  const response = await fetch('/health');
  const data = await response.json();
  botStatus.textContent = data.bot.connected ? 'WhatsApp conectado' : 'WhatsApp desconectado';
}

menuEl.addEventListener('click', (event) => {
  const button = event.target.closest('.menuItem');
  if (!button) return;

  addProduct(button.dataset.name, Number(button.dataset.price), button.dataset.addition === 'true');
});

cartItemsEl.addEventListener('click', (event) => {
  const cartItemEl = event.target.closest('.cartItem');
  const actionButton = event.target.closest('button[data-action]');
  if (!cartItemEl || !actionButton) return;

  const item = cart.find((cartItem) => cartItem.id === cartItemEl.dataset.cartId);
  if (!item) return;

  selectedCartId = item.id;

  if (actionButton.dataset.action === 'plus') item.quantity += 1;
  if (actionButton.dataset.action === 'minus') item.quantity = Math.max(1, item.quantity - 1);
  if (actionButton.dataset.action === 'remove') cart = cart.filter((cartItem) => cartItem.id !== item.id);

  if (!cart.some((cartItem) => cartItem.id === selectedCartId)) {
    selectedCartId = cart[0]?.id || null;
  }

  renderCart();
});

cartItemsEl.addEventListener('input', (event) => {
  if (!event.target.matches('.itemObs')) return;

  const cartItemEl = event.target.closest('.cartItem');
  const item = cart.find((cartItem) => cartItem.id === cartItemEl.dataset.cartId);
  if (!item) return;

  item.observation = event.target.value;
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!cart.length) {
    feedback.textContent = 'Escolha pelo menos um produto.';
    return;
  }

  feedback.textContent = 'Criando pedido...';

  const data = Object.fromEntries(new FormData(form).entries());
  data.items = orderItemsForSubmit();

  try {
    await request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const pin = getPin();
    feedback.textContent = 'Pedido criado e mensagem enviada.';
    form.reset();
    form.elements.pin.value = pin;
    cart = [];
    selectedCartId = null;
    renderCart();
    await loadOrders();
    await loadHealth();
  } catch (error) {
    feedback.textContent = error.message;
  }
});

ordersEl.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-id]');
  if (!button) return;

  button.disabled = true;
  button.textContent = 'Enviando...';

  try {
    await request(`/api/orders/${button.dataset.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: button.dataset.status }),
    });

    await loadOrders();
  } catch (error) {
    alert(error.message);
    await loadOrders();
  }
});

refreshButton.addEventListener('click', async () => {
  await loadOrders();
  await loadHealth();
});

renderMenu();
renderCart();
await loadHealth();
await loadOrders();
