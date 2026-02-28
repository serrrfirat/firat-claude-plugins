# Risk Classification

## Severity Levels

### BREAKING

Existing deployments will fail or behave incorrectly after upgrade with no
config changes. Requires user action to restore functionality.

Indicators:
- Default value changed for a config field users likely rely on
- Serialization format incompatible with stored/in-flight data
- API endpoint removed, method changed, or response schema broken
- Auth mechanism changed without backward compat
- Required config field added with no default

Action: HOLD merge until migration path added or breaking change reverted.

### RISKY

Existing deployments may behave differently but won't crash. Some users may
be affected depending on their configuration.

Indicators:
- New config fields added with defaults that change behavior subtly
- Error handling changed (different error codes, new retry behavior)
- Feature enabled/disabled by default differently
- Response format has new fields (additive but may break strict parsers)
- Capability declaration changed (polling, webhook modes)

Action: MERGE WITH NOTES. Document what changed and migration steps.

### SAFE

No impact on existing deployments. All changes are backward-compatible.

Indicators:
- Purely additive (new endpoint, new optional field with serde default)
- Internal refactor with identical external behavior
- Bug fix that makes behavior match documented/expected behavior
- Test/doc-only changes
- New feature behind opt-in flag (disabled by default)

Action: SAFE to merge.

## Classification Decision Tree

```
Is an existing config/API/wire format changed?
├── No → SAFE
└── Yes → Does old config/data still work without modification?
    ├── Yes → Does behavior change with old config?
    │   ├── No → SAFE
    │   └── Yes → RISKY (document the behavioral change)
    └── No → BREAKING (requires migration path)
```

## Migration Path Requirements

For BREAKING or RISKY findings, a valid migration path includes ONE of:
1. Backward-compat shim (old format auto-converted to new)
2. Config migration documentation in PR description or release notes
3. Deprecation period (old behavior preserved, warning logged, removed later)
4. Feature flag (new behavior opt-in, old behavior default)
