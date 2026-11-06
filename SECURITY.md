# Security

Mi Camino holds money information of people who may be vulnerable, so it is built to collect as little as possible and to protect what it keeps. This page lists every barrier, what still needs doing by hand, and the risks we know about.

## Reporting a problem

If you find a security problem, please report it privately through GitHub: on the repository, go to **Security → Report a vulnerability**, with the steps to reproduce it. Don't test against other people's accounts and don't publish it before it's fixed.

## What we never collect

No immigration status, Social Security number, ITIN, CURP, RFC, passport or bank/card numbers. Photos, papers and recordings are processed to get numbers and are **not stored** anywhere. The AI prompts tell the model to never repeat ID or account numbers (at most the last 4 digits).

## Barriers in place

### Accounts and PINs
| Barrier | Where |
| --- | --- |
| The Supabase password is an HMAC of phone + PIN with a secret ("pepper") that never leaves the database (`private.secrets`, read only by the service role). The browser can't compute it, so **PINs can't be guessed against Supabase's auth API directly**. | `supabase/functions/_shared/auth.ts`, migration `login_hardening` |
| Every sign-in goes through the `entrar` function: **5 wrong PINs in 15 minutes lock that phone for 15 minutes**, and one network address gets 30 wrong tries per 15 minutes. Unknown phone and wrong PIN give the same answer. | `supabase/functions/entrar` |
| Accounts created before the pepper are moved to it automatically at their next sign-in. | `entrar` |
| PIN recovery: security question (answer stored as a salted hash, never in plain text) or a one-time code given in person; 5 wrong tries lock recovery for one hour. | `supabase/functions/recuperar` |
| Changing the PIN or deleting the account requires a valid session, checked on the server. Deleting asks for the PIN again. | `entrar` (change_pin), `cuenta` |
| Attempt logs are erased after 30 days and rate-limit codes after 1 day, by a daily database job (`pg_cron`). | migration `daily_cleanup` |

### Data
| Barrier | Where |
| --- | --- |
| Row Level Security on every table. People can only read and write their own `profiles` and `user_data` rows. Recovery and attempt tables have RLS on and **no** policies: only server functions (service role) can touch them. | `supabase/migrations` |
| Database functions that look up users (`user_id_by_login`, `login_pepper`) run as `security definer` with an empty `search_path` and can only be executed by the service role. | migrations |
| Deleting an account deletes the auth user, which cascades to all of the person's rows. | `cuenta`, foreign keys `on delete cascade` |
| People can download everything saved about them (Mi perfil → Descargar mis datos). | `src/app/(app)/perfil` |

### Web app
| Barrier | Where |
| --- | --- |
| Security headers on every page: Content-Security-Policy (the browser may only connect to this site and our Supabase project; no plugins; no framing), HSTS, `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy, and a Permissions-Policy that only allows camera and microphone for this site. | `next.config.ts` |
| Secret keys (Anthropic, ElevenLabs) are only read on the server (`src/lib/server`, `src/app/api`). The Supabase key in the browser is the publishable one, which is safe by design because RLS protects the data. | — |
| The routes that cost money (`entender`, `leer-foto`, `explicar`, `voz/*`) only answer requests from our own pages, refuse oversized requests, and limit each visitor per minute and per day. The count is shared by every server through the database (`public.rate_limit_hit`); visitors are identified by an HMAC of their IP, so no IP is stored for this. If the database is slow, a per-server count takes over. Bad input returns 400 instead of crashing. | `src/lib/server/guard.ts`, migration `api_rate_limits` |
| No `dangerouslySetInnerHTML`, `eval` or HTML built from strings; React escapes everything people type. | — |
| `npm audit` reports 0 known vulnerabilities (Nov 6, 2026). GitHub Actions runs types, lint, unit tests, build, `npm audit`, the browser smoke test and the accessibility check on every push and pull request; Dependabot proposes dependency updates weekly. | `.github/` |

## To do by hand (accounts only the owner can change)

1. **Spending limits.** In the Anthropic Console and ElevenLabs, set a monthly spend limit, so a bug or abuse can never cost more than you choose.
2. **Vercel Firewall** (optional now). The paid routes already share a limit through the database; a Firewall rule for `/api/*` (e.g. 60 requests per minute per IP) adds a hard edge limit in front of everything.
3. **Supabase Auth.** In Authentication → Sign In / Providers, turn off "Allow new users to sign up". All sign-ups go through the `registro` function, which still works.
4. **Two-step login** (2FA) on GitHub, Vercel, Supabase, Anthropic and ElevenLabs.
5. **GitHub.** Turn on Dependabot alerts, secret scanning and private vulnerability reporting (Settings → Code security) for the repository.
6. If a key ever leaks: rotate it in the provider's console, update it in Vercel, and Redeploy.

## Ongoing review

- A scheduled review runs every Monday: it installs, type-checks, lints, tests, builds and audits the project, reads the last week's changes for security and structure problems, checks the Supabase advisors, and opens a pull request with fixes. It never pushes to `main` or changes production directly.
- Accessibility: `npm run a11y` runs axe-core on every screen and fails on serious problems.

## Known risks and limits

- **Data on the device is not encrypted.** The app asks for the PIN, but someone with the phone and technical skill could read the browser's storage, and a 6-digit PIN hash on the device can be brute-forced offline. The privacy notice tells people not to use public computers.
- **`rate_limit_hit` can be called with the public key.** It only adds to a counter and checks it; keys are HMACs the attacker can't compute for other people, and inputs are length-checked. The Supabase advisor flags it; it's intentional. Setting `RATE_LIMIT_SECRET` in Vercel makes the HMAC independent of the AI keys.
- **The recovery screen reveals whether a phone has an account** (it needs to show the person's security question). Recovery attempts are limited per phone.
- **CSP allows inline scripts**, which Next.js needs without a nonce setup. Moving to nonce-based CSP would remove `'unsafe-inline'`.
- **The security-question answer hash** uses the service role key as its pepper; rotating that key would invalidate saved answers (people can set them again, or use a one-time code).
- Supabase's "leaked password protection" warning doesn't apply: passwords are server-generated HMACs, not chosen by people.
