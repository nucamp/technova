# SSH Keys - SECURITY VULNERABILITY!

## ⚠️ INTENTIONAL SECURITY FLAW ⚠️

This directory contains SSH private keys that are **intentionally committed to the repository** as part of the cybersecurity training lab.

## Educational Purpose

This demonstrates a critical security mistake: **Never commit private keys to version control!**

## What Students Will Learn

1. **Secret Scanning**: How to find exposed credentials in Git history
2. **Attack Vector**: How attackers can gain unauthorized SSH access
3. **Remediation**: How to:
   - Revoke compromised keys
   - Rotate credentials
   - Use `.gitignore` properly
   - Implement secret scanning tools (git-secrets, TruffleHog, etc.)

## Using These Keys

To SSH into the backend container:
```bash
ssh -i ssh-keys/id_rsa technova@localhost -p 2222
```

## In Production

**NEVER** do this in a real application! Always:
- Use `.gitignore` for sensitive files
- Use secret management tools (Vault, AWS Secrets Manager, etc.)
- Implement pre-commit hooks to prevent credential commits
- Use SSH key rotation policies
- Implement certificate-based authentication where possible
