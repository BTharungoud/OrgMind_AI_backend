# Database Schema Audit

## Inspection Status

The supplied URI contains a placeholder password. No live connection, schema inspection, migration, or data operation was performed. Existing tables, constraints, pgvector version, data, and embedding dimensions remain unverified.

## Safe Strategy

`001_initial_schema.sql` is additive and creates a dedicated `orgmind` schema. It does not drop, truncate, or rename existing objects. `public.orgmind_schema_migrations` records applied files. Minimal default catalog records use `ON CONFLICT DO NOTHING`.

Mappings:

- `organization`: tenant boundary.
- `department`, `role`: scoped catalogs.
- `app_user`, tokens, `user_settings`: identity and preferences.
- `ingestion_request`: approval queue.
- `document`, `document_chunk`: ingestion state and `vector(768)` embeddings.
- `chat_history`: scoped turns and citations.

## Checks Required Before Migration

1. Confirm the Aiven account can create the `vector` extension and `orgmind` schema.
2. Identify legacy tables/data that must be mapped.
3. Confirm existing embedding model and dimensions.
4. Back up the database and test against a staging clone.
5. Update this audit from actual catalog queries before production deployment.

`EMBEDDING_DIMENSIONS` must remain 768 for this migration. A change requires a versioned schema and re-embedding plan.

