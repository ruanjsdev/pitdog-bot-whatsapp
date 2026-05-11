import { env } from '../config/env.js';

export function requireAdminPin(req, res, next) {
  if (!env.adminPin) return next();

  const pin = req.get('x-admin-pin');

  if (pin !== env.adminPin) {
    return res.status(401).json({
      ok: false,
      error: 'PIN administrativo invalido.',
    });
  }

  return next();
}
