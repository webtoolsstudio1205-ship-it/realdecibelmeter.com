# CLOUDFLARE-SECURITY-CHECKLIST — manual owner actions

Muse did not inspect or change the Cloudflare account. Every item below is a
**MANUAL CHECK** for the owner in the Cloudflare dashboard / registrar.
Nightly evidence: record date + who verified.

## Account

- [ ] Enable 2FA with an authenticator app or hardware key (Security → Authentication).
- [ ] Save recovery codes offline (printed, not in email/cloud notes).
- [ ] Unique Cloudflare password in a password manager; never shared.
- [ ] Review active sessions (My Profile → Sessions); revoke unknown ones.
- [ ] Review members (Manage Account → Members); remove unused; least-privilege roles.
- [ ] Review Audit Logs (Manage Account → Audit Logs) for unknown changes.
- [ ] Enable account + zone notifications (Manage Account → Notifications).
- [ ] Secure the email account behind Cloudflare with 2FA as well.

## API access

- [ ] Avoid the Global API Key entirely (use scoped tokens).
- [ ] One narrowly scoped token per integration (zone-limited, minimum permissions).
- [ ] Set token expiration/TTL where practical; rotate annually or on staff change.
- [ ] Revoke any token ever committed to Git (assume compromised; rotation only).
- [ ] Store tokens in Cloudflare encrypted secrets / local `.dev.vars` (now git-ignored), never in code.

## Domain (registrar + DNS)

- [ ] Registrar lock enabled.
- [ ] DNSSEC enabled (DNS → DNSSEC) where the registrar/TLD supports it.
- [ ] Confirm authoritative nameservers are exactly the assigned pair.
- [ ] Remove unused DNS records and forgotten subdomains; hunt dangling CNAMEs.
- [ ] Confirm auto-renewal + correct registrant contact; protect registrar login with 2FA.
- [ ] Watch certificate-transparency notifications for rogue certs.

## SSL/TLS (depends on plan; all available on Free unless noted)

- [ ] Always Use HTTPS on (SSL/TLS → Edge Certificates).
- [ ] Encryption mode Full (strict) when the origin supports HTTPS with a valid cert
      (Pages origins do — prefer Full strict).
- [ ] Minimum TLS 1.2; TLS 1.3 enabled; no mixed content (this repo emits https-only URLs).
- [ ] HSTS: enable ONLY after confirming HTTPS works on the apex + all subdomains.
      Start WITHOUT includeSubDomains/preload; never submit to the preload list
      without explicit long-term commitment. (Repo intentionally sends no HSTS header.)
- [ ] No duplicate redirect loops (Pages trailing-slash + Edge rules must agree).

## WAF and abuse prevention (plan-dependent notes)

- Free plan: Security → WAF managed rules + Bot Fight Mode (test first: it can
  challenge legitimate traffic; never challenge verified search crawlers).
- Pro+: Managed Rulesets with Cloudflare-recommended paranoia; Bot Management.
- [ ] If a contact/feedback API is ever added: targeted rate limit on that path
      only (e.g. `POST /api/contact`, 5 req / 10 min / IP, action: Managed
      Challenge; exclude verified bots). Do NOT rate-limit `/`, CSS/JS/images,
      or the browser-local meter (it makes zero server requests).
- [ ] Review Security → Events after any change; use Under Attack Mode only
      during an active attack, then disable.

## Monitoring cadence

- Weekly: Security Events glance; Audit Log glance.
- On alert (unknown DNS change, unknown cert, unexpected deploy): follow
  `docs/INCIDENT-RESPONSE.md`.
