# OrgMind AI Backend

Node.js 24, Express 4, TypeScript, PostgreSQL/pgvector, JWT, and Gemini backend compatible with the existing `org_personilazed_chat` frontend and bundled Postman collection.

## Setup

1. Install Node.js 24 and run `npm install`.
2. Update `.env` with the real Aiven password, Gemini key, and a strong random `JWT_SECRET`.
3. Keep `API_PREFIX` empty because the frontend uses root paths and the server has no `/api` route.
4. Run `npm run db:inspect` to confirm the target database state.
5. For a new empty database, run `npm run db:setup` once to initialize the schema and create the Super Admin.
6. Store the generated password securely; the setup command will not print or reset it again.
7. Start with `npm run dev`; the default URL is `http://localhost:8081`.

Set the frontend `API_BASE_URL` to `http://localhost:8081` or the deployed backend origin.

## Scripts

- `npm run dev`: development server with reload.
- `npm run build`: compile to `dist`.
- `npm start`: run compiled server.
- `npm run typecheck`: strict TypeScript check.
- `npm run lint`: ESLint.
- `npm test`: deterministic tests.
- `npm run test:integration`: contract/security/integration suites.
- `npm run db:inspect`: inspect schemas and extensions without writing data.
- `npm run db:setup`: initialize a new empty database and create the first Super Admin.
- `npm run postman`: run the bundled collection against port 8081.

## Security Notes

- Never commit `.env`; it is ignored.
- Configure exact `CORS_ORIGINS`, separated by commas. Wildcards are not accepted.
- Registration dev tokens are disabled unless explicitly enabled outside production.
- Password replacement requires an authenticated session; a future public recovery flow should use a time-limited email token.
- PDF, plain text, Markdown, CSV, and JSON uploads are accepted up to `MAX_UPLOAD_BYTES`.

## Database Setup

First run static and deterministic checks:

```powershell
npm run typecheck
npm test
```

After confirming the database is empty and the CA certificate is configured:

```powershell
npm run db:inspect
npm run db:setup
npm run dev
```

`db:setup` executes `schema.sql` directly and does not create or use a migration-history table. Verify health, login, registration metadata, document ingestion, and grounded generation. Use a dedicated test database for integration tests.

## Troubleshooting

- Startup validation reports missing variable names without printing secrets.
- An extension error means the database account needs pgvector permission.
- Browser CORS failures require the exact frontend origin, including scheme and port.
- Embedding dimension errors mean model output does not match `vector(768)`.
- See `docs/api-contract-audit.md` and `docs/testing-report.md` for assumptions and verification status.
