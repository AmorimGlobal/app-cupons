/* ============================================================================
   SUBSTITUIÇÃO NO FORMULÁRIO DO SITE (Webflow)
   ----------------------------------------------------------------------------
   O QUE MUDA: hoje os cupons ficam numa lista fixa dentro do código
   (const cuponsValidos = [...]). Agora a validação passa a consultar a API
   no Vercel, então não é mais preciso editar o site para mudar cupons.

   COMO APLICAR (dentro do <script> que contém a lógica do cupom):

   1) APAGUE todo o bloco  "const cuponsValidos = [ ... ];"  (a lista inteira).

   2) LOGO ABAIXO de  "let cupomAplicadoFinal = '';"  cole a linha do API_BASE
      e a função "validarCupomAPI" (abaixo). Troque a URL pela do SEU projeto.

   3) SUBSTITUA o handler  "btnValidar.addEventListener('click', function () {...})"
      pela versão async abaixo.

   Nada mais precisa mudar: aplicarCupom, removerCupom e o envio ao Bitrix
   continuam iguais.
   ============================================================================ */


/* ---- 1) COLE ISTO logo abaixo de:  let cupomAplicadoFinal = '';  ---- */

const API_BASE = 'https://SEU-APP.vercel.app'; // <<< TROQUE pela URL do seu projeto no Vercel

async function validarCupomAPI(codigo) {
  try {
    const r = await fetch(`${API_BASE}/api/validate?code=${encodeURIComponent(codigo)}`);
    const data = await r.json();
    return !!(data && data.valid === true);
  } catch (e) {
    console.error('Erro ao validar cupom:', e);
    return false;
  }
}


/* ---- 2) SUBSTITUA o antigo btnValidar.addEventListener('click', ...) por este ---- */

btnValidar.addEventListener('click', async function () {
  if (btnValidar.dataset.estado === 'remover') {
    removerCupom();
    return;
  }

  const digitado = cupomInput.value.trim().toUpperCase();
  if (digitado === '') {
    msgCupom.style.display = 'none';
    return;
  }

  // Feedback de "validando"
  const textoOriginal = btnValidar.innerText;
  btnValidar.disabled = true;
  btnValidar.innerText = 'Validando...';

  const valido = await validarCupomAPI(digitado);

  btnValidar.disabled = false;

  if (valido) {
    aplicarCupom(digitado);
  } else {
    btnValidar.innerText = textoOriginal;
    cupomInput.style.borderColor = '#dc3545';
    btnValidar.style.backgroundColor = '#dc3545';
    btnValidar.innerText = 'Inválido!';
    cupomAplicadoFinal = '';

    msgCupom.innerText = '✕ Cupom inválido ou expirado.';
    msgCupom.style.color = '#dc3545';
    msgCupom.style.display = 'block';

    cupomInput.classList.remove('shake-anim');
    void cupomInput.offsetWidth;
    cupomInput.classList.add('shake-anim');
  }
});
