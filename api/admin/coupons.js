import { getAll, saveOne, deleteOne, setCors } from '../../lib/store.js';

function normalizar(item) {
  const code = String(item.code || '').trim().toUpperCase();
  if (!code) return null;
  return {
    code,
    active: item.active !== false,
    startsAt: item.startsAt || null,
    expiresAt: item.expiresAt || null,
    note: item.note || '',
    updatedAt: new Date().toISOString(),
  };
}

// GET    /api/admin/coupons          -> lista todos
// POST   /api/admin/coupons          -> cria/atualiza um cupom
// DELETE /api/admin/coupons?code=X   -> remove
export default async function handler(req, res) {
  setCors(res, '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const all = await getAll();
      return res.status(200).json({ coupons: Object.values(all).filter(Boolean) });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const coupon = normalizar(body);
      if (!coupon) return res.status(400).json({ error: 'code_required' });
      await saveOne(coupon);
      return res.status(200).json({ ok: true, coupon });
    }

    if (req.method === 'DELETE') {
      const code = String(req.query.code || '').trim().toUpperCase();
      if (!code) return res.status(400).json({ error: 'code_required' });
      await deleteOne(code);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (e) {
    console.error('Erro no admin:', e);
    return res.status(500).json({ error: 'server_error', detail: String(e) });
  }
}
