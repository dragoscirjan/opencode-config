# Issue Writing Instructions

When creating or updating an issue, structure the body of the issue as follows:

## YAML Frontmatter Reference (For Local `fs` tracking)

_Note: `issue_create` injects the YAML frontmatter. Do NOT include frontmatter in the body and do NOT edit the local issue file directly. Read the issue with `issue_get`, then use `issue_update` with its latest `expectedRevision` for metadata or body changes. Use `issue_transition` for status changes when available._

```yaml
id: "<configured-prefix>00001" # Tool-managed configured prefix + zero-padded sequence
type: <type> # initiative | epic | story | task | bug
title: <title>
status: open # open | in_progress | done | closed
parent: <parent-issue> # Optional: ID of the parent issue
children: [] # Tool-managed child issue IDs
depends_on: [] # Optional: blocking issue IDs
created_by: <agent-name> # From issue_create author
assigned_to: <agent-name> # From issue_create assignee
created_at: <timestamp>
updated_at: <timestamp>
```

---

## Issue Body Structure

1. **Title**: A clear and concise title. (If not using local `fs`, include the hierarchy emoticon in the title).

2. **Description**: Use the Gherkin format to clearly state the user story or scenario:

   ```gherkin
   As a [persona]
   I want to [action]
   So that [benefit/value]

   # OR

   Given [initial context/state]
   When [action occurs]
   Then [expected outcome]
   ```

3. **Details (Based on Type)**:
   - **Initiative/Epic/Story:** Include Scope, Goals, Non-Goals, and Risks.
   - **Task:** Include a detailed Description and Technical Requirements.
   - **Bug:** Include Steps to Reproduce, Expected Behavior, and Actual Behavior.

4. **Acceptance Criteria**:
   - Provide a list of clear, testable criteria that must be met for the issue to be considered done.

5. **Optional Sections**:
   - **Open Questions:** Any unresolved questions that need answers.
   - **Risks:** Potential risks and mitigations (e.g., `- <Risk> — <Mitigation>`).
