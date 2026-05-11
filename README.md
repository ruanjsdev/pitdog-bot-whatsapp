# Bot WhatsApp - Pits Dog

Bot simples em Node.js usando Baileys para avisar clientes sobre o status do pedido no delivery.

> Importante: Baileys usa WhatsApp Web e nao e API oficial da Meta. Use com cuidado, sem spam, sem disparo em massa e com um numero dedicado da loja.

## Requisitos

- Node.js 20 ou superior.
- Um numero de WhatsApp da loja.
- Backend/site/painel capaz de chamar uma URL HTTP quando o pedido mudar de status.

## Instalar

```bash
npm install
cp .env.example .env
```

Edite o `.env` e troque principalmente:

```env
BOT_API_TOKEN=um-token-grande-e-secreto
STORE_PHONE=5591999999999
```

Se voce for usar apenas o painel local, o `BOT_API_TOKEN` pode ficar vazio por enquanto. Ele so sera necessario quando outro sistema/backend chamar o bot.

## Rodar e conectar pelo QR Code

```bash
npm run dev
```

Na primeira execucao, o terminal vai mostrar um QR Code. No WhatsApp da loja:

1. Abra `Aparelhos conectados`.
2. Toque em `Conectar um aparelho`.
3. Escaneie o QR Code.

A sessao fica salva em `auth/pits-dog`, definida por `SESSION_DIR`. Faca backup dessa pasta se for mover o bot para outro computador/servidor. Nao envie essa pasta para GitHub.

## Status do bot

```bash
curl http://localhost:3001/health
```

## Usando sem backend

Se voce ainda nao tem backend/site/admin pronto, use o painel local que ja vem neste projeto:

```bash
npm run dev
```

Depois abra:

```txt
http://localhost:3001
```

Nesse painel voce consegue:

- criar um pedido manualmente;
- mandar a mensagem de `pedido_criado`;
- aprovar o pedido;
- marcar como `preparando`;
- marcar como `saiu_entrega`;
- finalizar ou cancelar.

Os pedidos ficam salvos em `data/orders.json`. Isso e simples e serve para comecar/testar. Quando o site e o painel administrativo reais existirem, eles podem chamar a rota `POST /events/order`.

## Integração com o site oficial

O contrato pronto para o backend do cardapio esta em:

```txt
docs/backend-integration.md
```

Essa integracao usa `POST /events/order` com `Authorization: Bearer <BOT_API_TOKEN>`.

## Como o backend chama o bot

Quando um pedido for criado ou mudar de status, o backend deve chamar:

```bash
curl -X POST http://localhost:3001/events/order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer um-token-grande-e-secreto" \
  -d '{
    "event": "pedido_criado",
    "order": {
      "id": 123,
      "code": "123",
      "customerName": "Maria",
      "customerPhone": "91999999999",
      "total": 42.9
    }
  }'
```

Eventos aceitos:

- `pedido_criado`
- `pedido_aprovado`
- `preparando`
- `saiu_entrega`
- `finalizado`
- `cancelado`

## Exemplo no backend Node/Express

```js
async function notifyBot(event, order) {
  await fetch('http://localhost:3001/events/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
    },
    body: JSON.stringify({ event, order }),
  });
}

// Ao criar o pedido:
await notifyBot('pedido_criado', pedido);

// Ao aprovar no painel admin:
await notifyBot('pedido_aprovado', pedido);
```

## Cuidados importantes

- Nao use para mensagem em massa. Envie apenas mensagens transacionais do pedido.
- Avise o cliente no cardapio que ele recebera atualizacoes por WhatsApp.
- Use intervalo entre mensagens. O projeto ja usa `MESSAGE_INTERVAL_MS`.
- Salve e proteja a pasta `auth/`, porque ela contem a sessao do WhatsApp.
- Se desconectar, o bot tenta reconectar sozinho.
- Se aparecer logout definitivo, o bot apaga a sessao salva sozinho e mostra um novo QR Code.
- Use um numero dedicado da loja, nao o WhatsApp pessoal do dono.
- O `npm audit` pode apontar vulnerabilidade transitiva dentro do Baileys/libsignal. Acompanhe atualizacoes do Baileys antes de usar em producao.

## Como deixar facil para o dono usar depois

No comeco, rode com `npm run start`. Depois, as opcoes mais simples sao:

- Criar um atalho `.bat`/`.sh` que inicia o bot.
- Usar PM2 para manter o processo ligado e reiniciar se cair.
- Colocar em um mini PC/VPS com Node 20 e PM2.
- Criar uma tela web pequena mostrando `conectado/desconectado`, ultimo QR Code e historico de mensagens.

Com PM2:

```bash
npm install -g pm2
pm2 start src/index.js --name pits-dog-whatsapp-bot
pm2 save
```
