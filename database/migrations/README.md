# Database Migrations

This folder is reserved for version-controlled database migration scripts.

---

## Migration Guidelines

1. **Baseline Schema**:
   The baseline schema is established in [`database/schema/brightloop_production_schema.sql`](../schema/brightloop_production_schema.sql).

2. **Incremental Changes**:
   Any schema modifications required during development should be added as incremental, timestamped or numbered SQL scripts (e.g., `001_add_column_xyz.sql`) or managed via **Alembic** (`alembic revision --autogenerate`).

3. **Rules for Schema Evolution**:
   - **Never drop columns or tables without team consensus.**
   - Use `ADD COLUMN IF NOT EXISTS` or standard backward-compatible DDL.
   - Enforce check constraints on new monetary values (`*_cents >= 0`).
   - All migrations must be transactional (`BEGIN; ... COMMIT;`).
   - Test migrations against a local development branch before submitting pull requests.

4. **Rollback Policy**:
   Each migration script should document its corresponding downgrade / rollback SQL operations.
