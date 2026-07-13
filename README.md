# Gerenciador de Cupons — Bitrix24 + Vercel

Painel para a equipe gerenciar os cupons de desconto do site **sem mexer em código**:
ativar/desativar, definir desconto e definir data e hora de validade (início e fim).

## Como funciona (visão geral)

```
   SITE (Webflow)                 VERCEL                        UPSTASH (banco)
   formulário  ──consulta──►  /api/validate  ──lê/escreve──►  Redis (cupons)
                                     ▲
   BITRIX24                          │
   app "Gerenciador de Cupons"  ──►  painel (index.html) + /api/admin/coupons
   (equipe gerencia por aqui)
```

- O **site** deixa de ter a lista fixa e passa a perguntar à API se o cupom é válido.
- A **equipe** acessa o painel de dentro do Bitrix24 e gerencia tudo.
- Os cupons ficam guardados num **banco Redis gratuito (Upstash)**.

---

## Passo 1 — Subir no GitHub

1. Crie um repositório novo (pode ser privado), ex.: `gerenciador-cupons`.
2. Envie **todos os arquivos desta pasta** para o repositório.
   (Se preferir pelo site do GitHub: "Add file" → "Upload files" → arraste tudo.)

## Passo 2 — Criar o banco (Upstash Redis, gratuito)

1. Acesse **https://upstash.com** e crie uma conta (pode entrar com o GitHub).
2. Crie um banco: **Create Database** → tipo **Redis** → região mais próxima (ex.: São Paulo / us-east).
3. Na tela do banco, procure a seção **REST API**. Anote os dois valores:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

> Dica: dá para criar o banco direto pelo Vercel também (Passo 3, aba **Storage** →
> **Marketplace** → Upstash). Nesse caso as variáveis já entram sozinhas no projeto.

## Passo 3 — Publicar no Vercel

1. Acesse **https://vercel.com** e entre com o GitHub.
2. **Add New… → Project** e selecione o repositório `gerenciador-cupons`.
3. Não precisa mudar nada em build. Antes de clicar em **Deploy**, abra
   **Environment Variables** e adicione:

   | Nome                         | Valor                                            |
   |------------------------------|--------------------------------------------------|
   | `UPSTASH_REDIS_REST_URL`     | (o URL do Upstash)                               |
   | `UPSTASH_REDIS_REST_TOKEN`   | (o token do Upstash)                             |
   | `ADMIN_PASSWORD`             | uma senha à sua escolha (a da equipe no painel)  |
   | `ALLOWED_ORIGIN`             | `https://SEU-SITE.com.br` (ou `*` p/ testar)     |

4. Clique em **Deploy**. Ao final você terá uma URL, ex.: `https://gerenciador-cupons.vercel.app`.
5. Teste abrindo essa URL no navegador — deve aparecer a tela de senha do painel.
   Entre com a `ADMIN_PASSWORD` e clique em **Importar lista antiga** para trazer os cupons atuais.

> Se você criou o banco pela aba Storage do Vercel, as variáveis do Upstash
> já existem (podem ter o prefixo `KV_...`) — o código aceita os dois nomes.
> Ainda assim, adicione manualmente `ADMIN_PASSWORD` e `ALLOWED_ORIGIN`.

## Passo 4 — Registrar o app no Bitrix24

No Bitrix: **Aplicativos → Desenvolvedor → Outros → Aplicativo local**
(a mesma tela do print). Preencha:

- **Tipo:** `Estático` (a página é carregada direto, sem servidor de OAuth).
  *Se por algum motivo a página não abrir, tente `Servidor`.*
- **Seu caminho do manipulador:** `https://SEU-APP.vercel.app/`
- **Caminho de instalação inicial:** deixe em branco.
- **Apenas script (sem interface):** deixe **desmarcado**.
- **Suporta BitrixMobile:** opcional.
- **Texto do item de menu:** `Gerenciador de Cupons`
- **Atribuir permissões:** este app não chama a API do Bitrix, então não exige
  permissões. Pode deixar `CRM (crm)` que já está lá — não atrapalha.

Clique em **Salvar**. O app passa a aparecer no menu; ao abrir, pedirá a senha
(a `ADMIN_PASSWORD`).

## Passo 5 — Atualizar o formulário do site

Abra o arquivo **`trecho-para-o-site.js`** desta pasta e siga as 3 instruções que
estão comentadas lá:

1. Apagar a lista fixa `const cuponsValidos = [ ... ];`
2. Colar a `API_BASE` + a função `validarCupomAPI` (troque a URL pela do seu Vercel).
3. Substituir o antigo clique do botão "Validar" pela nova versão `async`.

O resto do formulário (envio ao Bitrix, cupom via URL, etc.) continua igual.
O campo enviado ao Bitrix (`cupomAplicadoFinal`) não muda.

## Passo 6 — Conferir

- No painel, crie um cupom de teste com validade curta e teste no site.
- Coloque em `ALLOWED_ORIGIN` o domínio exato do site (ex.: `https://amorimglobal.com.br`).
  Enquanto testa, pode deixar `*`.

---

## Uso no dia a dia (para a equipe)

- **Novo cupom:** preencha código, opcionalmente desconto/datas, e salve.
- **Validade:** "Válido a partir de" e "Válido até" usam o **horário de Brasília**.
  Campos vazios = sem restrição (vale desde já / sem prazo).
- **Desativar sem apagar:** botão **Desativar** (útil para pausar uma campanha).
- **Status:** Ativo, Agendado (ainda não começou), Expirado ou Desativado.

## Variáveis de ambiente (resumo)

| Variável                   | Obrigatória | Função                                              |
|----------------------------|:-----------:|-----------------------------------------------------|
| `UPSTASH_REDIS_REST_URL`   | sim         | Endereço do banco Redis                             |
| `UPSTASH_REDIS_REST_TOKEN` | sim         | Token do banco Redis                                |
| `ADMIN_PASSWORD`           | sim         | Senha de acesso ao painel                           |
| `ALLOWED_ORIGIN`           | recomendada | Domínio do site autorizado a validar (`*` = todos)  |

## Endpoints

| Método | Rota                              | Uso                              |
|--------|-----------------------------------|----------------------------------|
| GET    | `/api/validate?code=CUPOM`        | Público. Valida 1 cupom.         |
| GET    | `/api/admin/coupons`              | Painel (senha). Lista todos.     |
| POST   | `/api/admin/coupons`              | Painel (senha). Cria/atualiza.   |
| DELETE | `/api/admin/coupons?code=CUPOM`   | Painel (senha). Remove.          |

## Problemas comuns

- **O site diz sempre "inválido":** confira a `API_BASE` no site e o `ALLOWED_ORIGIN`
  (bloqueio de CORS). Teste `https://SEU-APP.vercel.app/api/validate?code=XPTO`
  direto no navegador.
- **A página não abre dentro do Bitrix:** troque o tipo de `Estático` para `Servidor`.
- **"unauthorized" no painel:** senha diferente da `ADMIN_PASSWORD` configurada no Vercel.
- **Alterei uma variável no Vercel:** é preciso **Redeploy** para valer.
