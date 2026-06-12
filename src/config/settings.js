import fs from 'fs/promises';
import path from 'path';

const settingsPath = path.resolve('data', 'settings.json');
const officialMenuLink = "https://pitsdog-cardapio-oficial.onrender.com";

const defaultSettings = {
  greetingMessage: "🍟 *Bem-vindo ao Pits Dog!* 🍔\n\nOlá! Que bom ter você por aqui.\n\nPara agilizar seu atendimento, você pode dar uma olhada em nosso cardápio e fazer seu pedido diretamente por este link:\n📍 {{menu_link}}\n\nSe precisar de ajuda, é só chamar! 😉",
  menuLink: officialMenuLink,
  greetingCooldownHours: 4,
  botActive: true,
  pixKey: "41172968000182",
  pixPaymentMessage: "💳 Pagamento via PIX\n\nRecebedor:\n{{pix_receiver}}\n\nNa próxima mensagem vou enviar somente a chave PIX para facilitar copiar e colar.",
  pixProofMessage: "Após realizar o pagamento, envie o comprovante por aqui para o caixa conferir.",
  pixReceiverName: "Pedrinho francisco ferreira araujo - stone ip S.A.",
  orderMessages: {
    created: "🍔 Olá{{customer_name}}! Recebemos seu pedido no Pits Dog.{{items}}{{total}}\n\n⏳ Seu pedido está aguardando análise e aprovação do caixa.\nAssim que for confirmado, avisamos por aqui. 😉",
    approved: "✅ Seu pedido foi aprovado pelo caixa e já está em preparo!\n\nEstamos caprichando por aqui. Daqui a pouco avisaremos a próxima etapa.",
    preparing: "👨‍🍳 Seu pedido está em preparo!\n\nAssim que avançar, avisamos por aqui.",
    ready: "🍟 Seu pedido está pronto!\n\nPode retirar no balcão ou aguardar nossa equipe chamar, conforme combinado.",
    outForDelivery: "🛵 Seu pedido saiu para entrega!\n\n📍 Fique atento no endereço informado, por gentileza.",
    finished: "✅ Pedido entregue com sucesso!\n\n🍔 Obrigado por comprar no Pits Dog. Volte sempre! ❤️",
    canceled: "❌ Seu pedido foi cancelado.\n\nCaso tenha alguma dúvida, fale com nosso atendimento.",
  },
};

function normalizeSettings(settings) {
  const mergedSettings = {
    ...defaultSettings,
    ...settings,
  };
  return {
    ...mergedSettings,
    menuLink: officialMenuLink,
    orderMessages: {
      ...defaultSettings.orderMessages,
      ...(mergedSettings.orderMessages || {}),
    },
    pixPaymentMessage: String(mergedSettings.pixPaymentMessage || '').trim() || defaultSettings.pixPaymentMessage,
    pixProofMessage: String(mergedSettings.pixProofMessage || '').trim() || defaultSettings.pixProofMessage,
    pixKey: String(mergedSettings.pixKey || '').trim() || defaultSettings.pixKey,
    pixReceiverName: String(mergedSettings.pixReceiverName || '').trim() || defaultSettings.pixReceiverName,
  };
}

export async function getSettings() {
  try {
    const data = await fs.readFile(settingsPath, 'utf-8');
    return normalizeSettings(JSON.parse(data));
  } catch {
    // Se não existir, cria com os padrões
    await saveSettings(defaultSettings);
    return defaultSettings;
  }
}

export async function saveSettings(newSettings) {
  const settings = normalizeSettings(newSettings);

  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  return settings;
}

export function formatGreeting(settings) {
  const normalizedSettings = normalizeSettings(settings);

  return normalizedSettings.greetingMessage.replace('{{menu_link}}', normalizedSettings.menuLink);
}
