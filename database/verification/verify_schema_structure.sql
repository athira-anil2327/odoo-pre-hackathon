-- ==============================================================================
-- BrightLoop Subscription Management System - Schema Verification Script
-- Verifies that all expected tables, columns, constraints, indexes, triggers, and views exist.
-- 
-- Execution (Read-only check):
--   psql -U brightloop -d brightloop_db -f scripts/verify_schema_structure.sql
-- ==============================================================================

DO $$
DECLARE
    v_missing_tables INTEGER := 0;
    v_missing_views INTEGER := 0;
    v_missing_indexes INTEGER := 0;
    v_missing_triggers INTEGER := 0;
    v_table_count INTEGER := 0;
    v_view_count INTEGER := 0;
    v_index_count INTEGER := 0;
    v_trigger_count INTEGER := 0;
    v_role_count INTEGER := 0;
    tbl TEXT;
    vw TEXT;
    idx TEXT;
    trg TEXT;
    expected_tables TEXT[] := ARRAY[
        'roles',
        'users',
        'user_roles',
        'customer_profiles',
        'products',
        'product_variants',
        'plans',
        'tax_rules',
        'discounts',
        'quotation_templates',
        'quotation_template_items',
        'quotations',
        'quotation_line_items',
        'subscriptions',
        'subscription_line_items',
        'subscription_state_transitions',
        'invoices',
        'invoice_line_items',
        'invoice_tax_breakdowns',
        'discount_redemptions',
        'payment_transactions',
        'audit_logs'
    ];
    expected_views TEXT[] := ARRAY[
        'view_mrr_summary',
        'view_overdue_aging_summary',
        'view_subscription_dashboard_metrics'
    ];
    expected_indexes TEXT[] := ARRAY[
        'uq_invoices_subscription_billing_period',
        'idx_invoices_overdue',
        'idx_subscriptions_next_billing',
        'idx_subscriptions_user_id',
        'idx_payments_invoice_id',
        'idx_payments_idempotency'
    ];
    expected_triggers TEXT[] := ARRAY[
        'sync_invoice_payments',
        'enforce_discount_redemption',
        'set_timestamp_users',
        'set_timestamp_invoices',
        'set_timestamp_subscriptions'
    ];
BEGIN
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE '         BRIGHTLOOP DATABASE SCHEMA STRUCTURE VERIFICATION REPORT            ';
    RAISE NOTICE '==============================================================================';

    -- 1. Table Verification
    RAISE NOTICE '[1/6] Checking Required Domain Tables...';
    FOREACH tbl IN ARRAY expected_tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            v_table_count := v_table_count + 1;
            RAISE NOTICE '   [PASS] Table exists: %', tbl;
        ELSE
            v_missing_tables := v_missing_tables + 1;
            RAISE WARNING '   [FAIL] Table MISSING: %', tbl;
        END IF;
    END LOOP;

    -- 2. View Verification
    RAISE NOTICE '';
    RAISE NOTICE '[2/6] Checking Reporting & Analytical Views...';
    FOREACH vw IN ARRAY expected_views LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_schema = 'public' AND table_name = vw
        ) THEN
            v_view_count := v_view_count + 1;
            RAISE NOTICE '   [PASS] View exists: %', vw;
        ELSE
            v_missing_views := v_missing_views + 1;
            RAISE WARNING '   [FAIL] View MISSING: %', vw;
        END IF;
    END LOOP;

    -- 3. Critical Index & Duplicate Prevention Verification
    RAISE NOTICE '';
    RAISE NOTICE '[3/6] Checking Critical Indexes & Constraints...';
    FOREACH idx IN ARRAY expected_indexes LOOP
        IF EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE schemaname = 'public' AND indexname = idx
        ) THEN
            v_index_count := v_index_count + 1;
            RAISE NOTICE '   [PASS] Index exists: %', idx;
        ELSE
            v_missing_indexes := v_missing_indexes + 1;
            RAISE WARNING '   [FAIL] Index MISSING: %', idx;
        END IF;
    END LOOP;

    -- 4. Critical Triggers (Payment Sync & Discount Concurrency)
    RAISE NOTICE '';
    RAISE NOTICE '[4/6] Checking Automated Business Triggers...';
    FOREACH trg IN ARRAY expected_triggers LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_schema = 'public' AND trigger_name = trg
        ) THEN
            v_trigger_count := v_trigger_count + 1;
            RAISE NOTICE '   [PASS] Trigger exists: %', trg;
        ELSE
            v_missing_triggers := v_missing_triggers + 1;
            RAISE WARNING '   [FAIL] Trigger MISSING: %', trg;
        END IF;
    END LOOP;

    -- 5. Check Constraints & Foreign Keys
    RAISE NOTICE '';
    RAISE NOTICE '[5/6] Checking Balance & Integrity Constraints...';
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_invoice_calc'
    ) THEN
        RAISE NOTICE '   [PASS] Constraint exists: chk_invoice_calc (total = subtotal - discount + tax)';
    ELSE
        RAISE WARNING '   [FAIL] Constraint missing: chk_invoice_calc';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_invoice_balance'
    ) THEN
        RAISE NOTICE '   [PASS] Constraint exists: chk_invoice_balance (amount_due = total - amount_paid)';
    ELSE
        RAISE WARNING '   [FAIL] Constraint missing: chk_invoice_balance';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'uq_product_variants_id_product'
    ) THEN
        RAISE NOTICE '   [PASS] Constraint exists: uq_product_variants_id_product (variant belongs strictly to product)';
    ELSE
        RAISE WARNING '   [FAIL] Constraint missing: uq_product_variants_id_product';
    END IF;

    -- 6. Seed Data Verification
    RAISE NOTICE '';
    RAISE NOTICE '[6/6] Checking Role Seed Data...';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') THEN
        SELECT COUNT(*) INTO v_role_count FROM roles WHERE name IN ('admin', 'staff', 'customer');
        IF v_role_count = 3 THEN
            RAISE NOTICE '   [PASS] All 3 core roles seeded (admin, staff, customer).';
        ELSE
            RAISE WARNING '   [FAIL] Expected 3 roles, found % seeded.', v_role_count;
        END IF;
    ELSE
        RAISE NOTICE '   [INFO] Roles table not yet created; skipping seed check.';
    END IF;

    -- Summary
    RAISE NOTICE '';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE 'VERIFICATION SUMMARY:';
    RAISE NOTICE '  - Tables Found:      % / %', v_table_count, ARRAY_LENGTH(expected_tables, 1);
    RAISE NOTICE '  - Views Found:       % / %', v_view_count, ARRAY_LENGTH(expected_views, 1);
    RAISE NOTICE '  - Key Indexes Found: % / %', v_index_count, ARRAY_LENGTH(expected_indexes, 1);
    RAISE NOTICE '  - Key Triggers Found:% / %', v_trigger_count, ARRAY_LENGTH(expected_triggers, 1);
    
    IF v_missing_tables = 0 AND v_missing_views = 0 AND v_missing_indexes = 0 AND v_missing_triggers = 0 THEN
        RAISE NOTICE 'STATUS: ALL STRUCTURE CHECKS PASSED PERFECTLY!';
    ELSE
        RAISE WARNING 'STATUS: SOME STRUCTURES MISSING (Schema execution pending approval).';
    END IF;
    RAISE NOTICE '==============================================================================';
END $$;
