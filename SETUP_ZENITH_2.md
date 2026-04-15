# 🚀 ZENITH 2.0 — Setup & Deployment

## ✅ Checklist de Deploy

### 1. Banco de Dados (Supabase)

```bash
# No Supabase → SQL Editor
# Copiar conteúdo de: .claude/MIGRATIONS_DATABASE.sql
# E executar as 5 tabelas:
# - client_ga4_properties
# - weekly_reports
# - report_settings
# - ranking_history
# - category_audit_log
```

### 2. Instalar Dependências

```bash
npm install
# Vai instalar @anthropic-ai/sdk (novo)
```

### 3. Configurar Environment Variables

```bash
# Copiar .env.example para .env.local
cp .env.example .env.local

# Preencher com valores reais:
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
LOCAL_FALCON_API_KEY=4360a78a104ad6632172e5a3c04b2461
ANTHROPIC_API_KEY=xxx
RESEND_API_KEY=xxx (ou SENDGRID_API_KEY)
CRON_SECRET=$(openssl rand -hex 32)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Testar Localmente

```bash
npm run dev
# Deve abrir http://localhost:3000

# Testar fluxos:
# 1. /dashboard/settings/reports → GA4 Setup
# 2. /dashboard/settings/reports → Local Falcon Setup
# 3. /dashboard/settings/reports → Report Configuration
# 4. /dashboard/gbp-analysis → Rodar análise
```

### 5. Build & Test

```bash
npm run build
# Deve compilar sem erros
```

### 6. Deploy no Vercel

```bash
git add .
git commit -m "feat: Zenith 2.0 - Weekly Reports + GBP Analysis"
git push origin main

# Vercel faz deploy automaticamente
# Adicionar env vars em Vercel project settings
```

### 7. Testar em Produção

```bash
# Ir pra https://seu-dominio.com/dashboard/settings/reports
# Testar cada feature
# Clicar "Enviar Agora" pra testar email
```

---

## 📂 Estrutura de Arquivos Novos

```
app/
├── types/
│   └── reports.ts (NEW)
├── utils/
│   ├── ga4.ts (NEW)
│   ├── localfalcon.ts (NEW)
│   ├── reportTemplate.ts (NEW)
│   ├── emailService.ts (NEW)
│   ├── promptTemplates.ts (NEW)
│   ├── categorySafetyChecker.ts (NEW)
├── api/
│   ├── ga4/ (NEW)
│   │   ├── callback/route.ts
│   │   └── property-update/route.ts
│   ├── localfalcon/ (NEW)
│   │   └── setup/route.ts
│   ├── reports/ (UPDATED)
│   │   ├── generate-weekly/route.ts (NEW)
│   │   ├── weekly/route.ts (NEW)
│   │   └── settings/route.ts (NEW)
│   ├── gbp/ (NEW)
│   │   └── category-audit/route.ts
│   ├── analyze/ (NEW)
│   │   └── route.ts
│   └── cron/ (UPDATED)
│       └── weekly-reports/route.ts (UPDATED)
├── components/zenith/
│   ├── GA4Setup.tsx (NEW)
│   ├── LocalFalconSetup.tsx (NEW)
│   ├── ReportConfiguration.tsx (NEW)
│   ├── GBPAnalysisModule.tsx (NEW)
│   └── WeeklyReportViewer.tsx (NEW)
└── dashboard/
    ├── settings/ (NEW)
    │   └── reports/
    │       └── page.tsx
    └── gbp-analysis/ (NEW)
        └── page.tsx
```

---

## 🔐 Variáveis de Ambiente

| Variável | Origem | Obrigatório |
|----------|--------|------------|
| `GOOGLE_CLIENT_ID` | Google Cloud Console | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | ✅ |
| `LOCAL_FALCON_API_KEY` | Local Falcon | ✅ |
| `ANTHROPIC_API_KEY` | Anthropic Dashboard | ✅ |
| `RESEND_API_KEY` | Resend Dashboard | ⚠️ (se usar Resend) |
| `SENDGRID_API_KEY` | SendGrid Dashboard | ⚠️ (se usar SendGrid) |
| `CRON_SECRET` | Gerar aleatório | ✅ |
| `NEXT_PUBLIC_APP_URL` | Seu domínio | ✅ |

---

## 📧 Configurar Email

### Opção 1: Resend (Recomendado)

```bash
# 1. Ir pra https://resend.com
# 2. Criar conta
# 3. Copiar API Key
# 4. Adicionar em RESEND_API_KEY
```

### Opção 2: SendGrid

```bash
# 1. Ir pra https://sendgrid.com
# 2. Criar conta
# 3. Copiar API Key
# 4. Adicionar em SENDGRID_API_KEY
```

---

## 🔄 Cron Job

Configurado em `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-reports",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

**Significa:** Todo segunda às 9:00 AM UTC

**Pra alterar:** Editar `vercel.json` e fazer push

---

## 🧪 Testes Recomendados

### 1. GA4 Setup
```bash
# Ir pra /dashboard/settings/reports
# Clicar "Conectar com Google"
# Autorizar
# Adicionar Property ID
# Verificar salvo no banco (Supabase)
```

### 2. Local Falcon Setup
```bash
# Ir pra /dashboard/settings/reports
# Clicar abas Local Falcon
# Adicionar GBP ID
# Salvar
```

### 3. Report Configuration
```bash
# Ir pra /dashboard/settings/reports
# Abas Relatórios
# Escolher dia (friday)
# Escolher hora
# Adicionar email
# Salvar
# Clicar "Enviar Agora" (teste)
# Verificar email recebido
```

### 4. GBP Analysis
```bash
# Ir pra /dashboard/gbp-analysis
# Selecionar "Categorias"
# Clicar "Analisar"
# Aguardar resposta da IA
```

### 5. Cron Job Manual
```bash
curl -X GET "https://seu-dominio.com/api/cron/weekly-reports" \
  -H "Authorization: Bearer CRON_SECRET"
# Deve retornar: reports_created
```

---

## 🚨 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Module not found" | `npm install` novamente |
| "Env var not found" | Verificar `.env.local` ou Vercel settings |
| "Connection refused" | Verificar Supabase URL/key |
| "Email not sent" | Verificar RESEND_API_KEY ou SENDGRID_API_KEY |
| "GA4 auth fails" | Verificar GOOGLE_CLIENT_ID/SECRET |

---

## 📞 Suporte

Se tudo quebrar, revisar:
1. `.env.local` ou Vercel settings
2. Logs do Vercel: `vercel logs`
3. Console do navegador (F12)
4. Supabase logs
5. Este documento + docs em Memory/

---

## ✨ Próximos Passos Após Deploy

- [ ] Testar com 3 clientes
- [ ] Coletar feedback
- [ ] Ajustar conforme necessário
- [ ] Documentar casos de uso
- [ ] Treinar equipe
- [ ] Anunciar como feature premium

---

**Status:** 🟢 PRONTO PARA DEPLOY

Good luck! 🚀
