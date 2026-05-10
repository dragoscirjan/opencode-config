---
```
type: <type> # initiative | epic | story | task | bug
parent=<parent-issue> # Optional: ID of the parent issue 
depends=[] # Optional: Array of blocking issue IDs
opencode-agent: <agent-name>

id: "00001" # 5-digit zero-padded
type: task # initiative | epic | story | task | bug
title: Add Auth # Emoticons optional in FS
status: open # open | in_progress | done | closed
parent: "00000" # Optional: Parent issue ID
depends: [] # Optional: Array of blocking issue IDs
author: name # Optional: Author name
```
---

# <Title>

<Description. Use the appropriate structure for the issue type:>

- **Initiative/Epic/Story:** Scope, Goals, Non-Goals, Risks.
- **Task:** Description, Technical Requirements.
- **Bug:** Steps to Reproduce, Expected Behavior, Actual Behavior.

## Acceptance Criteria

- <Testable criterion 1>
- <Testable criterion 2>

<Optional sections below based on type>

## Open Questions

- <Question 1>

## Risks

- <Risk 1> — <Mitigation>
