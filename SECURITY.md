# Agent Security Configuration

This document describes the security restrictions applied to all AI agents in the OpenCode system to prevent unauthorized access to sensitive files containing secrets, credentials, and security materials.

## Security Policy

**Core Principle**: AI agents should NOT have access to sensitive files containing secrets, credentials, SSL keys, or other security materials unless explicitly granted permission by a human operator.

## Affected Agents

The following security restrictions apply to ALL agents in the system:

### Main Agents
- **plan** - Senior Architect agent for design and planning
- **build** - Senior Developer agent for implementation

### Subagents
- **architect** - Software architecture analysis and design
- **code-reviewer** - Code quality and security review
- **developer** - Code implementation
- **docs** - Documentation generation
- **tech-lead** - Task planning and breakdown
- **tester** - Test writing and execution

## Restricted File Patterns

All agents are configured with `readDeny` restrictions that prevent access to the following file patterns:

### Environment Variables & Configuration
- `**/.env` - Environment variable files
- `**/.env.*` - Environment variable files with any extension (e.g., .env.local, .env.production)

### SSL/TLS Keys & Certificates
- `**/*.key` - Private keys
- `**/*.pem` - PEM-encoded certificates and keys
- `**/*.p12` - PKCS#12 certificate archives
- `**/*.pfx` - Personal Information Exchange files
- `**/*.crt` - Certificate files
- `**/*.cer` - Certificate files (alternative extension)

### Credentials & Secrets
- `**/*credentials*` - Any file with "credentials" in the name
- `**/*secrets*` - Any file with "secrets" in the name
- `**/.aws/credentials` - AWS credentials
- `**/.azure/credentials` - Azure credentials
- `**/config/master.key` - Rails master key
- `**/config/credentials.yml.enc` - Rails encrypted credentials

### Package Manager Authentication
- `**/.npmrc` - NPM authentication configuration
- `**/.pypirc` - Python package index credentials

### Java Keystores
- `**/*.jks` - Java KeyStore files
- `**/*.keystore` - Java KeyStore files

### API Keys & Tokens
- `**/*token*` - Any file with "token" in the name
- `**/*oauth*` - OAuth configuration files
- `**/*api-key*` - API key files
- `**/*apikey*` - API key files (alternative naming)

### Authentication Files
- `**/.netrc` - Network authentication file
- `**/.pgpass` - PostgreSQL password file

### SSH Keys
- `**/id_rsa` - RSA SSH private key
- `**/id_ecdsa` - ECDSA SSH private key
- `**/id_ed25519` - Ed25519 SSH private key
- `**/.ssh/*` - All SSH configuration files
- `**/known_hosts` - SSH known hosts

## Implementation Details

### Agent Configuration Format

For subagents (in `agents/*.md`):
```yaml
---
permission:
  read: allow
  # ... other permissions
readDeny:
  - "**/.env"
  - "**/.env.*"
  # ... other patterns
---
```

For main agents (in `opencode.json`):
```json
{
  "agent": {
    "plan": {
      "readDeny": [
        "**/.env",
        "**/.env.*",
        // ... other patterns
      ]
    }
  }
}
```

## Granting Exceptions

If an agent requires access to a sensitive file for a legitimate operation:

1. **Explicit user permission** - The user must explicitly grant access for that specific operation
2. **Temporary scope** - Access should be granted only for the duration of the specific task
3. **Audit trail** - The reason for access should be documented
4. **Principle of least privilege** - Grant access to the minimum necessary files

### How to Grant Access

To grant an agent temporary access to a restricted file:

1. Modify the agent's configuration file temporarily
2. Remove the specific pattern from `readDeny` 
3. Complete the required task
4. Restore the original `readDeny` configuration

**Example**:
```bash
# If you need the developer agent to access .env file temporarily
# 1. Edit agents/developer.md
# 2. Remove "**/.env" from readDeny list
# 3. Perform the required operation
# 4. Restore the original configuration
```

## Security Best Practices

1. **Never commit secrets** - Use environment variables and secret management systems
2. **Use .gitignore** - Ensure sensitive files are excluded from version control
3. **Regular audits** - Periodically review agent permissions and access patterns
4. **Minimal exposure** - Keep sensitive files out of project directories when possible
5. **Secret scanning** - Use tools to detect accidentally committed secrets
6. **Rotate credentials** - If a secret is exposed, rotate it immediately

## Testing Security Restrictions

To verify that security restrictions are working:

```bash
# Create a test .env file
echo "SECRET_KEY=test123" > test.env

# Ask an agent to read it
# The agent should refuse or report an access denied error

# Clean up
rm test.env
```

## Rationale

### Why These Restrictions?

1. **Prevent data leakage** - AI model providers may log or analyze requests
2. **Protect credentials** - Secrets should never be exposed to AI systems
3. **Compliance** - Meet security and privacy requirements
4. **Defense in depth** - Additional layer of protection against accidental exposure
5. **Audit readiness** - Clear access controls for security audits

### What Agents Can Still Do

These restrictions do NOT prevent agents from:
- Reading source code files (`.js`, `.py`, `.go`, etc.)
- Reading configuration files that don't contain secrets
- Reading documentation and test files
- Accessing example/template configuration files (e.g., `.env.example`)
- Normal code development, testing, and review activities

## Maintenance

This security configuration should be reviewed and updated:

- When new types of sensitive files are introduced to projects
- When new secret management patterns emerge
- After security incidents or near-misses
- At least annually as part of security review

## Questions & Support

If you have questions about these security restrictions or need to grant an exception:

1. Review this document thoroughly
2. Consider if there's an alternative approach that doesn't require access
3. Document the business justification for the exception
4. Update this document with new patterns if needed

## Version History

- **2026-03-20** - Initial security configuration implemented
  - Added `readDeny` restrictions to all 8 agents (6 subagents + 2 main agents)
  - Covers 29 file patterns for secrets, credentials, keys, and sensitive configuration
