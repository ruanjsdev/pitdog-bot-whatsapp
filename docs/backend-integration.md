# Integração do Backend Oficial com o Bot WhatsApp

Este bot fica rodando como um serviço HTTP local/servidor. O backend oficial do cardápio deve chamar o bot sempre que criar pedido ou mudar status.

## URL Base

Desenvolvimento:

```txt
http://localhost:3001
```

Produção:

```txt
http://IP-OU-DOMINIO-DO-SERVIDOR:3001
```

## Autenticação

Configure a mesma chave nos dois lados.

No `.env` do bot:

```env
BOT_API_TOKEN=uma-chave-grande-e-secreta
```

Em toda chamada do backend:

```http
Authorization: Bearer uma-chave-grande-e-secreta
```

## Verificar se o bot está online

```http
GET /health
```

Resposta:

```json
{
  "ok": true,
  "bot": {
    "connected": true,
    "hasSocket": true,
    "queuedMessages": 0,
    "sessionDir": "./auth/pits-dog"
  }
}
```

## Enviar evento de pedido

```http
POST /events/order
Content-Type: application/json
Authorization: Bearer uma-chave-grande-e-secreta
```

Payload recomendado:

```json
{
  "event": "pedido_criado",
  "order": {
    "id": "123",
    "customerName": "Manel",
    "customerPhone": "91985325884",
    "total": 58.9,
    "items": [
      {
        "quantity": 1,
        "name": "X-Tudão",
        "price": 34,
        "observation": "sem milho",
        "additions": [
          {
            "name": "Bacon",
            "price": 4
          },
          {
            "name": "Cheddar",
            "price": 3
          }
        ]
      },
      {
        "quantity": 1,
        "name": "Coca-Cola",
        "price": 6
      }
    ]
  }
}
```

Campos obrigatórios:

- `event`
- `order.customerName`
- `order.customerPhone`

Campos recomendados:

- `order.total`
- `order.items`
- `item.quantity`
- `item.name`
- `item.observation`
- `item.additions`

## Eventos aceitos

O backend pode mandar em português:

- `pedido_criado`
- `pedido_aprovado`
- `preparando`
- `pronto`
- `saiu_entrega`
- `finalizado`
- `cancelado`

Fluxo recomendado:

1. `pedido_criado`: pedido recebido. Se `order.payment`, `order.formaPagamento` ou campo equivalente for PIX, o bot envia uma segunda mensagem separada com a chave PIX cadastrada no painel.
2. `pedido_aprovado`: pedido aprovado pelo caixa e ja em preparo.
3. `saiu_entrega`: use somente para delivery.
4. `pronto`: use para retirada ou mesa quando o pedido estiver aguardando cliente/chamada.
5. `finalizado`: pedido concluido.

Também aceita aliases comuns:

- `created`, `received`, `pending`
- `approved`, `confirmed`, `accepted`
- `preparing`, `in_preparation`
- `ready`, `pronto_retirada`, `pronto_para_retirada`
- `out_for_delivery`, `delivery`, `dispatched`
- `delivered`, `finished`, `completed`
- `canceled`, `cancelled`

## Exemplo com fetch no backend Node.js

```js
const BOT_URL = process.env.WHATSAPP_BOT_URL || 'http://localhost:3001';
const BOT_API_TOKEN = process.env.BOT_API_TOKEN;

export async function notifyWhatsappBot(event, order) {
  const response = await fetch(`${BOT_URL}/events/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BOT_API_TOKEN}`,
    },
    body: JSON.stringify({ event, order }),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Falha ao notificar bot WhatsApp');
  }

  return data;
}
```

Uso:

```js
await notifyWhatsappBot('pedido_criado', pedido);
await notifyWhatsappBot('pedido_aprovado', pedido);
await notifyWhatsappBot('preparando', pedido);
await notifyWhatsappBot('saiu_entrega', pedido);
await notifyWhatsappBot('finalizado', pedido);
```

## Formatos de telefone aceitos

O bot aceita:

```txt
+55 91 98532-5884
91 98532-5884
91985325884
091985325884
```

Para DDD `91`, o bot tenta automaticamente com e sem o nono dígito.

## Rodar em produção com PM2

```bash
npm install
cp .env.example .env
npm install -g pm2
npm run pm2:start
pm2 save
```

Primeiro acesso: abrir os logs e escanear o QR Code.

```bash
pm2 logs pits-dog-whatsapp-bot
```

Se o WhatsApp desconectar com sessão inválida, o bot apaga a sessão salva e mostra um novo QR Code automaticamente.
