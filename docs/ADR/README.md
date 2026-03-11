# Architectural Decision Records (ADR)

## Index

| ID | Title | Status |
|----|-------|--------|
| [001](001-zod-version.md) | Zod Version Selection | Accepted |
| [002](002-layered-architecture.md) | Layered Architecture for Weather Server | Accepted |
| [003](003-bug-fixes.md) | Bug Fixes and Improvements | Accepted |

## About ADRs

ADRs are documents that capture important architectural decisions along with their context and consequences.

### Creating a New ADR

1. Copy the template below
2. Fill in the sections
3. Save to `docs/ADR/XXX-{title}.md`
4. Add to this index

### ADR Template

```markdown
# ADR-XXX: Title

## Status

Proposed | Accepted | Rejected | Deprecated | Superseded

## Context

What is the issue that we're seeing?

## Decision

What is the change being proposed?

## Consequences

### Positive
- Benefit 1
- Benefit 2

### Negative
- Drawback 1
- Drawback 2

## References
- Link 1
- Link 2
```

## Selection Criteria

Document decisions that:
- Affect system structure
- Introduce new technologies
- Have long-term implications
- Were difficult to make
- Could be controversial
