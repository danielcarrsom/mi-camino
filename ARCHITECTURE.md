# How Mi Camino is built

A map for programmers joining the project. For running and deploying, see [README.md](README.md); for protections, see [SECURITY.md](SECURITY.md).

## The big picture

```
 Browser (Next.js client pages)
   │  state: zustand store, saved in localStorage   ← works offline
   │
   ├── /api/* (Next.js server routes on Vercel)    ← secret keys live here only
   │      entender, leer-foto, explicar  → Claude API
   │      voz/hablar, voz/escuchar       → ElevenLabs
   │      tipo-de-cambio                 → Coinbase / ExchangeRate-API
   │      estado                         → which services are connected
   │
   └── Supabase
          Auth (phone + PIN, via edge functions)
          Postgres: profiles, user_data (one JSON document per person), RLS on
          Edge functions: registro, entrar, recuperar, cuenta
```

The app is **local-first**: every change is saved in the browser immediately and copied to Supabase a moment later. If the internet or Supabase is down, the app keeps working and catches up later. The example account ("Probar con un ejemplo") never goes online.

## Folders

```
src/app/                    Pages (App Router). Spanish URLs, matching what people see.
  page.tsx                  Welcome
  bienvenida/               Sign-up: language, name, where you live, phone, PIN, security question, consent
  entrar/  recuperar/       Sign-in and forgotten PIN
  privacidad/  terminos/    Privacy notice and terms (public)
  (app)/                    Everything behind sign-in. layout.tsx adds the frame, sync, tour and consent gate
    casita/                 Mi Casita: home, anotar, dinero, metas, tanda, enviar, documentos
    negocio/                Mi Negocio: home, anotar, dinero (movimientos/costos/futuro), metas, aprender
    aprender/  perfil/  inicio/
  api/                      Server routes (see above). Each paid route starts with guard()

src/components/             Shared UI
  ui.tsx                    Buttons, cards, sheets, PIN pad, page header with "listen" and "how to use"
  AppShell.tsx              Sidebar / phone top bar and menu
  MoneyForms.tsx            Editing entries and jobs, the tax picker and take-home view
  Biz.tsx                   Mi Negocio building blocks and the useBiz() hook
  GuidedTour.tsx            The step-by-step tour after sign-up
  ...                       One file per feature (Bills, Certificate, LearnHub, RegionPicker, Avatars, Consent…)

src/lib/                    Logic, no UI
  types.ts                  Shapes of everything saved (Profile, Work, Entry, Goal, Tanda, Business)
  model.ts                  Pure calculations on that data: summary, bills, goals, tandas, region
  store.ts                  The zustand store: accounts on this device, sign-in, every action, cloud sync
  demo.ts                   The example account
  cloud.ts                  Talking to Supabase (sign-up, sign-in, save, load, recovery, delete)
  taxes.ts                  2026 taxes: federal + 50 states + D.C. + NYC, and México (ISR, IMSS, RESICO)
  money.ts                  Formatting dollars/pesos, weekly↔monthly, suggested amounts in pesos
  business.ts               Mi Negocio math: health light, product prices, projections, tips, goals
  understand.ts             Offline parser for what people type or say
  i18n.ts                   On-screen words (Spanish + English) and the language list
  catalog.ts                Spending categories and goal presets
  learn.ts, learnBiz.ts     Games, lessons and help resources
  voice.ts                  Read aloud and listen (ElevenLabs, browser voice as backup)
  hooks.ts                  useHydrated, useT, useResetOn, useNow
  legal.ts                  Owner, contact and version of the privacy notice and terms
  server/ai.ts              Claude client and prompts (server only)
  server/guard.ts           Origin check, size limit and rate limit for paid routes

supabase/
  migrations/               Database schema, RLS and functions, in order
  functions/                Edge functions; _shared/auth.ts is how a PIN becomes a password
```

## Data flow for one change

1. A screen calls a store action (for example `addEntries`).
2. The store updates the person's `UserData` in memory and localStorage (`mutateCurrent`).
3. `(app)/layout.tsx` notices the change and calls `syncUp()` after a short pause, which upserts the JSON document into `user_data` (RLS makes sure it's the person's own row).
4. On sign-in or app start, `syncDown()` loads the online copy and keeps whichever is newer.

## Conventions

- **Calculations go in `src/lib/*.ts` as pure functions** with a test next to them. Screens only display.
- **Words people read** are plain Spanish and English. Most screens keep short texts inline as `L(lang, "es", "en")`; shared words live in `i18n.ts`. A future step is moving all inline texts to `i18n.ts` so new languages are easier to add.
- **Resetting a form when a sheet opens** uses `useResetOn(key, reset)` instead of `useEffect` + `setState`.
- **Server secrets** are only read in `src/lib/server/` and `src/app/api/`. Nothing secret starts with `NEXT_PUBLIC_`.
- **Money** is stored as plain numbers in the person's own currency (dollars, or pesos for people in México). `money()` formats it.
- Comments explain *why*, in English; what people see is in Spanish first.

## Known limits (good first tasks)

- `negocio/dinero/page.tsx` (≈650 lines) and `casita/tanda/page.tsx` (≈450) should be split into smaller components.
- Inline texts should move to `i18n.ts`.
- End-to-end coverage is one smoke script (`e2e/smoke.mjs`: demo screens, sign-up in México with consent, taxes, data download, account deletion, sign-in lock, route protection and security headers). Moving it to `@playwright/test` and adding more flows is a good next step.
- The paid-route rate limit is per server instance (see SECURITY.md).
