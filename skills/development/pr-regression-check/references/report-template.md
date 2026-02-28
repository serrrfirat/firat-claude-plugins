# Regression Report Template

Output format for the regression check. Adapt as needed but keep structure.

## Template

```markdown
## Regression Check: PR #<number> — <title>

**Verdict**: SAFE | MERGE WITH NOTES | HOLD

### Summary

<1-2 sentences on overall regression risk>

### Findings

#### [BREAKING] <short description>
- **File**: `path/to/file.rs:L123`
- **Before**: <old behavior, quote code if short>
- **After**: <new behavior, quote code if short>
- **Impact**: <who is affected and how>
- **Migration**: <what users must do to avoid breakage>

#### [RISKY] <short description>
- **File**: `path/to/file.rs:L456`
- **Before**: <old behavior>
- **After**: <new behavior>
- **Impact**: <who may be affected>
- **Migration**: <recommended user action>

#### [SAFE] <short description>
- **File**: `path/to/file.rs:L789`
- **Note**: <why this is safe — e.g., additive only, serde default>

### Config Compatibility

| Field | Old Default | New Default | Breaking? |
|-------|------------|------------|-----------|
| field_name | value | value | Yes/No |

### Wire Format Compatibility

| Struct | Field | Old Type | New Type | Old data parses? |
|--------|-------|----------|----------|-----------------|
| Name | field | Type | Type | Yes/No |

### Recommendation

<Concrete action: merge as-is, request changes, or merge with release notes>
```

## Guidelines

- Lead with the verdict — reviewers scan for it first
- Group findings by severity (BREAKING first, then RISKY, then SAFE)
- Include file:line references for each finding
- Config and wire format tables only when relevant changes exist
- Keep SAFE findings brief — one line each is fine
- Recommendation should be actionable, not vague
