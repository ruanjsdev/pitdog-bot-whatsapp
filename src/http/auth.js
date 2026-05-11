import { env } from '../config/env.js';

export function requireApiToken(req, res, next) {
  if (!env.apiToken) {
    return res.status(503).json({
      ok: false,
      error: 'BOT_API_TOKEN nao configurado. Essa rota e para integracao com backend externo.',
    });
  }

  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.get('x-bot-token');

  if (token !== env.apiToken) {
    return res.status(401).json({
      ok: false,
      error: 'Token invalido.',
    });
  }

  return next();
}
