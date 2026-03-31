---
name: developer-devops
description: DevOps and infrastructure standards — IaC, CI/CD, automation tooling for Ansible, Terraform, OpenTofu, Shell, PowerShell, Fish. Load when writing infrastructure or automation code.
---

# DevOps & Infrastructure Standards

Always load `clean-code` alongside this skill.

## Tooling Reference

| Tool | Reference | Linter | Formatter | Testing |
|------|----------|--------|-----------|---------|
| Ansible | [Best Practices](https://docs.ansible.com/ansible/latest/tips_tricks/ansible_tips_tricks.html) | `ansible-lint` | `yamlfmt` / `prettier` | Molecule + Testinfra |
| Terraform | [Style Guide](https://developer.hashicorp.com/terraform/language/style) | `tflint`, `tfsec`, `checkov` | `terraform fmt` | `terraform test` (1.6+), Terratest |
| OpenTofu | Same as Terraform (fork) | `tflint`, `tfsec`, `checkov` | `tofu fmt` | `tofu test`, Terratest |
| Shell / Bash | [Google Shell](https://google.github.io/styleguide/shellguide.html) | `shellcheck` | `shfmt` | Bats |
| PowerShell | [PS Practice & Style](https://poshcode.gitbook.io/powershell-practice-and-style) | `PSScriptAnalyzer` | PSScriptAnalyzer | Pester |
| Fish | — | `fish --no-execute` | `fish_indent` | — |
| Markdown | [Google Markdown](https://google.github.io/styleguide/docguide/style.html) | `ESLint` | `prettier` | — |
| YAML | [Yaml Specs](https://yaml.org/spec/1.2.2/) | `ESLint` | `prettier` | — |
| JSON | [Google JSON](https://google.github.io/styleguide/jsoncstyleguide.xml) | `ESLint` | `prettier` | — |

## Key Rules by Tool

**Ansible** — Roles for reusable units. `ansible-vault` for secrets. Fully qualified collection names (`ansible.builtin.copy`). `block`/`rescue`/`always` for error handling. Tags for selective runs. Per-environment inventory. `--check` before apply.

**Terraform / OpenTofu** — One concern per file (`main.tf`, `variables.tf`, `outputs.tf`, `providers.tf`, `versions.tf`). Modules for reuse. Remote state with locking. `plan` before every `apply`. Pin provider versions. `validation` blocks on variables. Prefer OpenTofu for vendor-neutrality.

**Shell** — `set -euo pipefail`. Quote all expansions. `local` in functions. Trap for cleanup. `command -v` over `which`. Portable `sed`/`date`/`find` across macOS + Linux.

**PowerShell** — Approved verbs (`Get-`, `Set-`, `New-`). `[CmdletBinding()]` on all functions. `-ErrorAction Stop`. Pipeline-friendly output. `#Requires` for deps.

**Fish** — Not POSIX — don't assume bash idioms. `set` for variables. `argparse` for argument parsing. `status` for exit codes.

## Cross-Cutting Rules

- **Idempotency**: Every operation safe to run multiple times with the same result. Test by running twice.
- **Immutable infra**: Replace over mutate. Build images (Docker, AMI) rather than patch in place.
- **Secrets**: Never in VCS. Vault solutions (HashiCorp Vault, AWS SM, SOPS). Inject at runtime via env or mounted secrets.
- **Least privilege**: Minimal IAM/RBAC. Separate service accounts per workload. No wildcard permissions in production.
- **Drift detection**: `plan` in CI on schedule. Alert on unexpected changes.
- **State**: Remote with locking (S3+DynamoDB, GCS, Azure Blob). Never commit state files. Workspaces or directories per environment.
- **CI/CD pipeline**: Lint → format check → plan → approval gate → apply. Never auto-apply to production. Pin tool versions.
- **Monitoring**: Define alerts alongside resources as code. Structured logging for automation.
- **Docs**: Every module/role gets a README (inputs, outputs, usage). `terraform-docs` in CI.
- **Automation**: `Taskfile.yml` — `task lint`, `task format`, `task plan`, `task apply`, `task test`.
