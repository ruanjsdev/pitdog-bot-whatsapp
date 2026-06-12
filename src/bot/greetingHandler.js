import { getSettings } from '../config/settings.js';
import { buildGreetingMessage } from '../orders/templates.js';
import fs from 'node:fs/promises';
import path from 'node:path';

const greetingsPath = path.resolve('data', 'greetings.json');
const lastGreetings = new Map();
let greetingsLoaded = false;
let saveGreetingQueue = Promise.resolve();

function normalizeSender(sender = '') {
  return sender
    .replace(/:\d+@/, '@')
    .replace(/@s\.whatsapp\.net$/, '@c.us')
    .trim();
}

async function loadGreetings() {
  if (greetingsLoaded) return;

  greetingsLoaded = true;

  try {
    const data = await fs.readFile(greetingsPath, 'utf-8');
    const savedGreetings = JSON.parse(data);

    Object.entries(savedGreetings).forEach(([sender, timestamp]) => {
      const greetingTime = Number(timestamp);

      if (Number.isFinite(greetingTime)) {
        lastGreetings.set(normalizeSender(sender), greetingTime);
      }
    });
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn('[Bot] Nao foi possivel carregar historico de saudacoes.', error);
    }
  }
}

async function saveGreetings() {
  const payload = Object.fromEntries(lastGreetings.entries());

  saveGreetingQueue = saveGreetingQueue
    .catch(() => undefined)
    .then(async () => {
      await fs.mkdir(path.dirname(greetingsPath), { recursive: true });
      await fs.writeFile(greetingsPath, JSON.stringify(payload, null, 2));
    })
    .catch((error) => {
      console.warn('[Bot] Nao foi possivel salvar historico de saudacoes.', error);
    });

  await saveGreetingQueue;
}

function pruneOldGreetings(now, cooldownMs) {
  const maxAgeMs = Math.max(cooldownMs * 8, 24 * 60 * 60 * 1000);

  for (const [sender, timestamp] of lastGreetings.entries()) {
    if (now - timestamp > maxAgeMs) {
      lastGreetings.delete(sender);
    }
  }
}

async function handleSingleIncomingMessage(sock, message) {
  if (!message.message || message.key.fromMe) return;

  const sender = message.key.remoteJid;

  if (!sender || sender.endsWith('@g.us')) return;

  const settings = await getSettings();
  if (!settings.botActive) return;

  const now = Date.now();
  const cooldownHours = Number(settings.greetingCooldownHours) || 3;
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const normalizedSender = normalizeSender(sender);
  const lastSeen = lastGreetings.get(normalizedSender) || 0;

  if (now - lastSeen < cooldownMs) {
    console.log(`[Bot] Saudacao ignorada para ${normalizedSender}. Cooldown ativo.`);
    return;
  }

  lastGreetings.set(normalizedSender, now);
  pruneOldGreetings(now, cooldownMs);
  await saveGreetings();

  console.log(`[Bot] Enviando saudação para: ${normalizedSender}`);

  const greeting = await buildGreetingMessage();
  await sock.sendMessage(sender, { text: greeting });
}

export async function handleIncomingMessage(sock, m) {
  await loadGreetings();

  for (const message of m.messages ?? []) {
    await handleSingleIncomingMessage(sock, message);
  }
}
