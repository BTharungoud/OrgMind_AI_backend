# Architecture

Requests pass through correlation IDs, Helmet, CORS allowlisting, body parsers, route rate limits, authentication, authorization, controllers, services, and centralized error handling.

JWT claims identify a session, but each protected request reloads active organization, role, and department membership from PostgreSQL. Resource queries include organization scope. Department admins are limited to their department for ingestion and retrieval; Super Admin can operate across its organization.

Ingestion creates a `PROCESSING` document, extracts validated text, chunks it, generates dimension-checked embeddings, writes chunks transactionally, and marks it `INDEXED`. Failures mark it `FAILED`.

Chat embeds the query, retrieves scoped chunks with cosine distance, requests structured JSON from Gemini, validates citation IDs against retrieved rows, persists the turn, and returns compatibility aliases.

