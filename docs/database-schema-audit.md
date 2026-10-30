# Database Schema Audit

## Inspection Status

The Aiven database was inspected securely with the supplied CA certificate. It runs PostgreSQL 18.6 with pgvector 0.8.7 and contained no application tables before initialization.

## Safe Strategy

`schema.sql` directly initializes the dedicated `orgmind` schema for a new empty database. It does not create a migration-history table and does not drop or truncate objects. Minimal default catalog records use `ON CONFLICT DO NOTHING`.

Mappings:

- `organization`: tenant boundary.
- `department`, `role`: scoped catalogs.
- `app_user`, tokens, `user_settings`: identity and preferences.
- `ingestion_request`: approval queue.
- `document`, `document_chunk`: ingestion state and `vector(768)` embeddings.
- `chat_history`: scoped turns and citations.

## Setup Safety

1. `db:inspect` is read-only and should be run before setup.
2. `db:setup` is intended for a new empty database.
3. The bootstrap refuses to replace an existing Super Admin password.
4. The Aiven CA certificate is required and certificate verification remains enabled.

`EMBEDDING_DIMENSIONS` must remain 768 for this schema. A change requires a separate embedding space and re-embedding plan.

