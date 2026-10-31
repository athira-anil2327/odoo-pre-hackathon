-- ==============================================================================
-- BrightLoop Subscription Management System - Schema Verification Script
-- Verifies that all expected tables, views, sequences, and triggers exist in brightloop_db.
-- 
-- Execution (Read-only check):
--   psql -U brightloop -d brightloop_db -f database/verification/verify_schema_structure.sql
-- ==============================================================================

DO $$
DECLARE
    v_missing_tables INTEGER := 0;
    v_missing_views INTEGER := 0;
    v_missing_sequences INTEGER := 0;
    v_missing_triggers INTEGER := 0;
    v_table_count INTEGER := 0;
    v_view_count INTEGER := 0;
    v_seq_count INTEGER := 0;
    v_trigger_count INTEGER := 0;
    tbl TEXT;
    vw TEXT;
    seq TEXT;
    trg TEXT;
    expected_tables TEXT[] := ARRAY[
        'users',
        'customers',
        'products',
        'product_variants',
        'tax_rules',
        'plans',
        'plan_products',
        'quotation_templates',
        'quotation_template_lines',
        'discounts',
        'discount_usages',
        'quotations',
        'quotation_lines',
        'subscriptions',
        'subscription_lines',
        'subscription_events',
        'invoices',
        'invoice_lines',
        'payments',
        'audit_logs'
    ];
    expected_views TEXT[] := ARRAY[
        'view_finance_summary',
        'view_overdue_invoices',
        'view_subscription_summary'
    ];
    expected_sequences TEXT[] := ARRAY[
        'customer_number_seq',
        'quotation_number_seq',
        'subscription_number_seq',
        'invoice_number_seq',
        'payment_number_seq'
    ];
    expected_triggers TEXT[] := ARRAY[
        'trg_users_updated_at',
        'trg_customers_updated_at',
        'trg_products_updated_at',
        'trg_product_variants_updated_at',
        'trg_tax_rules_updated_at',
        'trg_plans_updated_at',
        'trg_quotation_templates_updated_at',
        'trg_discounts_updated_at',
        'trg_quotations_updated_at',
        'trg_subscriptions_updated_at',
        'trg_subscription_lines_updated_at',
        'trg_invoices_updated_at'
    ];
BEGIN
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'BrightLoop Schema Structure Verification (PostgreSQL 18)';
    RAISE NOTICE '=============================================================';

    -- 1. Check Tables
    RAISE NOTICE '--- Checking Tables (Expected: 20) ---';
    FOREACH tbl IN ARRAY expected_tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl AND table_type = 'BASE TABLE'
        ) THEN
            v_table_count := v_table_count + 1;
        ELSE
            RAISE WARNING 'MISSING TABLE: %', tbl;
            v_missing_tables := v_missing_tables + 1;
        END IF;
    END LOOP;
    RAISE NOTICE 'Tables verified: %/20 (Missing: %)', v_table_count, v_missing_tables;

    -- 2. Check Views
    RAISE NOTICE '--- Checking Views (Expected: 3) ---';
    FOREACH vw IN ARRAY expected_views LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_schema = 'public' AND table_name = vw
        ) THEN
            v_view_count := v_view_count + 1;
        ELSE
            RAISE WARNING 'MISSING VIEW: %', vw;
            v_missing_views := v_missing_views + 1;
        END IF;
    END LOOP;
    RAISE NOTICE 'Views verified: %/3 (Missing: %)', v_view_count, v_missing_views;

    -- 3. Check Sequences
    RAISE NOTICE '--- Checking Sequences (Expected: 5) ---';
    FOREACH seq IN ARRAY expected_sequences LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.sequences 
            WHERE sequence_schema = 'public' AND sequence_name = seq
        ) THEN
            v_seq_count := v_seq_count + 1;
        ELSE
            RAISE WARNING 'MISSING SEQUENCE: %', seq;
            v_missing_sequences := v_missing_sequences + 1;
        END IF;
    END LOOP;
    RAISE NOTICE 'Sequences verified: %/5 (Missing: %)', v_seq_count, v_missing_sequences;

    -- 4. Check Triggers
    RAISE NOTICE '--- Checking Triggers (Expected: 12) ---';
    FOREACH trg IN ARRAY expected_triggers LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = trg
        ) THEN
            v_trigger_count := v_trigger_count + 1;
        ELSE
            RAISE WARNING 'MISSING TRIGGER: %', trg;
            v_missing_triggers := v_missing_triggers + 1;
        END IF;
    END LOOP;
    RAISE NOTICE 'Triggers verified: %/12 (Missing: %)', v_trigger_count, v_missing_triggers;

    -- Final Report
    RAISE NOTICE '=============================================================';
    IF v_missing_tables = 0 AND v_missing_views = 0 AND v_missing_sequences = 0 AND v_missing_triggers = 0 THEN
        RAISE NOTICE 'STATUS: ALL STRUCTURE CHECKS PASSED! (20 Tables, 3 Views, 5 Sequences, 12 Triggers)';
    ELSE
        RAISE EXCEPTION 'VERIFICATION FAILED: Missing % tables, % views, % sequences, % triggers',
            v_missing_tables, v_missing_views, v_missing_sequences, v_missing_triggers;
    END IF;
    RAISE NOTICE '=============================================================';
END $$;
