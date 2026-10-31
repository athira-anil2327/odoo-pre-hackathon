# Brightloop Subscription Management System - Database

## Connection Details
* **Host**: `localhost`
* **Port**: `5432`
* **Database**: `odoo_subscriptions`
* **Username**: `postgres`
* **Password**: `postgres`
* **URL**: `postgresql://postgres:postgres@localhost:5432/odoo_subscriptions`

## Files
* [`schema.sql`](file:///home/dona/odoo-pre-hackathon/database/schema.sql): Complete DDL schema including tables, constraints, foreign keys, indexes, and analytics views.
* [`seed.sql`](file:///home/dona/odoo-pre-hackathon/database/seed.sql): Initial demo data matching Brightloop Software scenarios.

## Apply Schema & Seed
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d odoo_subscriptions -f database/schema.sql
PGPASSWORD=postgres psql -h localhost -U postgres -d odoo_subscriptions -f database/seed.sql
```
