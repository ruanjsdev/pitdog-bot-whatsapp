import fs from 'fs/promises';
import path from 'path';

const settingsPath = path.resolve('data', 'settings.json');

const defaultSettings = {
  greetingMessage: "🍟 *Bem-vindo ao Pits Dog!* 🍔\n\nOlá! Que bom ter você por aqui.\n\nPara agilizar seu atendimento, você pode dar uma olhada em nosso cardápio e fazer seu pedido diretamente por este link:\n📍 {{menu_link}}\n\nSe precisar de ajuda, é só chamar! 😉",
  menuLink: "https://pitsdog.com.br",
  greetingCooldownHours: 4,
  botActive: true,
  pixKey: "41172968000182",
  pixReceiverName: "Pedrinho francisco ferreira araujo - stone ip S.A.",
};

function normalizeSettings(settings) {
  const mergedSettings = {
    ...defaultSettings,
    ...settings,
  };

  return {
    ...mergedSettings,
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
  return settings.greetingMessage.replace('{{menu_link}}', settings.menuLink);
}
