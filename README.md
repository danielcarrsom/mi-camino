# Mi Camino

Educación financiera y planeación para cada paisano en Nueva York: en su lengua, con su voz y sin necesidad de leer.

Mi Camino has two sides, so people learn to keep their home money and their business money apart:

- **Mi Casita**: personal and family money. Goals built brick by brick, what you earn (per hour and per day from your paystub), what you spend (rent, electricity, water, groceries…), and a plain-language balance: *Ganas, Gastas, Para tus metas, Te queda*.
- **Mi Negocio**: sales and costs (voice, typing or tapping products), a traffic-light health check, product cost and price calculator, "what if" look-ahead, business goals with automatic savings, plain-language suggestions, and "pay yourself" into Mi Casita.

Everything can be done three ways: **talking, typing (spelling mistakes are fine) or taking a photo**. Every screen can be read aloud.

## Design rules

1. Anyone, whatever their language and even if they can't read or write, must be able to use it alone.
2. No financial jargon: "cuánto ganaste", never "revenue".
3. One decision per screen, big buttons, icons from daily life.
4. We never ask for immigration status or account numbers. Photos are read for numbers and not stored.

## What works today

| Area | Status |
| --- | --- |
| Welcome, language picker, phone + 6-digit PIN | ✅ |
| Demo profile ("Probar con un ejemplo") | ✅ |
| Mi Casita home: "Esta semana te quedan" | ✅ |
| Goals: 10 ready-made goals + your own, bricks/coins, sounds, weekly plan, share on WhatsApp | ✅ |
| Add income/spending by voice, typing or photo, with review screen | ✅ (photo needs AI key) |
| Paystub → pay per hour and per day | ✅ |
| Mi dinero: monthly/weekly balance, where the money goes | ✅ |
| Read-aloud on every screen | ✅ (ElevenLabs, or the browser's voice as backup) |
| Explain a document + scam check | 🔜 |
| Remittance calculator + Finabien | 🔜 |
| Learn: games and audio lessons | 🔜 |
| Mi Negocio | ✅ |
| Indigenous-language audio (Mixteco, Náhuatl, Maya, K'iche', Kichwa) | 🔜 recorded with native speakers |

## Run it

```bash
npm install
cp .env.example .env.local   # add keys (optional: everything has a fallback)
npm run dev                  # http://localhost:3000
```

Without keys the platform still works: voice uses the browser's built-in voice (best in Chrome), and typed/spoken entries are understood by a built-in parser that tolerates spelling mistakes. Photos need the Anthropic key.

## Settings (environment variables)

Add these in Vercel → Project → Settings → Environment Variables. Never commit them.

| Name | What it does |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude: reads photos, understands what people say/type |
| `CLAUDE_MODEL` | Optional. Defaults to `claude-sonnet-5-5` |
| `ELEVENLABS_API_KEY` | Natural voices (read aloud) and speech-to-text |
| `ELEVENLABS_VOICE_ID` | Optional. Voice used for Spanish |
| `ELEVENLABS_VOICE_ID_EN` | Optional. Voice used for English |

## Indigenous languages

ElevenLabs and current AI models don't support Mixteco, Náhuatl, Maya, K'iche' or Kichwa. Those languages are handled with **recordings from native speakers**: put them in `public/audio/<code>/<key>.mp3` and list the keys in `AUDIO_READY` in `src/lib/i18n.ts`. Codes: `mix` (Mixteco), `nah` (Náhuatl), `yua` (Maya), `quc` (K'iche'), `qvi` (Kichwa). Until a recording exists, the Spanish voice is used.

## Tech

Next.js · TypeScript · Tailwind · Claude API · ElevenLabs · Supabase.

### Online saving (Supabase)

- Project **Mi Camino** (`hfdnzasqblxjdsenmpfc`, us-east-1).
- Tables: `profiles` (name, language, modules) and `user_data` (each person's money data as one JSON document). Row level security: each person can only read and write their own rows.
- Sign-up goes through the `registro` edge function, which creates a confirmed account from phone + 6-digit PIN (no email or SMS). The phone becomes an internal login name.
- The app saves on the device first and syncs online a moment after each change; on another device, signing in with the same phone + PIN brings the data back. If Supabase can't be reached, everything keeps working on the device.
- The demo profile ("Probar con un ejemplo") never goes online.
- `stats_overview` view: anonymous totals by language for the Consulate (no personal data).

## Structure

```
src/app/              pages (bienvenida, entrar, casita/*, negocio, aprender) and api/ routes
src/components/       shared UI: big buttons, PIN pad, talk button, goal bricks, app frame
src/lib/i18n.ts       all on-screen words (Spanish + English) and language list
src/lib/catalog.ts    spending categories, income kinds, goal presets
src/lib/store.ts      saved data and the plain-language balance math
src/lib/voice.ts      read aloud + listen (ElevenLabs with browser fallback)
src/lib/understand.ts offline understanding of typed/spoken money
```
