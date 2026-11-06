# Mi Camino

Educación financiera y planeación para cada paisano: en su lengua, con su voz y sin necesidad de leer.

> **Beta.** Mi Camino is a test version. Features and texts may change.
> Live: https://mi-camino-eight.vercel.app · Privacy: `/privacidad` · Terms: `/terminos`

Mi Camino has two sides, so people learn to keep their home money and their business money apart:

- **Mi Casita**: personal and family money. What you earn (after estimated taxes), what you spend, fixed bills with "Ya lo pagué", goals built brick by brick with savings plans, tandas, sending money home, explaining a confusing letter, and games and lessons.
- **Mi Negocio**: sales and costs (by voice, typing or tapping products), a traffic-light health check, product costs and inventory, "what if" projections, business goals, a salary for the owner, and tips made for the kind of business.

Everything can be done three ways: **talking, typing (spelling mistakes are fine) or taking a photo**. Every screen can be read aloud, and a guided tour walks new people through the whole app.

## Design rules

1. Anyone, whatever their language and even if they can't read or write, must be able to use it alone.
2. No financial jargon: "cuánto ganaste", never "revenue".
3. One decision per screen, big buttons, icons from daily life.
4. We never ask for immigration status or account numbers. Photos, papers and recordings are read for numbers and not stored.

## Run it

```bash
npm install
cp .env.example .env.local   # add keys (optional: everything has a fallback)
npm run dev                  # http://localhost:3000
```

Without keys the app still works: voice uses the browser's own voice, and typed or spoken entries are understood by a built-in parser that tolerates spelling mistakes. Photos and "Explicar un papel" need the Anthropic key.

## Check it

```bash
npm run check     # types + lint + unit tests (run this before every push)
npm test          # unit tests only (Vitest)
npm run build     # production build
npm run e2e       # browser smoke test against a running app (BASE_URL=http://localhost:3000)
npm run a11y      # accessibility check with axe-core on every screen
```

GitHub Actions runs all of this on every push and pull request. The browser test fakes Supabase, so it never creates real accounts. The unit tests cover the money math that people rely on: taxes for every US state and México (checked against hand calculations), the weekly summary, bills, goals, tandas, the text parsers, phone numbers and the rate limiter. See `src/lib/*.test.ts`.

## Deploy

- **Web app:** every push to `main` deploys on Vercel.
- **Database and server functions:** Supabase project `hfdnzasqblxjdsenmpfc` (us-east-1). The SQL is in `supabase/migrations/` and the edge functions in `supabase/functions/`. Deploy with the Supabase CLI (`supabase db push`, `supabase functions deploy <name> --no-verify-jwt`).

## Settings (environment variables)

Add these in Vercel → Project → Settings → Environment Variables, then Redeploy. Never commit them.

| Name | What it does |
| --- | --- |
| `ANTHROPIC_API_KEY` (or `MI_CAMINO_AI_KEY`) | Claude: reads photos, understands what people say/type, explains papers |
| `CLAUDE_MODEL` | Optional. Defaults to `claude-sonnet-5-5` |
| `ELEVENLABS_API_KEY` | Natural voice (read aloud) and speech-to-text |
| `ELEVENLABS_VOICE_ID`, `ELEVENLABS_VOICE_ID_EN` | Optional. Voices for Spanish and English |
| `RATE_LIMIT_SECRET` | Optional. Secret used to make anonymous visitor codes for the AI rate limit |
| `ALLOWED_ORIGINS` | Optional. Extra domains (comma-separated) allowed to call the AI and voice routes, e.g. a custom domain |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Optional. Defaults to the Mi Camino project (these are public by design) |

## Forgotten PIN

No email or SMS is needed. People pick a security question when they sign up (or later in Mi perfil). "¿Olvidaste tu clave?" asks that question; the answer is checked on the server (function `recuperar`), ignoring accents, capitals and spaces. After 5 wrong tries the phone is locked for one hour.

If someone has no question or forgot the answer, a person who helps them (e.g. at the Consulate) checks their ID and creates a **one-time code** that expires in 24 hours. In the Supabase SQL editor, replace the phone (10 digits for US, `52` + 10 digits for México) and the code:

```sql
insert into public.recovery_codes (user_id, code_hash, expires_at)
select public.user_id_by_login('3475550123@usuarios.micamino.app'),
       encode(extensions.digest('MCABCD2345', 'sha256'), 'hex'),  -- code MC-ABCD-2345 without dashes
       now() + interval '24 hours';
```

## Indigenous languages

ElevenLabs and current AI models don't support Mixteco, Náhuatl, Maya, K'iche' or Kichwa. Those languages will use **recordings from native speakers**: put them in `public/audio/<code>/<key>.mp3` and list the keys in `AUDIO_READY` in `src/lib/i18n.ts`. Until a recording exists, Spanish text and voice are used.

## More

- [ARCHITECTURE.md](ARCHITECTURE.md): how the code is organized and how data flows.
- [SECURITY.md](SECURITY.md): the protections in place, what's left to do, and how to report a problem.

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Zustand · Supabase (Postgres, Auth, Edge Functions) · Claude API · ElevenLabs · Vitest.
