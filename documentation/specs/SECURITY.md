# Security Specification & Architecture — HeatMaps

## 1. Security Overview
HeatMaps adheres to a **Zero-Knowledge, Zero-Server** security model. Because all habit data is stored directly on the user's local device (browser LocalStorage and future native Desktop storage), there is no centralized database holding user habit data to hack, breach, or subpoena.

---

## 2. Threat Mitigations & Architectural Defenses

| Threat Vector | Mitigation in HeatMaps |
| :--- | :--- |
| **Central Database Breaches** | **Zero Risk:** No cloud database (MongoDB has been completely eliminated). All data lives solely on the user's physical machine. |
| **Remote Data Exfiltration** | **Zero Telemetry:** The app makes zero external network calls to log habits, analytics, or behavioral telemetry. |
| **Broken Object Level Auth (IDOR)** | **Architecturally Eliminated:** No remote multi-tenant database endpoints exist; data isolation is enforced at the physical machine boundary. |
| **Cross-Site Scripting (XSS)** | React JSX HTML-escaping + Strict Content Security Policy (CSP) blocking untrusted inline scripts and disallowing unauthorized domains. |
| **Backup File Tampering** | Runtime JSON validation on imported backup files prevents prototype pollution and invalid state injection. |
| **Clickjacking** | `X-Frame-Options: DENY` and `frame-ancestors 'none'` prevent embedding in malicious iframes. |
| **Man-In-The-Middle (MitM)** | HTTP Strict Transport Security (HSTS) with `max-age=63072000; includeSubDomains; preload`. |

---

## 3. Desktop Application Security Model (Windows, Linux, macOS)
In future standalone desktop releases:
1. **Sandboxed Webview:** Native wrappers (Tauri / Electron) run with sandboxed webview permissions and disabled node integration in renderer frames.
2. **Local Storage Encryption / Access Control:** Desktop data files are saved inside OS-level user data directories (`%APPDATA%` / `~/.config/`), inheriting operating system user file access restrictions.
3. **No Background Telemetry:** Binary distributions run completely offline with no network pinging or updater callbacks without user consent.

---

## 4. Responsible Disclosure SLA
* **Security Contact:** security@heatmaps.local (or GitHub repository issues)
* **Acknowledgment:** Within 24 hours.
* **Triage & Patch Release:** 5 business days for critical issues.
