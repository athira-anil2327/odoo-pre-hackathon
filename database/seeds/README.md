# Database Seeds & Fixtures

This directory contains seed data definitions and sample fixtures for development and testing.

---

## 1. Core Built-In Seeds

The baseline schema [`database/schema/brightloop_production_schema.sql`](../schema/brightloop_production_schema.sql) automatically provisions:

### System Roles (`roles` table)
| Role Name | Description |
| :--- | :--- |
| `admin` | Full platform administrative access to all subscriptions, billing, and system settings. |
| `staff` | Sales and support staff access for quotations, plan configurations, and dunning. |
| `customer` | Subscriber self-service portal access for invoices, payments, and account details. |

### Standard Tax Rules (`tax_rules` table)
| Rule Name | Tax Code | Type | Rate (%) | Country |
| :--- | :--- | :--- | :--- | :--- |
| `Standard GST (18%)` | `GST18` | Exclusive | 18.00% | IN |
| `Standard VAT (20%)` | `VAT20` | Exclusive | 20.00% | GB |
| `Zero Rate / Tax-Exempt` | `EXEMPT` | Exclusive | 0.00% | Global (NULL) |

---

## 2. Adding Development Fixtures

To add sample products, plans, or test subscriptions for frontend/backend integration testing:
1. Create a script named `seed_dev_data.sql` in this directory.
2. Use idempotent insertion patterns (`ON CONFLICT (...) DO NOTHING;`).
3. Ensure monetary figures use integer cents (`price_cents`).
4. Avoid committing real personal data or production passwords.
