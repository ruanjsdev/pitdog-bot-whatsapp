import { getSettings } from '../config/settings.js';
import { buildGreetingMessage } from '../orders/templates.js';

// Em produção, isso pode ser movido para um JSON para não perder ao reiniciar
const lastGreetings = new Map(); 

export async function handleIncomingMessage(sock, m) {
  if (!m.messages[0].message || m.messages[0].key.fromMe) return;

  const message = m.messages[0];
  const sender = message.key.remoteJid;
  
  // Ignora grupos
  if (sender.endsWith('@g.us')) return;

  const settings = await getSettings();
  if (!settings.botActive) return;

  const now = Date.now();
  const cooldownMs = settings.greetingCooldownHours * 60 * 60 * 1000;
  const lastSeen = lastGreetings.get(sender) || 0;

  if (now - lastSeen > cooldownMs) {
    console.log(`[Bot] Enviando saudação para: ${sender}`);
    
    const greeting = await buildGreetingMessage();
    await sock.sendMessage(sender, { text: greeting });

    // Atualiza o tempo da última saudação enviada para este número
    lastGreetings.set(sender, now);
  }
}