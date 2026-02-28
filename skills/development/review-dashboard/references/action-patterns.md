# Action Patterns and Draft Workflow

## Draft-First Principle

Never post a review action without user confirmation. Always:
1. Compose the action draft (what will be posted)
2. Show the draft to the user
3. Wait for explicit confirmation ("yes", "go ahead", "confirm")
4. Execute only after confirmation

## User Intent Patterns

### Approve
User says: "approve", "approve #42", "lgtm on #42", "ship it"
Action: `act --pr 42 --action approve`

### Request Changes
User says: "request changes on #42: fix X", "they haven't addressed X"
Action: `act --pr 42 --action request-changes --body "..."`
Body: Summarize verified unresolved items from Layer 2 audit.

### Comment
User says: "comment on #42: looks good but...", "leave a note about X"
Action: `act --pr 42 --action comment --body "..."`

### Batch Approve
User says: "approve all that are ready"
1. Filter PRs where Layer 2 confirms all issues resolved
2. Draft approval for each, show list
3. Confirm, execute sequentially

## Composing Review Bodies for Request-Changes

Reference specific unresolved items verified by code reading:

```
Please address the following items (verified against current code):

1. [File:Line] — [Issue summary]. The current code still [specific problem].
2. [File:Line] — [Issue summary]. [What needs to change].

These were flagged in my earlier review and confirmed unresolved as of [HEAD SHA].
```

## Skill Delegation Map

| Phase | Tool | What it does |
|-------|------|-------------|
| Discovery | `review_dashboard.py discover` | Find user's open PRs |
| Thread status | `check_pr_feedback.py --json` | Mechanical classification |
| Code verification | `/respond-pr` methodology | Read code, verify fixes |
| Action | `review_dashboard.py act` | Post review with draft |
