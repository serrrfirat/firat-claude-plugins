# Regression Pattern Checklist

Apply each category to every changed file. If a pattern matches, flag it.

## 1. Default Value Changes

- Constant/variable default changed (e.g., `timeout: 30` -> `timeout: 60`)
- Boolean flag default flipped (e.g., `enabled: true` -> `enabled: false`)
- Config field default changed in schema, struct, or capabilities file
- Environment variable fallback changed

**Why it breaks**: Existing deployments rely on old defaults without setting them explicitly.

## 2. Serialization / Wire Format

- Struct field type changed (`String` -> `Option<String>`, `u32` -> `i64`)
- Field renamed or removed from serialized struct
- Required field made optional or vice versa
- JSON key name changed in `#[serde(rename)]` or equivalent
- Enum variant added/removed/renamed

**Why it breaks**: In-flight messages, stored data, or API consumers use old format.
**Check**: Does the new format deserialize old data correctly? Test both directions.

## 3. API / Protocol Changes

- HTTP method changed (POST -> PATCH, GET -> POST)
- URL path changed or removed
- Response status code changed for same condition
- Request/response body schema changed
- Auth mechanism changed (header, token format, validation location)

**Why it breaks**: Clients hardcode method/path/schema expectations.

## 4. Config Schema Changes

- New required config field with no default
- Config field removed that existing configs may have
- Config field meaning changed (same name, different behavior)
- Validation tightened (previously accepted values now rejected)
- Config source moved (env var -> file, capabilities -> runtime)

**Why it breaks**: Existing config files/env vars become invalid.

## 5. Security Boundary Shifts

- Auth/validation moved between layers (host -> module, server -> client)
- Permission check removed or weakened
- Secret handling changed (where secrets are stored/accessed)
- Trust boundary changed (what is trusted vs validated)

**Why it breaks**: Security assumptions of existing deployments violated.
See `references/security-boundary-patterns.md` for detailed examples.

## 6. Behavioral Logic Changes

- Error handling changed (panic -> return, return -> ignore)
- Retry/timeout behavior changed
- Ordering/sorting changed
- Deduplication logic added or removed
- Fallback behavior changed (what happens on failure)

**Why it breaks**: Downstream systems depend on specific error/retry behavior.

## 7. Feature Flag / Capability Changes

- `capabilities.json` or equivalent modified
- Feature enabled/disabled by default
- Polling/webhook/streaming mode toggled
- Rate limits changed

**Why it breaks**: Orchestration layer relies on declared capabilities.

## Non-Regressions (skip these)

- Code reformatting, whitespace, comment changes
- Internal variable renames (not serialized)
- Test-only changes
- New additive fields with serde `#[serde(default)]`
- New endpoints/methods that don't modify existing ones
- Documentation-only changes
- Dependency version bumps (unless API surface changed)
