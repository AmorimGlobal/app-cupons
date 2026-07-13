import { readFileSync } from 'fs';
import { join } from 'path';

// O Bitrix, no modo "Servidor", faz um POST no caminho do manipulador.
// Uma página estática só responde a GET, por isso ficava em branco.
// Aqui devolvemos o painel (HTML) tanto para GET quanto para POST.
let cachedHtml = null;

export default function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  try {
    if (!cachedHtml) {
      cachedHtml = readFileSync(join(process.cwd(), 'public', 'index.html'), 'utf8');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Garante que pode ser exibido dentro do iframe do Bitrix
    res.removeHeader('X-Frame-Options');
    res.status(200).send(cachedHtml);
  } catch (e) {
    res.status(500).send('Erro ao carregar o painel: ' + String(e));
  }
}
