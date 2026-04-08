# Google Cloud Console — Guia de Configuracao para GBP Zenith

**Data:** 2026-03-18
**Email para usar:** jessicasantos@jcdigitalexpand.com
**Projeto:** GBP Zenith

---

## APIs Necessarias

| # | API | Prioridade | Custo |
|---|-----|-----------|-------|
| 1 | OAuth 2.0 | Imediata | Gratis |
| 2 | Business Profile API (6 sub-APIs) | Imediata | Gratis (acesso restrito) |
| 3 | Places API (New) | Alta | ~$17/1000 requests |
| 4 | Maps JavaScript API | Media | $7/1000 loads ($200/mes gratis) |
| 5 | Geocoding API | Media | $5/1000 requests |
| 6 | Google Ads API (LSA) | Futura | Gratis (acesso restrito) |

---

## PASSO 1 — Criar o Projeto

1. Acessar console.cloud.google.com
2. Login com jessicasantos@jcdigitalexpand.com
3. No topo, clique no seletor de projeto -> "New Project"
4. Nome: `GBP Zenith`
5. Clique "Create"
6. Selecione o projeto no seletor

---

## PASSO 2 — Ativar Billing

1. Menu lateral -> "Billing"
2. "Link a billing account"
3. Se nao tem: "Create billing account" (cartao de credito necessario)
   - Google da $300 free credits para novos + $200/mes gratis de Maps
4. Vincular ao projeto GBP Zenith

---

## PASSO 3 — Ativar as APIs

Menu lateral -> "APIs & Services" -> "Library"

Buscar e ativar CADA UMA (clique -> "Enable"):

### Grupo 1 — Business Profile (core):
- My Business Account Management API
- My Business Business Information API
- My Business Verifications API
- My Business Notifications API
- My Business Lodging API
- My Business Place Actions API

### Grupo 2 — Maps & Places:
- Places API (New)
- Maps JavaScript API
- Geocoding API

---

## PASSO 4 — Solicitar Acesso a Business Profile API (RESTRITA)

Buscar no Google: "Google Business Profile API access request form"

Preencher:
- **Google Account:** jessicasantos@jcdigitalexpand.com
- **Company name:** JC Digital Expand
- **Company website:** jcdigitalexpand.com
- **Describe your app:** "GBP Zenith is a SaaS platform for Local SEO agencies to audit, optimize, and manage Google Business Profiles at scale. Features include compliance monitoring, semantic analysis, content generation, review intelligence, and multi-location management."
- **Number of locations:** 100-1000
- **How will you use the API:** "Read and manage business profile data (info, reviews, posts, photos, insights) on behalf of agency clients who authorize access via OAuth 2.0"

AGUARDAR APROVACAO (1 dia a 3 semanas)

---

## PASSO 5 — Configurar OAuth 2.0

### 5A — OAuth Consent Screen:

1. "APIs & Services" -> "OAuth consent screen"
2. Selecione "External" -> Create
3. Preencher:
   - App name: GBP Zenith
   - User support email: jessicasantos@jcdigitalexpand.com
   - Developer contact: jessicasantos@jcdigitalexpand.com
4. Scopes — adicionar:
   - openid
   - email
   - profile
   - https://www.googleapis.com/auth/business.manage
5. Test users — adicionar:
   - jessicasantos@jcdigitalexpand.com
6. Salvar

### 5B — Criar OAuth Client ID:

1. "APIs & Services" -> "Credentials"
2. "+ Create Credentials" -> "OAuth client ID"
3. Configurar:
   - Application type: Web application
   - Name: Zenith Web App
   - Authorized JavaScript origins:
     - http://localhost:3000
     - https://seudominio.com (prod)
   - Authorized redirect URIs:
     - http://localhost:3000/api/auth/callback
     - https://hquxrmtxgsilebrumkvl.supabase.co/auth/v1/callback
     - https://seudominio.com/api/auth/callback (prod)
4. "Create"
5. COPIAR Client ID e Client Secret

---

## PASSO 6 — Criar API Key (Maps/Places)

1. "Credentials" -> "+ Create Credentials" -> "API key"
2. "Restrict key":
   - Name: Zenith Maps Key
   - Application restrictions: HTTP referrers -> localhost:3000/* e dominio prod
   - API restrictions: Restrict -> selecionar apenas:
     - Places API (New)
     - Maps JavaScript API
     - Geocoding API
3. Salvar

---

## PASSO 7 — Configurar no Zenith (.env.local)

Adicionar ao arquivo .env.local:

```
# Google OAuth
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui

# Google Maps/Places
NEXT_PUBLIC_GOOGLE_MAPS_KEY=sua_api_key_aqui
```

---

## PASSO 8 — Configurar Google no Supabase

1. Acessar supabase.com/dashboard -> projeto gbp-zenith
2. Authentication -> Providers -> Google
3. Toggle Enable
4. Colar Client ID e Client Secret (do passo 5B)
5. Copiar o Callback URL do Supabase
6. Adicionar esse Callback URL nas Authorized redirect URIs do Google Console (passo 5B)
7. Salvar

---

## CHECKLIST

- [ ] 1. Projeto GBP Zenith criado no Cloud Console
- [ ] 2. Billing ativado
- [ ] 3. 6 APIs do Business Profile ativadas
- [ ] 4. Places API + Maps JS + Geocoding ativadas
- [ ] 5. Formulario de acesso a BP API submetido
- [ ] 6. OAuth Consent Screen configurado
- [ ] 7. OAuth Client ID criado (guardar ID e Secret)
- [ ] 8. API Key criada e restrita (guardar key)
- [ ] 9. .env.local atualizado com credenciais
- [ ] 10. Google configurado no Supabase

---

## NOTAS

- O Google Login NAO depende da aprovacao da BP API. Passos 5-8 podem ser feitos antes.
- Enquanto espera aprovacao da BP API, o Zenith funciona com dados de demo.
- Google removeu Q&A do GBP — nao incluir essa feature.
- Billing: os $200/mes gratis de Maps cobrem ~28.000 requests de Places API.
