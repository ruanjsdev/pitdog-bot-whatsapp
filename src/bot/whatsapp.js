import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import fs from 'node:fs/promises';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { env } from '../config/env.js';
import { normalizePhoneCandidates } from '../utils/phone.js';
import { createMessageQueue } from '../utils/queue.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

let sock = null;
let connected = false;
let reconnecting = false;
let resettingSession = false;

const queue = createMessageQueue({
  intervalMs: env.messageIntervalMs,
  logger,
});

function getDisconnectCode(lastDisconnect) {
  const error = lastDisconnect?.error;

  if (error instanceof Boom) {
    return error.output.statusCode;
  }

  return error?.output?.statusCode;
}

function shouldResetSession(code) {
  return [
    DisconnectReason.loggedOut,
    DisconnectReason.badSession,
    DisconnectReason.forbidden,
    DisconnectReason.multideviceMismatch,
  ].includes(code);
}

async function resetSavedSession() {
  if (resettingSession) return;
  resettingSession = true;

  try {
    logger.warn({ sessionDir: env.sessionDir }, 'Sessao invalida. Apagando credenciais salvas para gerar novo QR Code.');
    await fs.rm(env.sessionDir, {
      recursive: true,
      force: true,
    });
  } finally {
    resettingSession = false;
  }
}

function reconnect(delayMs = 3000) {
  setTimeout(() => {
    void startWhatsapp().catch((error) => {
      logger.error({ err: error }, 'Falha ao reconectar WhatsApp');
    });
  }, delayMs);
}

export async function startWhatsapp() {
  if (reconnecting) return;
  reconnecting = true;

  const { state, saveCreds } = await useMultiFileAuthState(env.sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    browser: ['Pits Dog Bot', 'Chrome', '1.0.0'],
    logger: logger.child({ module: 'baileys' }),
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info('Escaneie o QR Code abaixo pelo WhatsApp do numero da loja.');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      connected = true;
      reconnecting = false;
      logger.info('WhatsApp conectado.');
    }

    if (connection === 'close') {
      connected = false;
      reconnecting = false;
      sock = null;

      const code = getDisconnectCode(lastDisconnect);

      logger.warn({ code }, 'WhatsApp desconectado.');

      if (shouldResetSession(code)) {
        await resetSavedSession();
        reconnect(1000);
        return;
      }

      reconnect();
    }
  });
}

export function getBotStatus() {
  return {
    connected,
    hasSocket: Boolean(sock),
    queuedMessages: queue.size(),
    sessionDir: env.sessionDir,
  };
}

export async function sendMessage(phone, message) {
  if (!sock || !connected) {
    throw new Error('WhatsApp ainda nao esta conectado.');
  }

  const candidates = normalizePhoneCandidates(phone, env.countryCode);
  let selectedJid = candidates[0];

  try {
    const matches = await sock.onWhatsApp(...candidates);
    const match = candidates
      .map((candidate) => matches?.find((item) => item.exists && item.jid === candidate))
      .find(Boolean);

    if (match?.jid) {
      selectedJid = match.jid;
    }

    logger.info({ phone, candidates, matches, selectedJid }, 'Telefone resolvido no WhatsApp.');
  } catch (error) {
    logger.warn({ err: error, phone, candidates }, 'Nao foi possivel consultar onWhatsApp. Tentando enviar direto.');
  }

  const orderedJids = [selectedJid, ...candidates.filter((jid) => jid !== selectedJid)];
  let lastError = null;

  for (const jid of orderedJids) {
    try {
      await sock.sendMessage(jid, { text: message });
      logger.info({ phone, jid, candidates }, 'Mensagem enviada.');
      return;
    } catch (error) {
      lastError = error;
      logger.warn({ err: error, phone, jid }, 'Falha ao enviar para este formato de numero.');
    }
  }

  throw lastError || new Error(`Nao foi possivel enviar mensagem para ${phone}.`);
}

export function enqueueMessage(phone, message) {
  return new Promise((resolve, reject) => {
    queue.add(async () => {
      try {
        await sendMessage(phone, message);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}
