-- =============================================================================
-- BRIGHTLOOP SOFTWARE - SUBSCRIPTION MANAGEMENT SYSTEM
-- Final team schema | PostgreSQL 14+
--
-- Designed against the Brightloop hackathon problem statement.
-- Covers Group 1 and Group 2:
-- authentication, customers, products, variants, plans, quotations,
-- subscriptions, lifecycle events, discounts, taxes, invoices, payments,
-- and finance reporting.
--
-- IMPORTANT:
--   1. Run this only against a NEW / EMPTY database.
--   2. Run the complete file once in pgAdmin Query Tool.
--   3. Do not run this over an existing schema without a migration/backup.
--   4. Create the first admin account using a trusted backend seed script.
--      Never accept role='admin' or role='staff' from public registration.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 1. ENUM TYPES
-- =============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'staff', 'customer');

CREATE TYPE product_type AS ENUM ('software', 'service', 'addon', 'other');

CREATE TYPE billing_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

CREATE TYPE quotation_status AS ENUM
    ('draft', 'quotation', 'confirmed', 'expired', 'cancelled');

CREATE TYPE subscription_status AS ENUM
    ('draft', 'quotation', 'confirmed', 'active', 'paused', 'closed');

CREATE TYPE subscription_event_type AS ENUM
    ('created', 'quoted', 'confirmed', 'activated', 'paused',
     'resumed', 'renewed', 'closed', 'expired');

CREATE TYPE invoice_status AS ENUM
    ('draft', 'confirmed', 'partially_paid', 'paid', 'cancelled');

CREATE TYPE payment_method_type AS ENUM
    ('bank_transfer', 'upi', 'credit_card', 'debit_card',
     'cash', 'cheque', 'other');

CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

CREATE TYPE discount_scope AS ENUM ('whole_subscription', 'specific_product');

CREATE TYPE tax_application_type AS ENUM ('exclusive', 'inclusive');

-- =============================================================================
-- 2. SEQUENCES FOR HUMAN-READABLE BUSINESS NUMBERS
-- The backend should not accept these numbers from the client.
-- =============================================================================

CREATE SEQUENCE customer_number_seq START 1;
CREATE SEQUENCE quotation_number_seq START 1;
CREATE SEQUENCE subscription_number_seq START 1;
CREATE SEQUENCE invoice_number_seq START 1;
CREATE SEQUENCE payment_number_seq START 1;

-- =============================================================================
-- 3. USERS & AUTHENTICATION
-- =============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    reset_token_hash TEXT,
    reset_token_expiry TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_users_email_not_blank CHECK (length(trim(email)) > 0),
    CONSTRAINT chk_users_name_not_blank CHECK (length(trim(name)) > 0)
);

-- Case-insensitive uniqueness: Alice@example.com and alice@example.com
-- cannot create separate accounts.
CREATE UNIQUE INDEX uq_users_email_lower ON users (lower(email));
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- =============================================================================
-- 4. CUSTOMERS
-- A customer can have a portal account (user_id) or be managed by staff only.
-- =============================================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_number VARCHAR(40) NOT NULL UNIQUE
        DEFAULT (
            'CUST-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
            lpad(nextval('customer_number_seq')::TEXT, 6, '0')
        ),

    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),

    billing_address TEXT,
    tax_id VARCHAR(100),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',

    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_customers_name_not_blank CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_customers_currency CHECK (currency ~ '^[A-Z]{3}$')
);

CREATE INDEX idx_customers_email_lower ON customers(lower(email));
CREATE INDEX idx_customers_number ON customers(customer_number);
CREATE INDEX idx_customers_name_lower ON customers(lower(name));
CREATE INDEX idx_customers_company_lower ON customers(lower(company));

-- =============================================================================
-- 5. PRODUCTS & PRODUCT VARIANTS
-- Effective product price = product.sales_price + variant.price_extra.
-- =============================================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE,
    name VARCHAR(255) NOT NULL,
    type product_type NOT NULL DEFAULT 'software',
    sales_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (sales_price >= 0),
    cost_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_products_name_not_blank CHECK (length(trim(name)) > 0)
);

CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_name_lower ON products(lower(name));
CREATE INDEX idx_products_type ON products(type);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

    attribute_name VARCHAR(100) NOT NULL,
    attribute_value VARCHAR(150) NOT NULL,
    price_extra NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (price_extra >= 0),
    sku VARCHAR(100) UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_product_variant_attribute
        UNIQUE(product_id, attribute_name, attribute_value),

    -- Required for composite foreign keys that ensure a variant belongs
    -- to the same product referenced by a line item.
    CONSTRAINT uq_product_variant_id_product UNIQUE(id, product_id)
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_active ON product_variants(is_active);

-- =============================================================================
-- 6. TAX RULES
-- Tax rates are copied into quotation/subscription/invoice lines as snapshots.
-- =============================================================================

CREATE TABLE tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    tax_code VARCHAR(40) UNIQUE,
    rate NUMERIC(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
    application_type tax_application_type NOT NULL DEFAULT 'exclusive',

    country_code VARCHAR(2),
    state_region VARCHAR(100),

    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_tax_validity
        CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
);

CREATE INDEX idx_tax_rules_active ON tax_rules(is_active);
CREATE INDEX idx_tax_rules_region ON tax_rules(country_code, state_region);

-- =============================================================================
-- 7. SUBSCRIPTION PLANS & INCLUDED PRODUCTS
-- plans.price is the plan-level recurring/base charge.
-- plan_products contains the product lines included in the plan.
-- plan_products.unit_price is an optional price override. When NULL, the
-- backend uses products.sales_price + selected variant.price_extra.
-- =============================================================================

CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    billing_frequency billing_frequency NOT NULL,
    price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    min_quantity INTEGER NOT NULL DEFAULT 1 CHECK (min_quantity >= 1),

    start_date DATE,
    end_date DATE,

    auto_close_on_end BOOLEAN NOT NULL DEFAULT FALSE,
    allow_early_close BOOLEAN NOT NULL DEFAULT TRUE,
    allow_pause BOOLEAN NOT NULL DEFAULT TRUE,
    allow_renewal BOOLEAN NOT NULL DEFAULT TRUE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_plan_dates
        CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_plans_active ON plans(is_active);
CREATE INDEX idx_plans_frequency ON plans(billing_frequency);
CREATE INDEX idx_plans_availability ON plans(start_date, end_date);

CREATE TABLE plan_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID,

    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(14,2) CHECK (unit_price IS NULL OR unit_price >= 0),
    tax_rule_id UUID REFERENCES tax_rules(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_plan_product_variant
        FOREIGN KEY (variant_id, product_id)
        REFERENCES product_variants(id, product_id)
        ON DELETE RESTRICT
);

-- PostgreSQL treats NULL values as distinct in ordinary UNIQUE constraints.
-- These two indexes prevent duplicate plan/product rows both with and
-- without a selected variant, including on PostgreSQL 14.
CREATE UNIQUE INDEX uq_plan_product_without_variant
    ON plan_products(plan_id, product_id)
    WHERE variant_id IS NULL;

CREATE UNIQUE INDEX uq_plan_product_with_variant
    ON plan_products(plan_id, product_id, variant_id)
    WHERE variant_id IS NOT NULL;

CREATE INDEX idx_plan_products_plan ON plan_products(plan_id);
CREATE INDEX idx_plan_products_product ON plan_products(product_id);

-- =============================================================================
-- 8. QUOTATION TEMPLATES & TEMPLATE LINES
-- =============================================================================

CREATE TABLE quotation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    validity_days INTEGER NOT NULL DEFAULT 30 CHECK (validity_days > 0),
    description TEXT,
    terms_and_conditions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quotation_templates_active ON quotation_templates(is_active);

CREATE TABLE quotation_template_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL
        REFERENCES quotation_templates(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID,

    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    -- NULL means use the current effective product/variant price.
    unit_price NUMERIC(14,2) CHECK (unit_price IS NULL OR unit_price >= 0),
    tax_rule_id UUID REFERENCES tax_rules(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_template_line_variant
        FOREIGN KEY (variant_id, product_id)
        REFERENCES product_variants(id, product_id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_template_lines_template ON quotation_template_lines(template_id);

-- =============================================================================
-- 9. DISCOUNTS & DISCOUNT USAGE HISTORY
-- Only admins may create/update discount rules (enforced in Express RBAC).
-- =============================================================================

CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,

    discount_type discount_type NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),

    scope discount_scope NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,

    min_order_amount NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (min_order_amount >= 0),
    min_quantity INTEGER NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),

    -- Optional cap for percentage discounts.
    max_discount_amount NUMERIC(14,2)
        CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),

    start_date DATE,
    end_date DATE,

    max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
    times_used INTEGER NOT NULL DEFAULT 0 CHECK (times_used >= 0),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_discount_scope_product
        CHECK (
            (scope = 'specific_product' AND product_id IS NOT NULL)
            OR
            (scope = 'whole_subscription' AND product_id IS NULL)
        ),
    CONSTRAINT chk_discount_percentage
        CHECK (discount_type <> 'percentage' OR amount <= 100),
    CONSTRAINT chk_discount_dates
        CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_discount_usage_limit
        CHECK (max_uses IS NULL OR times_used <= max_uses)
);

CREATE INDEX idx_discounts_active_dates
    ON discounts(is_active, start_date, end_date);
CREATE INDEX idx_discounts_product ON discounts(product_id);

-- Usage may be associated with a quotation, subscription and/or invoice.
-- The backend must insert usage and increment discounts.times_used in one
-- transaction while locking the discount row FOR UPDATE.
CREATE TABLE discount_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,

    quotation_id UUID,
    subscription_id UUID,
    invoice_id UUID,

    amount_applied NUMERIC(14,2) NOT NULL CHECK (amount_applied >= 0),
    used_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT chk_discount_usage_target
        CHECK (
            quotation_id IS NOT NULL
            OR subscription_id IS NOT NULL
            OR invoice_id IS NOT NULL
        )
);

CREATE INDEX idx_discount_usages_discount ON discount_usages(discount_id);
CREATE INDEX idx_discount_usages_customer ON discount_usages(customer_id);

-- =============================================================================
-- 10. QUOTATIONS & QUOTATION LINES
-- =============================================================================

CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number VARCHAR(50) NOT NULL UNIQUE
        DEFAULT (
            'QT-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
            lpad(nextval('quotation_number_seq')::TEXT, 6, '0')
        ),

    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    template_id UUID REFERENCES quotation_templates(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT,

    status quotation_status NOT NULL DEFAULT 'draft',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    payment_terms VARCHAR(255),

    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
    discount_total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),

    notes TEXT,
    terms_and_conditions TEXT,

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_quotation_dates CHECK (valid_until >= issue_date),
    CONSTRAINT chk_quotation_total
        CHECK (total_amount = subtotal - discount_total + tax_total),
    CONSTRAINT chk_quotation_currency CHECK (currency ~ '^[A-Z]{3}$')
);

CREATE INDEX idx_quotations_customer ON quotations(customer_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_valid_until ON quotations(valid_until);
CREATE INDEX idx_quotations_created_at ON quotations(created_at);

CREATE TABLE quotation_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,

    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID,

    -- Historical snapshots: do not depend on current catalogue names/prices.
    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255),
    description TEXT,

    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
    line_subtotal NUMERIC(14,2) NOT NULL CHECK (line_subtotal >= 0),

    tax_rule_id UUID REFERENCES tax_rules(id) ON DELETE SET NULL,
    tax_rate_snapshot NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (tax_rate_snapshot BETWEEN 0 AND 100),
    tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    line_total NUMERIC(14,2) NOT NULL CHECK (line_total >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_quotation_line_variant
        FOREIGN KEY (variant_id, product_id)
        REFERENCES product_variants(id, product_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_quotation_line_subtotal
        CHECK (line_subtotal = quantity * unit_price),
    CONSTRAINT chk_quotation_line_total
        CHECK (line_total = line_subtotal - discount_amount + tax_amount)
);

CREATE INDEX idx_quotation_lines_quotation ON quotation_lines(quotation_id);
CREATE INDEX idx_quotation_lines_product ON quotation_lines(product_id);

-- =============================================================================
-- 11. SUBSCRIPTIONS, SUBSCRIPTION LINES & LIFECYCLE EVENTS
-- Subscription total_amount is the recurring amount used by finance reporting.
-- Backend calculates it from the plan charge and recurring subscription lines.
-- =============================================================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_number VARCHAR(50) NOT NULL UNIQUE
        DEFAULT (
            'SUB-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
            lpad(nextval('subscription_number_seq')::TEXT, 6, '0')
        ),

    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    quotation_id UUID UNIQUE REFERENCES quotations(id) ON DELETE RESTRICT,
    template_id UUID REFERENCES quotation_templates(id) ON DELETE SET NULL,
    assigned_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
    renewed_from_subscription_id UUID
        REFERENCES subscriptions(id) ON DELETE SET NULL,
    discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL,

    status subscription_status NOT NULL DEFAULT 'draft',
    payment_terms VARCHAR(255) DEFAULT 'Immediate',
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',

    start_date DATE,
    expiry_date DATE,
    next_billing_date DATE,

    paused_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    closure_reason TEXT,

    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),

    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_subscription_dates
        CHECK (expiry_date IS NULL OR start_date IS NULL OR expiry_date >= start_date),
    CONSTRAINT chk_active_subscription_start
        CHECK (status <> 'active' OR start_date IS NOT NULL),
    CONSTRAINT chk_subscription_currency CHECK (currency ~ '^[A-Z]{3}$')
);

CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_staff ON subscriptions(assigned_staff_id);
CREATE INDEX idx_subscriptions_next_billing
    ON subscriptions(next_billing_date)
    WHERE status = 'active';
CREATE INDEX idx_subscriptions_expiry
    ON subscriptions(expiry_date)
    WHERE status = 'active';

CREATE TABLE subscription_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL
        REFERENCES subscriptions(id) ON DELETE CASCADE,

    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID,

    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255),
    description TEXT,

    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
    line_subtotal NUMERIC(14,2) NOT NULL CHECK (line_subtotal >= 0),

    tax_rule_id UUID REFERENCES tax_rules(id) ON DELETE SET NULL,
    tax_rate_snapshot NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (tax_rate_snapshot BETWEEN 0 AND 100),
    tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    line_total NUMERIC(14,2) NOT NULL CHECK (line_total >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_subscription_line_variant
        FOREIGN KEY (variant_id, product_id)
        REFERENCES product_variants(id, product_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_subscription_line_subtotal
        CHECK (line_subtotal = quantity * unit_price),
    CONSTRAINT chk_subscription_line_total
        CHECK (line_total = line_subtotal - discount_amount + tax_amount)
);

CREATE INDEX idx_subscription_lines_subscription
    ON subscription_lines(subscription_id);
CREATE INDEX idx_subscription_lines_product ON subscription_lines(product_id);

CREATE TABLE subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL
        REFERENCES subscriptions(id) ON DELETE RESTRICT,

    event_type subscription_event_type NOT NULL,
    from_status subscription_status,
    to_status subscription_status,

    event_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    notes TEXT,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_subscription_events_subscription
    ON subscription_events(subscription_id, event_date);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);

-- =============================================================================
-- 12. INVOICES & INVOICE LINES
-- One invoice per subscription + billing_period_start.
-- Cancelled invoices retain their unique period key: do not delete/recreate
-- a cancelled invoice to rebill. Use an explicit controlled correction process.
-- =============================================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE
        DEFAULT (
            'INV-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
            lpad(nextval('invoice_number_seq')::TEXT, 6, '0')
        ),

    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,

    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,

    currency VARCHAR(3) NOT NULL DEFAULT 'INR',

    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
    discount_total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),

    paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    outstanding_amount NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (outstanding_amount >= 0),

    status invoice_status NOT NULL DEFAULT 'draft',
    sent_at TIMESTAMPTZ,
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_invoice_period
        CHECK (billing_period_end >= billing_period_start),
    CONSTRAINT chk_invoice_due_date CHECK (due_date >= invoice_date),
    CONSTRAINT chk_invoice_paid_amount CHECK (paid_amount <= total_amount),
    CONSTRAINT chk_invoice_balance
        CHECK (outstanding_amount = total_amount - paid_amount),
    CONSTRAINT chk_invoice_total
        CHECK (total_amount = subtotal - discount_total + tax_total),
    CONSTRAINT chk_invoice_currency CHECK (currency ~ '^[A-Z]{3}$'),

    -- Idempotency guard: one invoice for a subscription and billing-period
    -- start, even if two billing workers run at the same time.
    CONSTRAINT uq_invoice_subscription_period
        UNIQUE(subscription_id, billing_period_start)
);

CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_overdue
    ON invoices(due_date)
    WHERE status IN ('confirmed', 'partially_paid')
      AND outstanding_amount > 0;

CREATE TABLE invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,

    -- Historical snapshots keep old invoices readable after catalogue edits.
    product_name VARCHAR(255),
    variant_name VARCHAR(255),
    description TEXT NOT NULL,

    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
    line_subtotal NUMERIC(14,2) NOT NULL CHECK (line_subtotal >= 0),

    tax_rule_id UUID REFERENCES tax_rules(id) ON DELETE SET NULL,
    tax_rate_snapshot NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (tax_rate_snapshot BETWEEN 0 AND 100),
    tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    line_total NUMERIC(14,2) NOT NULL CHECK (line_total >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_invoice_line_period CHECK (period_end >= period_start),
    CONSTRAINT chk_invoice_line_subtotal
        CHECK (line_subtotal = quantity * unit_price),
    CONSTRAINT chk_invoice_line_total
        CHECK (line_total = line_subtotal - discount_amount + tax_amount)
);

CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);
CREATE INDEX idx_invoice_lines_product ON invoice_lines(product_id);

-- =============================================================================
-- 13. DISCOUNT USAGE FOREIGN KEYS
-- Added after quotations, subscriptions and invoices exist.
-- =============================================================================

ALTER TABLE discount_usages
    ADD CONSTRAINT fk_discount_usage_quotation
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE RESTRICT;

ALTER TABLE discount_usages
    ADD CONSTRAINT fk_discount_usage_subscription
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE RESTRICT;

ALTER TABLE discount_usages
    ADD CONSTRAINT fk_discount_usage_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT;

-- =============================================================================
-- 14. PAYMENTS
-- Each row represents a payment recorded against one invoice.
-- Multiple rows per invoice support partial payments.
-- =============================================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number VARCHAR(50) NOT NULL UNIQUE
        DEFAULT (
            'PAY-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
            lpad(nextval('payment_number_seq')::TEXT, 6, '0')
        ),

    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    payment_method payment_method_type NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,

    note TEXT,
    reference_number VARCHAR(150),
    idempotency_key VARCHAR(128) UNIQUE,

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_payment_currency CHECK (currency ~ '^[A-Z]{3}$')
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_method ON payments(payment_method);

-- =============================================================================
-- 15. AUDIT LOGS
-- Useful for tracking administrative and operational changes.
-- =============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =============================================================================
-- 16. UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_product_variants_updated_at
BEFORE UPDATE ON product_variants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tax_rules_updated_at
BEFORE UPDATE ON tax_rules
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_plans_updated_at
BEFORE UPDATE ON plans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_quotation_templates_updated_at
BEFORE UPDATE ON quotation_templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_discounts_updated_at
BEFORE UPDATE ON discounts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_quotations_updated_at
BEFORE UPDATE ON quotations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_subscription_lines_updated_at
BEFORE UPDATE ON subscription_lines
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 17. FINANCE REPORTING VIEWS
-- Results are separated by currency. Never add INR and another currency
-- together into one financial total.
-- =============================================================================

CREATE OR REPLACE VIEW view_finance_summary AS
WITH currencies AS (
    SELECT currency FROM subscriptions
    UNION
    SELECT currency FROM invoices
    UNION
    SELECT currency FROM payments
)
SELECT
    c.currency,

    (
        SELECT COUNT(*)
        FROM subscriptions s
        WHERE s.currency = c.currency
          AND s.status = 'active'
    ) AS active_subscriptions_count,

    (
        SELECT COALESCE(SUM(
            CASE p.billing_frequency
                WHEN 'daily'   THEN s.total_amount * 365.0 / 12.0
                WHEN 'weekly'  THEN s.total_amount * 52.0 / 12.0
                WHEN 'monthly' THEN s.total_amount
                WHEN 'yearly'  THEN s.total_amount / 12.0
            END
        ), 0)
        FROM subscriptions s
        JOIN plans p ON p.id = s.plan_id
        WHERE s.currency = c.currency
          AND s.status = 'active'
    ) AS monthly_recurring_revenue,

    (
        SELECT COALESCE(SUM(p.amount), 0)
        FROM payments p
        WHERE p.currency = c.currency
    ) AS total_revenue_collected,

    (
        SELECT COALESCE(SUM(i.outstanding_amount), 0)
        FROM invoices i
        WHERE i.currency = c.currency
          AND i.status IN ('confirmed', 'partially_paid')
    ) AS total_outstanding_amount,

    (
        SELECT COUNT(*)
        FROM invoices i
        WHERE i.currency = c.currency
          AND i.status IN ('confirmed', 'partially_paid')
          AND i.outstanding_amount > 0
          AND i.due_date < CURRENT_DATE
    ) AS overdue_invoices_count,

    (
        SELECT COALESCE(SUM(i.outstanding_amount), 0)
        FROM invoices i
        WHERE i.currency = c.currency
          AND i.status IN ('confirmed', 'partially_paid')
          AND i.outstanding_amount > 0
          AND i.due_date < CURRENT_DATE
    ) AS overdue_amount

FROM currencies c;

CREATE OR REPLACE VIEW view_overdue_invoices AS
SELECT
    i.id AS invoice_id,
    i.invoice_number,
    i.subscription_id,
    i.customer_id,
    c.customer_number,
    c.name AS customer_name,
    c.email AS customer_email,
    i.currency,
    i.total_amount,
    i.paid_amount,
    i.outstanding_amount,
    i.invoice_date,
    i.due_date,
    (CURRENT_DATE - i.due_date) AS days_overdue
FROM invoices i
JOIN customers c ON c.id = i.customer_id
WHERE i.status IN ('confirmed', 'partially_paid')
  AND i.outstanding_amount > 0
  AND i.due_date < CURRENT_DATE;

CREATE OR REPLACE VIEW view_subscription_summary AS
SELECT
    s.id AS subscription_id,
    s.subscription_number,
    s.customer_id,
    c.customer_number,
    c.name AS customer_name,
    s.plan_id,
    p.name AS plan_name,
    p.billing_frequency,
    s.status,
    s.start_date,
    s.expiry_date,
    s.next_billing_date,
    s.currency,
    s.total_amount
FROM subscriptions s
JOIN customers c ON c.id = s.customer_id
JOIN plans p ON p.id = s.plan_id;

-- =============================================================================
-- 18. SEED DATA
-- These are starter tax rules. Admin can edit/add rules through protected APIs.
-- =============================================================================

INSERT INTO tax_rules
    (name, tax_code, rate, application_type, country_code, is_active)
VALUES
    ('Standard GST 18%', 'GST18', 18.00, 'exclusive', 'IN', TRUE),
    ('Zero Rate / Exempt', 'EXEMPT', 0.00, 'exclusive', NULL, TRUE)
ON CONFLICT (tax_code) DO NOTHING;

COMMIT;

-- =============================================================================
-- 19. IMPORTANT BACKEND IMPLEMENTATION RULES
--
-- AUTHENTICATION
--   * Public registration must always create role='customer'.
--   * Only an authenticated admin can create staff users.
--   * Hash passwords with bcrypt/argon2; never store plaintext passwords.
--   * Store only a hash of password-reset tokens; enforce expiry.
--   * Enforce the PDF password policy in backend validation.
--
-- CUSTOMER DATA ISOLATION
--   * Customer endpoints must derive customer_id from the authenticated user.
--   * Never trust a customer_id supplied by a customer request body/query.
--   * Staff/admin access must be checked with RBAC middleware.
--
-- QUOTATION / SUBSCRIPTION
--   * Create quotation lines and totals in a transaction.
--   * On confirmation, create the subscription and copy line snapshots.
--   * Validate plans.min_quantity against the relevant total quantity.
--   * Validate plan availability dates and lifecycle flags in backend services.
--   * Log every lifecycle transition in subscription_events in the same
--     transaction as the subscription status update.
--
-- BILLING / INVOICE IDEMPOTENCY
--   * Select due active subscriptions using next_billing_date <= CURRENT_DATE.
--   * Create invoice + invoice lines in a transaction.
--   * The unique (subscription_id, billing_period_start) constraint is the
--     final duplicate-billing guard. Handle unique-violation conflicts safely.
--   * Advance next_billing_date only after successful invoice creation.
--
-- PAYMENTS
--   * Record a payment in a transaction.
--   * SELECT the invoice FOR UPDATE before applying a payment.
--   * Check payment currency matches invoice currency.
--   * Reject an amount greater than outstanding_amount unless overpayments/
--     customer credits are explicitly implemented.
--   * Recalculate paid_amount from recorded payments, then set
--     outstanding_amount = total_amount - paid_amount.
--   * Set status to partially_paid or paid as appropriate.
--   * Do not count cancelled invoices as receivables.
--
-- DISCOUNTS
--   * Lock the discount row FOR UPDATE when applying a discount.
--   * Check is_active, start_date, end_date, min_order_amount, min_quantity,
--     scope/product eligibility and max_uses.
--   * Insert discount_usages and increment times_used in the same transaction.
--
-- PRICING
--   * Effective product unit price = products.sales_price + variant.price_extra.
--   * A plan_products/template line unit_price override takes precedence when
--     non-NULL; otherwise use the effective product price.
--   * Persist product/variant names, prices, tax rates and discount amounts as
--     snapshots in quotation_lines, subscription_lines and invoice_lines.
--   * Keep monetary calculations in NUMERIC and round consistently to 2 places.
--
-- PERFORMANCE
--   * Use pagination for customer, quotation, subscription and invoice lists.
--   * Filter/index on status, customer_id, plan_id, next_billing_date and due_date.
--   * Use EXPLAIN ANALYZE on slow dashboard/list queries.
-- =============================================================================
