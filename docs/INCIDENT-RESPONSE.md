# INCIDENT-RESPONSE — short checklist

Application logs in this repo contain no audio, tokens, cookies, IPs or form
content (nothing is logged server-side at all — static site). Cloudflare-side
evidence: Security → Events (blocked/challenged traffic), Audit Logs (account
changes), DNS records, Pages deployments.

## If compromise or anomaly is suspected

1. Change the Cloudflare password.
2. Revoke unknown sessions (My Profile → Sessions).
3. Enable/verify 2FA.
4. Revoke and rotate API tokens (especially any ever committed to Git —
   deleting from HEAD does not revoke).
5. Review Audit Logs for unknown changes.
6. Review DNS records for unknown additions/edits.
7. Review recent Pages deployments; roll back to a trusted commit if needed.
8. Verify the production domain loads correctly with a valid certificate.
9. Document the incident: timeline, cause, remediation, follow-ups.

## Abuse signals

- Account compromise: unknown members/tokens, DNS edits nobody made, certs
  you didn't order, deploys you didn't trigger.
- Automated abuse (if endpoints are added later): bursts of POSTs to one path
  in Security Events → answer with a targeted rate rule, not site-wide blocks.

## What this site does NOT expose (limits blast radius)

No server sessions, no database, no uploads, no cookies, no secrets in
bundles. Worst-case static compromise = malicious deploy, fixed by rollback
+ token rotation. The Cloudflare account and registrar remain the crown jewels.
