# Locaiq — Setup Guide

## Pré-requisitos
- Node.js 18+ instalado (nodejs.org)
- Conta GitHub (github.com)
- Conta Vercel (vercel.com)
- Conta Supabase (supabase.com)

---

## Passo 1 — Instalar dependências

Abra o terminal na pasta do projeto e rode:

```bash
npm install
```

---

## Passo 2 — Configurar variáveis de ambiente

1. Copie o arquivo `.env.local.example` para `.env.local`
2. Preencha cada variável (instruções dentro do arquivo)

Mínimo para funcionar localmente:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`

---

## Passo 3 — Configurar Supabase

1. Acesse supabase.com → seu projeto → SQL Editor
2. Cole e rode o conteúdo do arquivo `P3.3_supabase_db.md`
3. Vá em Authentication → Providers → Google → Enable
4. Cole o Google Client ID e Secret

---

## Passo 4 — Rodar localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Passo 5 — Deploy no Vercel

### Opção A — Via interface (mais fácil, sem terminal)
1. Acesse vercel.com → Add New Project
2. Clique em "Import Git Repository"
3. Conecte seu GitHub e selecione o repo `locaiq`
4. Em "Environment Variables", adicione todas as variáveis do `.env.local`
5. Clique em Deploy

### Opção B — Via CLI
```bash
npm install -g vercel
vercel --prod
```

---

## Estrutura do projeto

```
locaiq/
├── app/
│   ├── layout.tsx              # Layout raiz
│   ├── page.tsx                # Home (login)
│   ├── dashboard/page.tsx      # Dashboard principal
│   └── api/
│       ├── claude/route.ts     # ← API KEY SEGURA AQUI
│       ├── auth/callback/      # OAuth callback
│       └── stripe/             # Checkout + webhook
├── lib/
│   ├── supabase.ts             # Client Supabase + tipos
│   ├── auth.ts                 # Funções de autenticação
│   └── db.ts                   # Queries do banco
├── components/
│   └── (mover componentes do v25.jsx aqui)
├── .env.local.example          # Template de variáveis
├── vercel.json                 # Cron jobs
└── next.config.js
```

---

## Migração do GBPAuditorPro_v25.jsx

O arquivo v25 é um JSX monolítico. Para migrar para Next.js:

1. Copiar as funções utilitárias para `lib/scoring.ts`
   - `calcScores`, `calcSemanticScore`, `daysSince`, etc.

2. Criar um componente por grupo de abas em `components/tabs/`
   - `tabs/Overview.tsx`, `tabs/AIMode.tsx`, etc.

3. Mover `AuthScreen` para `components/AuthScreen.tsx`
4. Mover `Dashboard` para `components/Dashboard.tsx`
5. Mover `AgencyDashboard` para `components/AgencyDashboard.tsx`

Claude pode fazer essa migração automaticamente — basta pedir.

---

## Variáveis obrigatórias no Vercel

Adicionar em: Vercel → seu projeto → Settings → Environment Variables

| Variável | Onde pegar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `GOOGLE_CLIENT_ID` | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console |
| `STRIPE_SECRET_KEY` | Stripe → Developers |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks |

---

## Configurar Stripe Webhook no Vercel

Após o deploy:
1. Stripe → Developers → Webhooks → Add endpoint
2. URL: `https://locaiq.com/api/stripe/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copiar o Signing Secret → adicionar como `STRIPE_WEBHOOK_SECRET` no Vercel
