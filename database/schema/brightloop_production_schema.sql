-- ==============================================================================
-- BrightLoop Subscription Management System - Production Schema DDL
-- Compatible with PostgreSQL 15+ (tested on PostgreSQL 18)
-- 
-- Execution:
--   psql -v ON_ERROR_STOP=1 -U brightloop -d brightloop_db -f scripts/brightloop_production_schema.sql
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ------------------------------------------------------------------------------
-- 2. ENUMERATED TYPES
-- ------------------------------------------------------------------------------

-- Product classification
DO $$ BEGIN
    CREATE TYPE product_type AS ENUM (
        'recurring',     -- Subscription plans, recurrent services
        'one_time',      -- Onboarding fees, hardware, licenses
        'metered'        -- Usage-based add-ons (storage, bandwidth, API calls)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Billing frequencies
DO $$ BEGIN
    CREATE TYPE billing_interval AS ENUM (
        'day',           -- Daily billing
        'week',          -- Weekly billing
        'month',         -- Monthly billing
        'year'           -- Annual/yearly billing
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Subscription lifecycle: Draft -> Quotation -> Confirmed -> Active -> Closed
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM (
        'draft',         -- Initial subscription setup
        'quotation',     -- Pending quotation approval
        'confirmed',     -- Approved quote, awaiting initial activation/payment
        'active',        -- Currently running and in service
        'paused',        -- Temporarily suspended/paused by customer or staff
        'closed'         -- Terminated, expired, or closed early
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Quotation status: Draft -> Sent -> Approved -> Rejected -> Expired -> Converted
DO $$ BEGIN
    CREATE TYPE quotation_status AS ENUM (
        'draft',         -- Being drafted by sales staff
        'sent',          -- Delivered to prospect/customer
        'approved',      -- Accepted by customer
        'rejected',      -- Declined by customer
        'expired',       -- Past validity period
        'converted'      -- Converted into active/confirmed subscription
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Invoice lifecycle: Draft -> Confirmed -> Paid
DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM (
        'draft',         -- Generated, open for edit/review
        'confirmed',     -- Finalized, awaiting payment (subject to overdue tracking)
        'paid',          -- Fully settled
        'void',          -- Canceled/invalidated (allows re-billing the period)
        'uncollectible'  -- Written off as bad debt
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment transaction status
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending',
        'succeeded',
        'failed',
        'refunded',
        'partially_refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment method classification
DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM (
        'card',
        'upi',
        'net_banking',
        'bank_transfer',
        'cash',
        'credits'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Discount calculation mechanism
DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM (
        'percentage',    -- e.g., 20% off
        'fixed_amount'   -- e.g., $15.00 off
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Discount duration policy
DO $$ BEGIN
    CREATE TYPE discount_duration AS ENUM (
        'once',          -- Applies to the first invoice only
        'repeating',     -- Applies for N recurring billing cycles
        'forever'        -- Permanently discounted for the subscription lifetime
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tax application method
DO $$ BEGIN
    CREATE TYPE tax_type AS ENUM (
        'exclusive',     -- Tax added on top of subtotal
        'inclusive'      -- Tax embedded within item price
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 3. UTILITY FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

-- Generic function to automatically update `updated_at` timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculation helper for accurate subscription renewal billing periods
CREATE OR REPLACE FUNCTION calculate_next_billing_period(
    p_start TIMESTAMPTZ,
    p_interval billing_interval,
    p_interval_count INTEGER DEFAULT 1
) RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN CASE p_interval
        WHEN 'day'   THEN p_start + (p_interval_count || ' days')::INTERVAL
        WHEN 'week'  THEN p_start + (p_interval_count || ' weeks')::INTERVAL
        WHEN 'month' THEN p_start + (p_interval_count || ' months')::INTERVAL
        WHEN 'year'  THEN p_start + (p_interval_count || ' years')::INTERVAL
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ------------------------------------------------------------------------------
-- 4. IDENTITY & ROLE-BASED ACCESS CONTROL (RBAC)
-- ------------------------------------------------------------------------------

-- System Roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Core User Accounts
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- User Roles Junction
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- Customer Billing Profiles (Addresses, VAT/GST IDs, currencies)
CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    tax_id VARCHAR(64),                           -- VAT, GSTIN, or Sales Tax Registration
    tax_exempt BOOLEAN NOT NULL DEFAULT FALSE,    -- Tax exemption flag
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(32),
    country VARCHAR(2) NOT NULL DEFAULT 'US',     -- ISO 3166-1 alpha-2 code
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',   -- Default billing currency
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_customer_profiles
BEFORE UPDATE ON customer_profiles
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ------------------------------------------------------------------------------
-- 5. PRODUCTS & PRODUCT VARIANTS
-- ------------------------------------------------------------------------------

-- Base Products catalog
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) UNIQUE NOT NULL,             -- Unique product identifier / SKU prefix
    description TEXT,
    product_type product_type NOT NULL DEFAULT 'recurring',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_products
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);

-- Product Variants with additional pricing
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,                   -- e.g. "Enterprise Tier", "100GB Storage"
    sku VARCHAR(64) UNIQUE NOT NULL,
    attribute_values JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"tier": "pro", "region": "us-east"}
    additional_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (additional_price_cents >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Enforces that variant belongs strictly to the designated product
    CONSTRAINT uq_product_variants_id_product UNIQUE (id, product_id)
);

CREATE TRIGGER set_timestamp_product_variants
BEFORE UPDATE ON product_variants
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);

-- ------------------------------------------------------------------------------
-- 6. SUBSCRIPTION PLANS
-- ------------------------------------------------------------------------------

-- Plans support daily, weekly, monthly, and yearly recurring intervals
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    base_price_cents INTEGER NOT NULL CHECK (base_price_cents >= 0),
    setup_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (setup_fee_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    interval billing_interval NOT NULL DEFAULT 'month',
    interval_count INTEGER NOT NULL DEFAULT 1 CHECK (interval_count > 0),
    trial_period_days INTEGER NOT NULL DEFAULT 0 CHECK (trial_period_days >= 0),
    min_commitment_months INTEGER NOT NULL DEFAULT 0 CHECK (min_commitment_months >= 0),
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Guarantees variant belongs to the correct base product
    CONSTRAINT fk_plans_product_variant FOREIGN KEY (variant_id, product_id) 
        REFERENCES product_variants(id, product_id) ON DELETE SET NULL
);

CREATE TRIGGER set_timestamp_plans
BEFORE UPDATE ON plans
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_plans_product_id ON plans(product_id);
CREATE INDEX IF NOT EXISTS idx_plans_interval ON plans(interval);

-- ------------------------------------------------------------------------------
-- 7. TAXATION & DISCOUNT RULES
-- ------------------------------------------------------------------------------

-- Tax Rules (e.g. GST, VAT, State Sales Tax)
CREATE TABLE IF NOT EXISTS tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,                   -- e.g. "Standard GST 18%", "EU VAT"
    tax_code VARCHAR(32),
    tax_type tax_type NOT NULL DEFAULT 'exclusive',
    rate_percent NUMERIC(5, 2) NOT NULL CHECK (rate_percent >= 0.00 AND rate_percent <= 100.00),
    country VARCHAR(2),                           -- Optional ISO country filter
    state_province VARCHAR(100),                  -- Optional state/province filter
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_tax_validity CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

CREATE TRIGGER set_timestamp_tax_rules
BEFORE UPDATE ON tax_rules
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Discount & Coupon Rules
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code CITEXT UNIQUE NOT NULL,                  -- Promo code, e.g. "SUMMER50"
    description VARCHAR(255),
    discount_type discount_type NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    duration discount_duration NOT NULL DEFAULT 'once',
    duration_in_cycles INTEGER CHECK (duration_in_cycles IS NULL OR duration_in_cycles > 0),
    min_order_cents INTEGER NOT NULL DEFAULT 0 CHECK (min_order_cents >= 0),
    max_discount_cents INTEGER CHECK (max_discount_cents IS NULL OR max_discount_cents > 0),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    max_redemptions INTEGER CHECK (max_redemptions IS NULL OR max_redemptions > 0),
    times_redeemed INTEGER NOT NULL DEFAULT 0 CHECK (times_redeemed >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_discount_dates CHECK (expires_at IS NULL OR expires_at >= starts_at),
    CONSTRAINT chk_discount_redemptions CHECK (max_redemptions IS NULL OR times_redeemed <= max_redemptions)
);

CREATE TRIGGER set_timestamp_discounts
BEFORE UPDATE ON discounts
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);

-- ------------------------------------------------------------------------------
-- 8. QUOTATIONS & TEMPLATES (CPQ)
-- ------------------------------------------------------------------------------

-- Reusable Quotation Templates
CREATE TABLE IF NOT EXISTS quotation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    default_validity_days INTEGER NOT NULL DEFAULT 30 CHECK (default_validity_days > 0),
    terms_and_conditions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_quotation_templates
BEFORE UPDATE ON quotation_templates
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Quotation Template Pre-configured Items
CREATE TABLE IF NOT EXISTS quotation_template_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES quotation_templates(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (discount_percent >= 0.00 AND discount_percent <= 100.00),
    CONSTRAINT fk_template_items_variant FOREIGN KEY (variant_id, product_id) 
        REFERENCES product_variants(id, product_id) ON DELETE SET NULL
);

-- Active Quotations sent to leads/customers
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number VARCHAR(64) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Sales staff reference
    status quotation_status NOT NULL DEFAULT 'draft',
    valid_until TIMESTAMPTZ NOT NULL,
    subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
    discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
    tax_cents INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
    total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    terms TEXT,
    converted_subscription_id UUID,               -- Foreign key established subsequently to prevent circular dependency
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_quote_calc CHECK (total_cents = (subtotal_cents - discount_cents + tax_cents))
);

CREATE TRIGGER set_timestamp_quotations
BEFORE UPDATE ON quotations
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);

-- Quotation Line Items
CREATE TABLE IF NOT EXISTS quotation_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
    tax_cents INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_quote_lines_variant FOREIGN KEY (variant_id, product_id) 
        REFERENCES product_variants(id, product_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_quote_lines_quote_id ON quotation_line_items(quotation_id);

-- ------------------------------------------------------------------------------
-- 9. SUBSCRIPTIONS & SUBSCRIPTION LIFECYCLE
-- ------------------------------------------------------------------------------

-- Master Subscription Table
-- Lifecycle: draft -> quotation -> confirmed -> active -> closed (with paused state support)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    status subscription_status NOT NULL DEFAULT 'draft',
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Billing cycle boundaries
    start_date TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    next_billing_at TIMESTAMPTZ,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    renewal_count INTEGER NOT NULL DEFAULT 0 CHECK (renewal_count >= 0),
    last_renewed_at TIMESTAMPTZ,
    
    -- Pause & Resume support
    is_paused BOOLEAN NOT NULL DEFAULT FALSE,
    pause_starts_at TIMESTAMPTZ,
    pause_resumes_at TIMESTAMPTZ,
    pause_reason VARCHAR(255),
    
    -- Closure & Cancellation support
    closed_at TIMESTAMPTZ,
    closure_reason VARCHAR(255),
    canceled_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_sub_period CHECK (current_period_end >= current_period_start)
);

CREATE TRIGGER set_timestamp_subscriptions
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Partial index for active, un-paused renewal jobs (excludes paused and closed subscriptions)
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing 
    ON subscriptions(status, next_billing_at) 
    WHERE status = 'active' AND is_paused = FALSE;

-- Forward-link Quotations to Subscriptions safely (no circular creation block)
ALTER TABLE quotations 
    ADD CONSTRAINT fk_quotations_subscription 
    FOREIGN KEY (converted_subscription_id) 
    REFERENCES subscriptions(id) 
    ON DELETE SET NULL;

-- Multi-item subscription support (base plan + add-ons + seats)
CREATE TABLE IF NOT EXISTS subscription_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sub_items_variant FOREIGN KEY (variant_id, product_id) 
        REFERENCES product_variants(id, product_id) ON DELETE SET NULL
);

CREATE TRIGGER set_timestamp_subscription_line_items
BEFORE UPDATE ON subscription_line_items
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_sub_items_sub_id ON subscription_line_items(subscription_id);

-- Audit log for status transitions (pauses, resumes, early closure, renewals)
CREATE TABLE IF NOT EXISTS subscription_state_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    from_status subscription_status NOT NULL,
    to_status subscription_status NOT NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    triggered_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_transitions_sub_id ON subscription_state_transitions(subscription_id);

-- ------------------------------------------------------------------------------
-- 10. INVOICES & LINE ITEMS
-- ------------------------------------------------------------------------------

-- Invoices Header
-- Lifecycle: draft -> confirmed -> paid
-- Overdue is determined by (status = 'confirmed' AND amount_due_cents > 0 AND due_date < NOW())
-- Partial payments are tracked by amount_paid_cents and amount_due_cents
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(64) UNIQUE NOT NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL,
    
    status invoice_status NOT NULL DEFAULT 'draft',
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Billing period for cycle duplicate prevention
    billing_period_start TIMESTAMPTZ NOT NULL,
    billing_period_end TIMESTAMPTZ NOT NULL,
    issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    
    -- Financial breakdown in integer cents
    subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
    discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
    tax_cents INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
    total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
    amount_paid_cents INTEGER NOT NULL DEFAULT 0 CHECK (amount_paid_cents >= 0),
    amount_due_cents INTEGER NOT NULL DEFAULT 0 CHECK (amount_due_cents >= 0),
    
    -- Dunning & Collections Tracking
    dunning_attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (dunning_attempt_count >= 0),
    last_dunning_at TIMESTAMPTZ,
    
    pdf_url VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_invoice_dates CHECK (billing_period_end >= billing_period_start),
    CONSTRAINT chk_invoice_calc CHECK (total_cents = (subtotal_cents - discount_cents + tax_cents)),
    CONSTRAINT chk_invoice_balance CHECK (amount_due_cents = (total_cents - amount_paid_cents))
);

CREATE TRIGGER set_timestamp_invoices
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Partial index for active overdue tracking
CREATE INDEX IF NOT EXISTS idx_invoices_overdue 
    ON invoices(status, due_date) 
    WHERE status = 'confirmed' AND amount_due_cents > 0;

-- Reliable duplicate invoice prevention under concurrent requests:
-- Guarantees zero duplicate invoices for the same subscription and period unless voided
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_subscription_billing_period 
    ON invoices (subscription_id, billing_period_start, billing_period_end) 
    WHERE subscription_id IS NOT NULL AND status != 'void';

-- Invoice Itemized Line Items (Preserves historical prices, taxes, and discounts)
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    subscription_line_item_id UUID REFERENCES subscription_line_items(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID,
    description VARCHAR(255) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
    tax_cents INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_invoice_lines_variant FOREIGN KEY (variant_id, product_id) 
        REFERENCES product_variants(id, product_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id ON invoice_line_items(invoice_id);

-- Granular Invoice Tax Breakdown (Itemized tax rates, e.g. CGST + SGST or VAT)
CREATE TABLE IF NOT EXISTS invoice_tax_breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    tax_rule_id UUID NOT NULL REFERENCES tax_rules(id) ON DELETE RESTRICT,
    taxable_amount_cents INTEGER NOT NULL CHECK (taxable_amount_cents >= 0),
    tax_amount_cents INTEGER NOT NULL CHECK (tax_amount_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_breakdowns_invoice_id ON invoice_tax_breakdowns(invoice_id);

-- ------------------------------------------------------------------------------
-- 11. DISCOUNT REDEMPTIONS WITH CONCURRENCY PROTECTION
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS discount_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    discounted_cents INTEGER NOT NULL CHECK (discounted_cents > 0),
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redemptions_discount_id ON discount_redemptions(discount_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON discount_redemptions(user_id);

-- Trigger: Atomic discount validation & concurrency lock (SELECT FOR UPDATE)
CREATE OR REPLACE FUNCTION trigger_enforce_discount_redemption()
RETURNS TRIGGER AS $$
DECLARE
    v_discount discounts%ROWTYPE;
BEGIN
    -- Row-level exclusive lock prevents concurrent redemption races
    SELECT * INTO v_discount
    FROM discounts
    WHERE id = NEW.discount_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Discount ID % does not exist', NEW.discount_id;
    END IF;
    
    IF NOT v_discount.is_active THEN
        RAISE EXCEPTION 'Discount % is inactive', v_discount.code;
    END IF;
    
    IF v_discount.starts_at > NOW() THEN
        RAISE EXCEPTION 'Discount % has not started yet', v_discount.code;
    END IF;
    
    IF v_discount.expires_at IS NOT NULL AND v_discount.expires_at < NOW() THEN
        RAISE EXCEPTION 'Discount % has expired', v_discount.code;
    END IF;
    
    IF v_discount.max_redemptions IS NOT NULL AND v_discount.times_redeemed >= v_discount.max_redemptions THEN
        RAISE EXCEPTION 'Discount % has reached its maximum redemption limit of %', v_discount.code, v_discount.max_redemptions;
    END IF;
    
    -- Increment times_redeemed atomically
    UPDATE discounts
    SET times_redeemed = times_redeemed + 1,
        updated_at = NOW()
    WHERE id = NEW.discount_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_discount_redemption
BEFORE INSERT ON discount_redemptions
FOR EACH ROW EXECUTE FUNCTION trigger_enforce_discount_redemption();

-- ------------------------------------------------------------------------------
-- 12. PAYMENT TRANSACTIONS & INVOICE BALANCE SYNCHRONIZATION
-- ------------------------------------------------------------------------------

-- Multiple payments can be recorded against one invoice (1:N)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status payment_status NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50) NOT NULL,
    payment_method_type payment_method_type NOT NULL DEFAULT 'card',
    gateway_transaction_id VARCHAR(255),
    provider_payment_id VARCHAR(255),
    idempotency_key VARCHAR(128) UNIQUE,           -- Guarantees zero duplicate charges
    
    -- Refund handling & self-referencing hierarchy
    amount_refunded_cents INTEGER NOT NULL DEFAULT 0 CHECK (amount_refunded_cents >= 0),
    refund_reason VARCHAR(255),
    parent_payment_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
    
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_payment_refund CHECK (amount_refunded_cents <= amount_cents)
);

CREATE TRIGGER set_timestamp_payment_transactions
BEFORE UPDATE ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payments_idempotency ON payment_transactions(idempotency_key);

-- Trigger: Automatically synchronizes invoice amount_paid_cents, amount_due_cents,
-- and updates status to 'paid' when full payment succeeds.
CREATE OR REPLACE FUNCTION trigger_sync_invoice_payment_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id UUID;
    v_total_paid INTEGER;
    v_invoice_total INTEGER;
BEGIN
    v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Compute total succeeded payments minus any refunds for this invoice
    SELECT COALESCE(SUM(amount_cents - amount_refunded_cents), 0)
    INTO v_total_paid
    FROM payment_transactions
    WHERE invoice_id = v_invoice_id AND status = 'succeeded';
    
    -- Retrieve invoice total
    SELECT total_cents INTO v_invoice_total
    FROM invoices WHERE id = v_invoice_id;
    
    IF FOUND THEN
        UPDATE invoices
        SET amount_paid_cents = v_total_paid,
            amount_due_cents = GREATEST(0, v_invoice_total - v_total_paid),
            status = CASE 
                WHEN (v_invoice_total - v_total_paid) <= 0 THEN 'paid'::invoice_status
                ELSE status 
            END,
            paid_at = CASE 
                WHEN (v_invoice_total - v_total_paid) <= 0 AND paid_at IS NULL THEN NOW()
                WHEN (v_invoice_total - v_total_paid) > 0 THEN NULL
                ELSE paid_at
            END,
            updated_at = NOW()
        WHERE id = v_invoice_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_invoice_payments
AFTER INSERT OR UPDATE OR DELETE ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION trigger_sync_invoice_payment_totals();

-- ------------------------------------------------------------------------------
-- 13. AUDIT & EVENT LOGS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    payload JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ------------------------------------------------------------------------------
-- 14. REPORTING & ANALYTICAL DASHBOARD VIEWS
-- ------------------------------------------------------------------------------

-- View 1: Monthly Recurring Revenue (MRR) & Annual Recurring Revenue (ARR)
-- Normalizes daily, weekly, monthly, and yearly intervals to accurate monthly revenue
-- Excludes paused and closed subscriptions
CREATE OR REPLACE VIEW view_mrr_summary AS
SELECT 
    p.currency,
    p.name AS plan_name,
    p.interval AS billing_interval,
    COUNT(s.id) AS active_subscriptions_count,
    SUM(
        CASE 
            WHEN p.interval = 'day'   THEN (p.base_price_cents * 30 / p.interval_count)
            WHEN p.interval = 'week'  THEN (p.base_price_cents * 52 / 12 / p.interval_count)
            WHEN p.interval = 'month' THEN (p.base_price_cents / p.interval_count)
            WHEN p.interval = 'year'  THEN (p.base_price_cents / 12 / p.interval_count)
            ELSE 0 
        END
    )::BIGINT AS total_mrr_cents,
    (
        SUM(
            CASE 
                WHEN p.interval = 'day'   THEN (p.base_price_cents * 30 / p.interval_count)
                WHEN p.interval = 'week'  THEN (p.base_price_cents * 52 / 12 / p.interval_count)
                WHEN p.interval = 'month' THEN (p.base_price_cents / p.interval_count)
                WHEN p.interval = 'year'  THEN (p.base_price_cents / 12 / p.interval_count)
                ELSE 0 
            END
        ) * 12
    )::BIGINT AS total_arr_cents
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active' AND s.is_paused = FALSE
GROUP BY p.currency, p.name, p.interval, p.interval_count;

-- View 2: Overdue Invoices Aging Report
-- Buckets outstanding amounts into standard credit control aging categories
CREATE OR REPLACE VIEW view_overdue_aging_summary AS
SELECT 
    i.id AS invoice_id,
    i.invoice_number,
    i.user_id,
    u.full_name AS customer_name,
    u.email AS customer_email,
    i.currency,
    i.total_cents,
    i.amount_paid_cents,
    i.amount_due_cents,
    i.due_date,
    CURRENT_DATE - i.due_date::date AS days_overdue,
    CASE 
        WHEN i.due_date >= CURRENT_DATE THEN 'current'
        WHEN CURRENT_DATE - i.due_date::date BETWEEN 1 AND 30 THEN '1_to_30_days'
        WHEN CURRENT_DATE - i.due_date::date BETWEEN 31 AND 60 THEN '31_to_60_days'
        WHEN CURRENT_DATE - i.due_date::date BETWEEN 61 AND 90 THEN '61_to_90_days'
        ELSE '90_plus_days'
    END AS aging_bucket,
    i.dunning_attempt_count
FROM invoices i
JOIN users u ON i.user_id = u.id
WHERE i.status = 'confirmed' AND i.amount_due_cents > 0;

-- View 3: Executive Subscription Dashboard Metrics
CREATE OR REPLACE VIEW view_subscription_dashboard_metrics AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'active' AND is_paused = FALSE) AS active_subscribers,
    COUNT(*) FILTER (WHERE status = 'active' AND is_paused = TRUE) AS paused_subscribers,
    COUNT(*) FILTER (WHERE status = 'draft') AS draft_subscriptions,
    COUNT(*) FILTER (WHERE status = 'quotation') AS pending_quotations,
    COUNT(*) FILTER (WHERE status = 'confirmed') AS awaiting_activation,
    COUNT(*) FILTER (WHERE status = 'closed') AS closed_or_churned_subscribers,
    COUNT(*) AS total_subscriptions_recorded
FROM subscriptions;

-- ------------------------------------------------------------------------------
-- 15. SEED DATA (CORE ROLES & DEFAULT ADMIN/TAX SETUPS)
-- ------------------------------------------------------------------------------

-- Seed system roles: admin, staff, customer
INSERT INTO roles (name, description) VALUES
    ('admin', 'Full platform administrative access to all subscriptions, billing, and system settings'),
    ('staff', 'Sales and support staff access for quotations, plan configurations, and dunning'),
    ('customer', 'Subscriber self-service portal access for invoices, payments, and account details')
ON CONFLICT (name) DO NOTHING;

-- Seed default standard tax rule
INSERT INTO tax_rules (name, tax_code, tax_type, rate_percent, country, is_active) VALUES
    ('Standard GST (18%)', 'GST18', 'exclusive', 18.00, 'IN', TRUE),
    ('Standard VAT (20%)', 'VAT20', 'exclusive', 20.00, 'GB', TRUE),
    ('Zero Rate / Tax-Exempt', 'EXEMPT', 'exclusive', 0.00, NULL, TRUE)
ON CONFLICT DO NOTHING;

COMMIT;
