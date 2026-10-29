# OrgMind AI Backend

Node.js 24, Express 4, TypeScript, PostgreSQL/pgvector, JWT, and Gemini backend compatible with the existing `org_personilazed_chat` frontend and bundled Postman collection.

## Setup

1. Install Node.js 24 and run `npm install`.
2. Update `.env` with the real Aiven password, Gemini key, and a strong random `JWT_SECRET`.
3. Keep `API_PREFIX` empty because the frontend uses root paths and the server has no `/api` route.
4. Review `docs/database-schema-audit.md`, back up the database, and test against a staging clone.
5. Run `npm run migrate` only after schema review.
6. Start with `npm run dev`; the default URL is `http://localhost:8081`.

Set the frontend `API_BASE_URL` to `http://localhost:8081` or the deployed backend origin.

## Scripts

- `npm run dev`: development server with reload.
- `npm run build`: compile to `dist`.
- `npm start`: run compiled server.
- `npm run typecheck`: strict TypeScript check.
- `npm run lint`: ESLint.
- `npm test`: deterministic tests.
- `npm run test:integration`: contract/security/integration suites.
- `npm run migrate`: apply pending SQL migrations.
- `npm run postman`: run the bundled collection against port 8081.

## Security Notes

- Never commit `.env`; it is ignored.
- Configure exact `CORS_ORIGINS`, separated by commas. Wildcards are not accepted.
- Registration dev tokens are disabled unless explicitly enabled outside production.
- Forgot-password behavior is retained for contract compatibility but should eventually use a time-limited email verification flow.
- PDF, plain text, Markdown, CSV, and JSON uploads are accepted up to `MAX_UPLOAD_BYTES`.

## Migration Procedure

First run static and deterministic checks:

```powershell
npm run typecheck
npm test
```

After a backup and staging verification:

```powershell
npm run migrate
npm run dev
```

Verify health, registration metadata, registration/login, document ingestion, and grounded generation. Use a dedicated test database for integration tests; never point destructive tests at production.

## Troubleshooting

- Startup validation reports missing variable names without printing secrets.
- An extension error means the database account needs pgvector permission.
- Browser CORS failures require the exact frontend origin, including scheme and port.
- Embedding dimension errors mean model output does not match `vector(768)`.
- See `docs/api-contract-audit.md` and `docs/testing-report.md` for assumptions and verification status.
