# Security Policy & Architecture

## 1. Security Overview & Philosophy
Habo Web is built with privacy and security as non-negotiable core principles. Our security architecture ensures that user habit tracking data, account credentials, and personal notes are safeguarded against unauthorized access, data leaks, and malicious exploitation.

---

## 2. Supported Versions

| Version | Supported | Security Maintenance |
| :--- | :--- | :--- |
| 1.x.x (Current Production) | ✅ Yes | Active patches and vulnerability fixes |
| < 1.0.0 (Pre-releases) | ❌ No | Deprecated |

---

## 3. Reporting a Vulnerability

If you discover a potential security vulnerability within Habo Web:
1. **Do not create public GitHub issues or social media disclosures.**
2. Send an email to **security@habo.space** (or open a Private Vulnerability Advisory on GitHub).
3. Include the following details:
   - Vulnerability classification (e.g. CSRF, IDOR, Injection, Auth Bypass).
   - Step-by-step reproduction instructions or proof-of-concept (PoC).
   - Affected URLs, endpoints, or components.
   - Estimated impact and recommended remediation.
4. **Response SLA:**
   - **Acknowledgment:** Within 24 hours.
   - **Assessment & Triage:** Within 48 hours.
   - **Patch Release:** Target within 5–7 business days depending on severity.

---

## 4. Production Security Controls & Threat Mitigations

### 4.1 Authentication & Session Security
- **Passwords:** Hashed with Argon2id / PBKDF2 (or bcrypt with salt work factor 12). Plaintext passwords are never stored or logged.
- **Cookies:** Session cookies are marked:
  - `HttpOnly`: Prevents client-side script access (mitigating XSS session theft).
  - `Secure`: Transmitted only over HTTPS.
  - `SameSite=Lax` (or `Strict`): Prevents Cross-Site Request Forgery (CSRF).
- **Session Expiry:** Sessions have an idle timeout of 14 days and absolute timeout of 30 days.

### 4.2 Data Isolation & Authorization (Anti-IDOR)
- **Tenant Isolation:** Every single database query or mutation in Mongoose **must** bind directly to the authenticated user's session `userId`:
  ```typescript
  // Secure Pattern:
  const entry = await HabitEntry.findOne({ _id: entryId, userId: session.userId });
  if (!entry) throw new ForbiddenError();
  ```
- No user can read, query, update, or delete another user's habits, categories, or streak history.

### 4.3 Database Injection Prevention
- **NoSQL Operator Sanitization:** User inputs undergo runtime validation via Zod schemas. Any payload keys containing `$` (e.g., `$gt`, `$ne`, `$where`) are stripped before Mongoose query parsing.
- Parameterized queries are enforced across all database queries.

### 4.4 HTTP Security Headers & Middleware
Production servers must enforce the following security headers:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none';
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

### 4.5 Rate Limiting & Abuse Prevention
- **Authentication Endpoints:** Strict rate limit of 5 failed login attempts per minute per IP address.
- **API Operations:** Global rate limit of 100 requests per minute per authenticated user to prevent DoS scraping.

### 4.6 Cryptographic Integrity & Backup Security
- Exported backup files are encrypted with user-specified passphrases using AES-GCM (256-bit key) or downloaded as raw JSON solely by authenticated account holders over TLS 1.3.
