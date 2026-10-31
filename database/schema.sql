-- ==============================================================================
-- Brightloop Software - Subscription Management System Database Schema
-- Compatible with PostgreSQL 14+ / 16+
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. USERS & RBAC
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
    company_name VARCHAR(255),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ==============================================================================
-- 2. CUSTOMERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    billing_address TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_customer_number ON customers(customer_number);

-- ==============================================================================
-- 3. PRODUCTS & VARIANTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'software',
    sales_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_name VARCHAR(100) NOT NULL, -- e.g., 'brand', 'tier', 'edition'
    attribute_value VARCHAR(100) NOT NULL, -- e.g., 'Odoo', 'Standard'
    price_extra NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- e.g., +560.00
    sku VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

-- ==============================================================================
-- 4. SUBSCRIPTION PLANS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    billing_frequency VARCHAR(50) NOT NULL CHECK (billing_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    min_quantity INT NOT NULL DEFAULT 1,
    start_date DATE,
    end_date DATE,
    auto_close_on_end BOOLEAN DEFAULT false,
    allow_early_close BOOLEAN DEFAULT true,
    allow_pause BOOLEAN DEFAULT true,
    allow_renewal BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);

-- ==============================================================================
-- 5. QUOTATION TEMPLATES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS quotation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    validity_days INT NOT NULL DEFAULT 30,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotation_template_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES quotation_templates(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- ==============================================================================
-- 6. TAX RULES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    rate NUMERIC(5, 2) NOT NULL, -- e.g. 18.00 for 18%
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 7. DISCOUNT RULES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    amount NUMERIC(12, 2) NOT NULL,
    scope VARCHAR(50) NOT NULL CHECK (scope IN ('whole_subscription', 'specific_product')),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    min_order_amount NUMERIC(12, 2) DEFAULT 0.00,
    min_quantity INT DEFAULT 0,
    start_date DATE,
    end_date DATE,
    max_uses INT DEFAULT NULL,
    times_used INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);

-- ==============================================================================
-- 8. SUBSCRIPTIONS & QUOTATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    template_id UUID REFERENCES quotation_templates(id) ON DELETE SET NULL,
    assigned_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' 
        CHECK (status IN ('Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed')),
    payment_terms VARCHAR(100) DEFAULT 'Immediate',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    next_billing_date DATE,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);

CREATE TABLE IF NOT EXISTS subscription_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_rule_id UUID REFERENCES tax_rules(id) ON DELETE SET NULL,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sub_lines_subscription ON subscription_lines(subscription_id);

-- ==============================================================================
-- 9. INVOICES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    outstanding_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' 
        CHECK (status IN ('Draft', 'Confirmed', 'Paid', 'Cancelled')),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    -- Prevent double billing for same subscription & billing period
    CONSTRAINT uq_subscription_billing_period UNIQUE (subscription_id, billing_period_start)
);

CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

CREATE TABLE IF NOT EXISTS invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_id);

-- ==============================================================================
-- 10. PAYMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL, -- e.g., 'Bank Transfer', 'Credit Card', 'Cash', 'Cheque'
    amount NUMERIC(12, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- ==============================================================================
-- 11. FINANCE REPORTING / REVENUE VIEWS
-- ==============================================================================
CREATE OR REPLACE VIEW view_finance_summary AS
SELECT
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'Active') AS active_subscriptions_count,
    (SELECT COALESCE(SUM(total_amount), 0) FROM subscriptions WHERE status = 'Active') AS recurring_revenue_monthly,
    (SELECT COALESCE(SUM(paid_amount), 0) FROM invoices) AS total_revenue_collected,
    (SELECT COALESCE(SUM(outstanding_amount), 0) FROM invoices WHERE status != 'Cancelled') AS total_outstanding_amount,
    (SELECT COUNT(*) FROM invoices WHERE status = 'Confirmed' AND due_date < CURRENT_DATE) AS overdue_invoices_count,
    (SELECT COALESCE(SUM(outstanding_amount), 0) FROM invoices WHERE status = 'Confirmed' AND due_date < CURRENT_DATE) AS overdue_amount;

-- View for overdue invoices
CREATE OR REPLACE VIEW view_overdue_invoices AS
SELECT 
    i.id AS invoice_id,
    i.invoice_number,
    c.name AS customer_name,
    c.email AS customer_email,
    i.total_amount,
    i.paid_amount,
    i.outstanding_amount,
    i.due_date,
    CURRENT_DATE - i.due_date AS days_overdue
FROM invoices i
JOIN customers c ON i.customer_id = c.id
WHERE i.status = 'Confirmed' AND i.due_date < CURRENT_DATE;
