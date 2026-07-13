import { getOne, isCurrentlyValid, setCors } from '../lib/store.js';

// GET /api/validate?code=CUPOM10
// Resposta: { valid: true, code: "CUPOM10", discount: 10 }  ou  { valid: false }
export default async function handler(req, res) {
  setCors(res, process.env.ALLOWED_ORIGIN || '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')
    return res.status(405).json({ valid: false, error: 'method_not_allowed' });

  const code = String(req.query.code || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ valid: false, error: 'missing_code' });

  try {
    const c = await getOne(code);
    if (c && isCurrentlyValid(c)) {
      return res
        .status(200)
        .json({ valid: true, code: c.code, discount: c.discount ?? null });
    }
    return res.status(200).json({ valid: false });
  } catch (e) {
    console.error('Erro na validação:', e);
    return res.status(500).json({ valid: false, error: 'server_error' });
  }
}
