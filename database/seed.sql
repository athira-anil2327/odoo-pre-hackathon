-- ==============================================================================
-- Brightloop Software - Initial Seed Data
-- ==============================================================================

-- 1. Insert Default Users (Admin, Staff, Customer)
INSERT INTO users (id, email, password_hash, name, role, company_name, phone)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'admin@brightloop.io', '$2b$12$eXampleHashedPasswordAdminSecret123', 'Brightloop Admin', 'admin', 'Brightloop Software Inc.', '+1 (555) 100-0001'),
    ('a0000000-0000-0000-0000-000000000002', 'sales@brightloop.io', '$2b$12$eXampleHashedPasswordStaffSecret123', 'Sarah Jenkins', 'staff', 'Brightloop Software Inc.', '+1 (555) 100-0002'),
    ('a0000000-0000-0000-0000-000000000003', 'eleanor.vance@nexushealth.org', '$2b$12$eXampleHashedPasswordCustSecret123', 'Dr. Eleanor Vance', 'customer', 'Nexus Health Systems', '+1 (555) 234-8901')
ON CONFLICT (email) DO NOTHING;

-- 2. Insert Customers
INSERT INTO customers (id, customer_number, name, email, phone, company, billing_address, user_id)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'CUST-1001', 'Dr. Eleanor Vance', 'eleanor.vance@nexushealth.org', '+1 (555) 234-8901', 'Nexus Health Systems', '742 Evergreen Terrace, Springfield, OR', 'a0000000-0000-0000-0000-000000000003'),
    ('c0000000-0000-0000-0000-000000000002', 'CUST-1002', 'Apex Logistics Corp', 'billing@apexlogistics.com', '+1 (555) 887-2190', 'Apex Logistics', '1200 Market Street, Suite 400, Philadelphia, PA', NULL),
    ('c0000000-0000-0000-0000-000000000003', 'CUST-1003', 'Greenleaf Retailers', 'contact@greenleaf.shop', '+1 (555) 431-7722', 'Greenleaf Retailers', '55 Broadway Ave, New York, NY', NULL)
ON CONFLICT (customer_number) DO NOTHING;

-- 3. Insert Products
INSERT INTO products (id, name, type, sales_price, cost_price, notes)
VALUES 
    ('b1000000-0000-0000-0000-000000000001', 'Business ERP Suite', 'software', 499.00, 150.00, 'Main business software suite with CRM and inventory modules'),
    ('b1000000-0000-0000-0000-000000000002', 'Automated Invoicing Addon', 'addon', 99.00, 20.00, 'Add-on module to automatically generate and email recurring invoices'),
    ('b1000000-0000-0000-0000-000000000003', 'Priority 24/7 Support', 'service', 150.00, 50.00, 'Dedicated SLA support channel with < 1 hour turnaround')
ON CONFLICT DO NOTHING;

-- 4. Product Variants (Example: Odoo brand adds 560 to price)
INSERT INTO product_variants (id, product_id, attribute_name, attribute_value, price_extra, sku)
VALUES 
    ('b2000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'brand', 'Standard Edition', 0.00, 'ERP-STD'),
    ('b2000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'brand', 'Odoo Enterprise Edition', 560.00, 'ERP-ODOO-ENT')
ON CONFLICT DO NOTHING;

-- 5. Subscription Plans
INSERT INTO plans (id, name, billing_frequency, price, min_quantity, auto_close_on_end, allow_early_close, allow_pause, allow_renewal)
VALUES 
    ('b3000000-0000-0000-0000-000000000001', 'Starter Monthly', 'monthly', 199.00, 1, false, true, true, true),
    ('b3000000-0000-0000-0000-000000000002', 'Growth Cloud Monthly', 'monthly', 499.00, 1, false, true, true, true),
    ('b3000000-0000-0000-0000-000000000003', 'Enterprise Annual Contract', 'yearly', 4990.00, 5, true, true, false, true)
ON CONFLICT DO NOTHING;

-- 6. Tax Rules
INSERT INTO tax_rules (id, name, rate)
VALUES 
    ('b4000000-0000-0000-0000-000000000001', 'Standard VAT 18%', 18.00),
    ('b4000000-0000-0000-0000-000000000002', 'Zero Tax 0%', 0.00)
ON CONFLICT DO NOTHING;

-- 7. Discounts
INSERT INTO discounts (id, code, discount_type, amount, scope, min_order_amount, min_quantity, start_date, end_date, max_uses, times_used)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'WELCOME10', 'percentage', 10.00, 'whole_subscription', 100.00, 1, '2026-01-01', '2026-12-31', 100, 5),
    ('d0000000-0000-0000-0000-000000000002', 'FLAT50OFF', 'fixed', 50.00, 'whole_subscription', 300.00, 1, '2026-01-01', '2026-12-31', 50, 2)
ON CONFLICT (code) DO NOTHING;

-- 8. Sample Subscriptions
INSERT INTO subscriptions (
    id, subscription_number, customer_id, plan_id, assigned_staff_id, status, 
    payment_terms, start_date, expiry_date, next_billing_date, 
    subtotal, tax_amount, discount_amount, total_amount
)
VALUES 
    (
        'e0000000-0000-0000-0000-000000000001', 'SUB-2026-0001', 
        'c0000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000002', 
        'a0000000-0000-0000-0000-000000000002', 'Active',
        'Net 30', '2026-10-01', '2027-09-30', '2026-11-01',
        1059.00, 190.62, 0.00, 1249.62
    ),
    (
        'e0000000-0000-0000-0000-000000000002', 'SUB-2026-0002', 
        'c0000000-0000-0000-0000-000000000002', 'b3000000-0000-0000-0000-000000000001', 
        'a0000000-0000-0000-0000-000000000002', 'Active',
        'Immediate', '2026-09-15', '2027-09-15', '2026-11-15',
        199.00, 35.82, 0.00, 234.82
    )
ON CONFLICT (subscription_number) DO NOTHING;

-- Lines for SUB-2026-0001 (Odoo Enterprise variant)
INSERT INTO subscription_lines (id, subscription_id, product_id, variant_id, quantity, unit_price, tax_rule_id, tax_amount, line_total)
VALUES 
    ('e1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 1, 1059.00, 'b4000000-0000-0000-0000-000000000001', 190.62, 1249.62)
ON CONFLICT DO NOTHING;

-- 9. Sample Invoices
INSERT INTO invoices (
    id, invoice_number, subscription_id, customer_id, 
    billing_period_start, billing_period_end, invoice_date, due_date, 
    subtotal, tax_total, discount_total, total_amount, paid_amount, outstanding_amount, status
)
VALUES 
    (
        'f0000000-0000-0000-0000-000000000001', 'INV-2026-0001', 
        'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
        '2026-10-01', '2026-10-31', '2026-10-01', '2026-10-31',
        1059.00, 190.62, 0.00, 1249.62, 1249.62, 0.00, 'Paid'
    ),
    (
        'f0000000-0000-0000-0000-000000000002', 'INV-2026-0002', 
        'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002',
        '2026-09-15', '2026-10-15', '2026-09-15', '2026-10-15',
        199.00, 35.82, 0.00, 234.82, 0.00, 234.82, 'Confirmed'
    )
ON CONFLICT (invoice_number) DO NOTHING;

-- Invoice Lines
INSERT INTO invoice_lines (id, invoice_id, product_id, variant_id, description, quantity, unit_price, tax_amount, line_total)
VALUES
    ('f0100000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'Business ERP Suite (Odoo Enterprise Edition)', 1, 1059.00, 190.62, 1249.62)
ON CONFLICT DO NOTHING;

-- 10. Sample Payments
INSERT INTO payments (id, payment_number, invoice_id, payment_method, amount, payment_date, note, created_by)
VALUES 
    ('f1000000-0000-0000-0000-000000000001', 'PAY-2026-0001', 'f0000000-0000-0000-0000-000000000001', 'Bank Transfer', 1249.62, '2026-10-05', 'Payment received via Chase wire transfer', 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (payment_number) DO NOTHING;
