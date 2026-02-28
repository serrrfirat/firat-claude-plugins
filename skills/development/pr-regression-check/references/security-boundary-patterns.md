# Security Boundary Shift Patterns

These are the highest-risk regression patterns. A security boundary shift
silently degrades protection without any visible error.

## Auth Validation Location Move

**Pattern**: Validation moves from host/framework layer to application layer.

Example (from Discord PR #335):
```
BEFORE: require_secret: true    (host validates webhook before WASM sees it)
AFTER:  require_secret: false   (WASM channel validates internally)
```

**Risk**: If new validation has a bug or misconfiguration, requests pass through
unvalidated. Host-level validation is a safety net; removing it removes the net.

**Check**: Does the new location have equal or stronger guarantees? Is there a
fallback if the new validation fails to initialize?

## Default-Open on Misconfiguration

**Pattern**: Feature defaults to "enabled" but required config defaults to null/empty,
causing silent failure or silent bypass.

Example:
```json
{
  "require_signature_verification": true,   // enabled by default
  "webhook_secret": null                     // but no secret configured
}
```

**Risk**: New deployments silently reject all requests (500) or silently accept
all requests (if verification is skipped on null secret).

**Check**: What happens with zero configuration? Does it fail safe (deny all)
or fail open (allow all)?

## Permission System Removal

**Pattern**: Access control (allowlist, owner check, role check) removed or
replaced with weaker alternative.

**Check**: List all permission checks in the old code. Verify each has an
equivalent in the new code. If removed intentionally, flag as BREAKING with
migration note.

## Secret Exposure Surface Change

**Pattern**: Secret that was previously server-side-only now appears in client
config, logs, or error messages.

**Check**: Grep the diff for secret/token/key field names. Verify they don't
appear in new log statements, error responses, or client-visible config.

## Trust Boundary Expansion

**Pattern**: Code that previously ran in a sandboxed/restricted context now runs
with elevated privileges, or vice versa.

Example: Moving crypto verification from host (trusted) to WASM module
(sandboxed but potentially user-supplied code).

**Check**: Does the new trust boundary have access to the same secrets and
capabilities as the old one? Are there compensating controls?
