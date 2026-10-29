# API Contract Audit

## Sources

- `postman_collection.json`: 48 requests. It contains request definitions but no saved responses and no assertions except login token extraction.
- Frontend: `org_personilazed_chat/src/services` plus Login, Register, and Dashboard pages.
- Existing backend: unavailable; this repository previously contained only a README.
- Live database schema: unavailable because the password is intentionally a placeholder.

The collection and frontend use root paths. `API_PREFIX` therefore defaults to empty; `/api` is not introduced.

## Endpoint Inventory

| Method | Path | Authentication | Contract notes |
|---|---|---|---|
| GET | `/actuator/health` | Public | Exact `{ "status": "UP" }` response |
| POST | `/user/register` | Public | JSON registration; optional `registrationToken` |
| POST | `/user/login` | Public | JSON username/password |
| POST | `/user/refresh-token` | Public | JSON refresh token |
| POST | `/user/logout` | Bearer | Revokes active refresh tokens |
| POST | `/user/forgot-password` | Public, rate limited | URL-encoded username/newPassword |
| GET, POST | `/department` | Bearer; Super Admin writes | List/create |
| GET, PUT, DELETE | `/department/:id` | Bearer; Super Admin writes | Read/update/soft-delete |
| GET, POST | `/role` | Bearer; Super Admin writes | List/create |
| GET | `/role/department/:departmentId` | Bearer | Department-filtered roles |
| GET, PUT, DELETE | `/role/:id` | Bearer; Super Admin writes | Read/update/soft-delete |
| GET, POST | `/organization` | Super Admin | Scoped list/create |
| GET, PUT, DELETE | `/organization/:id` | Super Admin | Frontend service compatibility |
| PUT | `/organization/:id/activate` | Admin | Same-organization only |
| PUT | `/organization/:id/deactivate` | Admin | Same-organization only |
| GET | `/registration/metadata` | Public | `organizationId`, optional `departmentId` |
| GET | `/registration/resolve` | Public | `token`, optional `departmentId` |
| GET | `/registration/dev/create-token` | Dev-only | Disabled by default and in production |
| POST, GET | `/ingestion-requests` | Bearer; admin list | Multipart submission/list |
| GET | `/ingestion-requests/mine` | Bearer | Current user's submissions |
| POST | `/ingestion-requests/approve` | Admin | JSON review object |
| POST, GET | `/ai/generate` | Bearer | JSON or query message |
| GET | `/ai/check-ingestion` | Bearer | Query `query` |
| POST | `/ai/admin/ingest` | Admin | Multipart `file` |
| POST | `/ai/admin/ingest-multiple` | Admin | Repeated multipart `files` |
| POST | `/ai/admin/ingest-from-url` | Admin | URL-encoded `url` |
| GET | `/chat-history/user/:userId` | Bearer, owner/admin | Ordered newest first |
| GET | `/chat-history/user/:userId/category/:category` | Bearer, owner/admin | Category filter |
| DELETE | `/chat-history/user/:userId` | Bearer, owner/admin | Delete user history |
| GET, PUT, DELETE | `/chat-history/:id` | Bearer, owner/admin | Read/update/delete |
| POST | `/chat-history` | Bearer, owner/admin | URL-encoded history fields |
| GET, PUT | `/settings/:userId` | Bearer, owner/admin | Read/update |
| PUT | `/settings/:userId/dark-mode` | Bearer, owner/admin | Toggle |
| PUT | `/settings/:userId/sidebar-position` | Bearer, owner/admin | Query `position` |
| PUT | `/user/:id/role` | Admin | Query `roleId` |
| PUT | `/user/:id/activate` | Admin | Scoped activation |
| PUT | `/user/:id/deactivate` | Admin | Scoped deactivation |

## Frontend Contract Inventory

- Login accepts `token`, `accessToken`, or `jwt`, and consumes user, department, role, refresh-token, and admin fields.
- Metadata consumes `data.departments` and `data.roles`, each with numeric `id` and string `name`.
- Dashboard list extraction accepts direct arrays or arrays under `data`, `items`, `results`, or `content`.
- AI text extraction checks `reply`, `response`, `text`, `output`, `data`, and `message`.
- Browser requests use Bearer auth except public auth, metadata, and health routes.

## Compatibility Decisions

- Frontend registration omits `registrationToken`; it remains optional.
- Collection metadata includes `departmentId`; frontend omits it. Both are supported.
- Some collection history requests omit Authorization. They are protected because public tenant history would violate the security requirements.
- Collection examples name `gemini-3.6-flash`; server generation is fixed by `GEMINI_GENERATION_MODEL=gemini-2.5-flash`. Client labels are stored but cannot override the model.
- AI responses expose both `response` and `reply`, while retaining the success envelope.

Routes delegate to controllers and scoped services. Authentication reloads active membership from PostgreSQL. Every tenant-owned query includes organization scope, and vector retrieval includes department scope.

