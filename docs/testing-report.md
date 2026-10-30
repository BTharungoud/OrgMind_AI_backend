# Testing Report

## Coverage Added

- Unit: text chunking.
- Contract: actuator response, login validation, and CORS.
- Security: anonymous and invalid-token rejection.
- Database integration: intentionally skipped until a disposable pgvector test database is configured.

## External Verification Pending

- Aiven connectivity and read-only schema inspection: verified with the supplied CA certificate.
- Direct database setup: verified against the initially empty Aiven database without a migration-history table.
- Super Admin login: verified through `POST /user/login`; access and refresh tokens were returned.
- Gemini generation and embeddings: API key is a placeholder.
- Newman: requires a running initialized backend and valid credentials.

## Verified on Node.js 24.11.1

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm test`: 12 passed, 1 skipped; the skipped suite requires a disposable pgvector database.
- `npm run test:integration`: 10 passed, 1 skipped; contract/security passed and live database integration was skipped.
- `npm audit --omit=dev`: 0 vulnerabilities.

Newman is invoked on demand through `npx` instead of being installed in the application dependency tree because Newman's current transitive toolchain reports known development-time advisories. The production dependency graph remains clean.

