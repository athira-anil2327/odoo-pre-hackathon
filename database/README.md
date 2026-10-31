# BrightLoop Database Architecture

This directory contains the database schema, migration guidelines, seed definitions, verification scripts, and developer tooling for the **BrightLoop Subscription Management System**.

---

## 1. Centralized Database Connection Information

The development database is hosted centrally on the host laptop over a private **Tailscale** network mesh.

| Parameter | Value | Notes |
| :--- | :--- | :--- |
| **Engine** | PostgreSQL 18.1 | Native local host deployment |
| **Database Name** | `brightloop_db` | UTF-8 encoding |
| **Database User** | `brightloop` | Dedicated non-superuser app account |
| **Port** | `5432` | Standard PostgreSQL port |
| **Host (Tailscale IP)** | `100.127.203.13` | Host's private Tailscale IPv4 address |
| **Host (Local)** | `127.0.0.1` | Local loopback (for host laptop only) |
| **Authentication** | `SCRAM-SHA-256` | Enforced in `pg_hba.conf` |
| **Password** | `<DB_PASSWORD>` | *Obtain securely from team admin; never commit to Git* |

### Connection String Formats (FastAPI Backend)

- **Synchronous Engine (`psycopg` 3)**:
  ```text
  postgresql+psycopg://brightloop:<DB_PASSWORD>@100.127.203.13:5432/brightloop_db
  ```
- **Asynchronous Engine (`psycopg_async`)**:
  ```text
  postgresql+psycopg_async://brightloop:<DB_PASSWORD>@100.127.203.13:5432/brightloop_db
  ```

---

## 2. Directory Structure

```
database/
├── schema/
│   └── brightloop_production_schema.sql  # Full 22-table DDL, types, triggers, views, and seed data
├── migrations/
│   └── README.md                         # Schema migration standards and versioning policies
├── seeds/
│   └── README.md                         # System seed documentation (roles, tax rules, sample data)
├── verification/
│   └── verify_schema_structure.sql       # Automated catalog test checking tables, indexes & triggers
├── scripts/
│   ├── README.md                         # Script documentation and helper instructions
│   ├── teammate_test_connection.py       # Python script for teammates to verify Tailscale connectivity
│   └── TEAMMATE_SETUP_GUIDE.md           # Step-by-step setup guide for Windows, macOS, and Linux
├── .env.example                          # Environment variable configuration template
└── README.md                             # This file
```

---

## 3. Schema Overview

The database contains **22 domain tables**, **3 analytical reporting views**, **6 performance/constraint indexes**, and **5 automated triggers**:

### Core Domains
1. **Access Control & Profiles**: `roles`, `users`, `user_roles`, `customer_profiles`
2. **Product Catalog & Pricing**: `products`, `product_variants`, `plans`
3. **Quotation & CPQ**: `quotation_templates`, `quotation_template_items`, `quotations`, `quotation_line_items`
4. **Subscription Lifecycle**: `subscriptions`, `subscription_line_items`, `subscription_state_transitions`
   - Lifecycle: `draft` → `quotation` → `confirmed` → `active` → `closed`
   - Native support for pausing, resuming, renewals, and early closures
5. **Taxation & Discounts**: `tax_rules`, `discounts`, `discount_redemptions`
   - Atomic discount redemption locking (`SELECT FOR UPDATE`) prevents concurrent over-redemption
6. **Billing & Invoices**: `invoices`, `invoice_line_items`, `invoice_tax_breakdowns`
   - Lifecycle: `draft` → `confirmed` → `paid`
   - Partial payments tracked by `amount_paid_cents` and `amount_due_cents`
   - Overdue tracked via due dates and balances (supported by index `idx_invoices_overdue`)
   - Cycle duplicate prevention via unique index `uq_invoices_subscription_billing_period`
7. **Payments & Ledger**: `payment_transactions` (multiple partial payments, idempotency keys, refunds)
   - Trigger `sync_invoice_payments` automatically recalculates balances and marks invoices `paid`
8. **Audit**: `audit_logs`
9. **Analytical Views**:
   - `view_mrr_summary`: Computes normalized MRR and ARR across billing frequencies
   - `view_overdue_aging_summary`: Aging buckets (`current`, `1_to_30_days`, `31_to_60_days`, `61_to_90_days`, `90_plus_days`)
   - `view_subscription_dashboard_metrics`: Live subscriber counts by lifecycle state

---

## 4. Verification

To verify that the database objects are present on any running database instance, execute:

```bash
psql -h 100.127.203.13 -U brightloop -d brightloop_db -f database/verification/verify_schema_structure.sql
```

Expected status:
```text
STATUS: ALL STRUCTURE CHECKS PASSED PERFECTLY! (22/22 Tables, 3/3 Views, 6/6 Indexes, 5/5 Triggers)
```

---

## 5. Security Policies

- **No Plaintext Passwords**: Database credentials must only be stored in your uncommitted `.env` file.
- **Firewall Isolation**: Port 5432 is bound strictly to `127.0.0.1` and the private Tailscale IP `100.127.203.13`. It is not accessible from the public internet or external LANs.
- **SCRAM-SHA-256**: All user connections require modern SCRAM password hashing.
