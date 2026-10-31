import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function seed() {
  console.log("=============================================================");
  console.log("BrightLoop Production Seeder: Seeding Real Enterprise Data");
  console.log("=============================================================\n");

  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    console.log("[1/10] Truncating operational tables with CASCADE...");
    await client.query(`
      TRUNCATE TABLE 
        payments, 
        invoice_lines, 
        invoices, 
        subscription_events, 
        subscription_lines, 
        subscriptions, 
        quotation_lines, 
        quotations, 
        quotation_template_lines, 
        quotation_templates, 
        plan_products, 
        product_variants, 
        products, 
        plans, 
        tax_rules, 
        discounts, 
        discount_usages,
        customers
      CASCADE;
    `);

    // Reset sequences
    console.log("[+] Resetting business number sequences...");
    await client.query("ALTER SEQUENCE customer_number_seq RESTART WITH 1;");
    await client.query("ALTER SEQUENCE quotation_number_seq RESTART WITH 1;");
    await client.query("ALTER SEQUENCE subscription_number_seq RESTART WITH 1;");
    await client.query("ALTER SEQUENCE invoice_number_seq RESTART WITH 1;");
    await client.query("ALTER SEQUENCE payment_number_seq RESTART WITH 1;");

    // Standard Passwords
    const defaultPasswordHash = await bcrypt.hash("Admin@BrightLoop2026!", 10);
    const staffPasswordHash = await bcrypt.hash("Staff@BrightLoop2026!", 10);
    const customerPasswordHash = await bcrypt.hash("Customer@BrightLoop2026!", 10);

    // 2. Ensure Core Users
    console.log("[2/10] Provisioning standard admin, staff, and customer users...");
    const usersToUpsert = [
      { email: "admin@brightloop.com", name: "BrightLoop Administrator", role: "admin", hash: defaultPasswordHash },
      { email: "admin@brightloop.io", name: "BrightLoop Executive Admin", role: "admin", hash: defaultPasswordHash },
      { email: "sales@brightloop.io", name: "Sarah Jenkins", role: "staff", hash: staffPasswordHash },
      { email: "staff@brightloop.io", name: "Marcus Brody", role: "staff", hash: staffPasswordHash },
      { email: "priya.nair@brightloop.io", name: "Priya Nair", role: "staff", hash: staffPasswordHash },
      { email: "eleanor.vance@nexushealth.org", name: "Dr. Eleanor Vance", role: "customer", hash: customerPasswordHash },
      { email: "billing@apexlogistics.com", name: "David Sterling", role: "customer", hash: customerPasswordHash },
      { email: "contact@greenleaf.shop", name: "Amara Green", role: "customer", hash: customerPasswordHash },
      { email: "tech@cloudscale.io", name: "Vikram Sethi", role: "customer", hash: customerPasswordHash },
      { email: "finance@finguard.com", name: "Elena Rostova", role: "customer", hash: customerPasswordHash },
      { email: "ops@biocare-labs.in", name: "Dr. Rajesh Menon", role: "customer", hash: customerPasswordHash },
      { email: "accounts@starlightmedia.com", name: "Chloe Zhao", role: "customer", hash: customerPasswordHash },
      { email: "admin@vanguarddynamic.com", name: "Marcus Vance", role: "customer", hash: customerPasswordHash }
    ];

    const userMap = {};
    for (const u of usersToUpsert) {
      const res = await client.query(
        `INSERT INTO users (email, password_hash, name, role, is_active, is_verified)
         VALUES ($1, $2, $3, $4, TRUE, TRUE)
         ON CONFLICT (lower(email)) DO UPDATE 
         SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, role = EXCLUDED.role, is_active = TRUE
         RETURNING id, email, role;`,
        [u.email, u.hash, u.name, u.role]
      );
      userMap[u.email.toLowerCase()] = res.rows[0].id;
    }

    const adminId = userMap["admin@brightloop.com"];
    const marcusStaffId = userMap["staff@brightloop.io"];
    const sarahStaffId = userMap["sales@brightloop.io"];

    // 3. Tax Rules
    console.log("[3/10] Seeding GST and tax rules...");
    const taxGst18Res = await client.query(`
      INSERT INTO tax_rules (name, rate, is_active)
      VALUES ('Standard GST 18%', 18.00, TRUE)
      RETURNING id;
    `);
    const tax18Id = taxGst18Res.rows[0].id;

    const taxGst12Res = await client.query(`
      INSERT INTO tax_rules (name, rate, is_active)
      VALUES ('Reduced GST 12%', 12.00, TRUE)
      RETURNING id;
    `);
    const tax12Id = taxGst12Res.rows[0].id;

    const taxZeroRes = await client.query(`
      INSERT INTO tax_rules (name, rate, is_active)
      VALUES ('Software Export 0%', 0.00, TRUE)
      RETURNING id;
    `);
    const taxZeroId = taxZeroRes.rows[0].id;

    // 4. Products & Variants
    console.log("[4/10] Seeding SaaS products, modules, and SKU variants...");
    const pErpRes = await client.query(`
      INSERT INTO products (code, name, type, sales_price, cost_price, notes, is_active)
      VALUES ('PROD-ERP', 'Business ERP Suite', 'software', 499.00, 150.00, 'Core enterprise software suite including CRM, billing, and accounting modules', TRUE)
      RETURNING id;
    `);
    const prodErpId = pErpRes.rows[0].id;

    const vStdRes = await client.query(`
      INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_extra, sku)
      VALUES ($1, 'Edition', 'Standard Edition', 0.00, 'ERP-STD')
      RETURNING id;
    `, [prodErpId]);
    const varErpStdId = vStdRes.rows[0].id;

    const vOdooRes = await client.query(`
      INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_extra, sku)
      VALUES ($1, 'Edition', 'Odoo Enterprise Edition', 560.00, 'ERP-ODOO-ENT')
      RETURNING id;
    `, [prodErpId]);
    const varErpOdooId = vOdooRes.rows[0].id;

    const vMultiCloudRes = await client.query(`
      INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_extra, sku)
      VALUES ($1, 'Edition', 'Multi-Cloud High Availability', 950.00, 'ERP-MC-HA')
      RETURNING id;
    `, [prodErpId]);
    const varErpMultiCloudId = vMultiCloudRes.rows[0].id;

    const pInvRes = await client.query(`
      INSERT INTO products (code, name, type, sales_price, cost_price, notes, is_active)
      VALUES ('PROD-INV', 'Automated Invoicing Engine', 'addon', 99.00, 20.00, 'Automated GST tax calculation, recurring invoicing, and dispatch engine', TRUE)
      RETURNING id;
    `);
    const prodInvId = pInvRes.rows[0].id;

    const pSlaRes = await client.query(`
      INSERT INTO products (code, name, type, sales_price, cost_price, notes, is_active)
      VALUES ('PROD-SLA', 'Priority 24/7 SLA Support', 'service', 150.00, 50.00, 'Dedicated technical account manager with guaranteed turnaround SLAs', TRUE)
      RETURNING id;
    `);
    const prodSlaId = pSlaRes.rows[0].id;

    const vSlaCriticalRes = await client.query(`
      INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_extra, sku)
      VALUES ($1, 'Tier', '15-Minute Critical Turnaround', 200.00, 'SLA-15M')
      RETURNING id;
    `, [prodSlaId]);
    const varSlaCriticalId = vSlaCriticalRes.rows[0].id;

    const pSecRes = await client.query(`
      INSERT INTO products (code, name, type, sales_price, cost_price, notes, is_active)
      VALUES ('PROD-SEC', 'SOC-2 Compliance & Security Vault', 'software', 249.00, 60.00, 'Hardware security modules, SAML SSO, immutable audit logging', TRUE)
      RETURNING id;
    `);
    const prodSecId = pSecRes.rows[0].id;

    const pApiRes = await client.query(`
      INSERT INTO products (code, name, type, sales_price, cost_price, notes, is_active)
      VALUES ('PROD-API', 'High-Throughput API Gateway', 'addon', 199.00, 45.00, 'Unmetered webhook triggers and high-speed dedicated API cluster', TRUE)
      RETURNING id;
    `);
    const prodApiId = pApiRes.rows[0].id;

    const pAnlRes = await client.query(`
      INSERT INTO products (code, name, type, sales_price, cost_price, notes, is_active)
      VALUES ('PROD-ANL', 'Predictive AI Revenue Analytics', 'addon', 349.00, 80.00, 'Machine learning subscription pacing, churn alerts, and cohort retention', TRUE)
      RETURNING id;
    `);
    const prodAnlId = pAnlRes.rows[0].id;

    const prodNameMap = {
      [prodErpId]: "Business ERP Suite",
      [prodInvId]: "Automated Invoicing Engine",
      [prodSlaId]: "Priority 24/7 SLA Support",
      [prodSecId]: "SOC-2 Compliance & Security Vault",
      [prodApiId]: "High-Throughput API Gateway",
      [prodAnlId]: "Predictive AI Revenue Analytics"
    };

    // 5. Plans
    console.log("[5/10] Seeding subscription plan catalog...");
    const planStarterRes = await client.query(`
      INSERT INTO plans (code, name, billing_frequency, price, min_quantity, allow_early_close, allow_pause, allow_renewal, is_active)
      VALUES ('PLAN-STARTER', 'Starter Monthly', 'monthly', 199.00, 1, TRUE, TRUE, TRUE, TRUE)
      RETURNING id;
    `);
    const planStarterId = planStarterRes.rows[0].id;

    const planGrowthRes = await client.query(`
      INSERT INTO plans (code, name, billing_frequency, price, min_quantity, allow_early_close, allow_pause, allow_renewal, is_active)
      VALUES ('PLAN-GROWTH', 'Growth Cloud Monthly', 'monthly', 499.00, 1, TRUE, TRUE, TRUE, TRUE)
      RETURNING id;
    `);
    const planGrowthId = planGrowthRes.rows[0].id;

    const planEntRes = await client.query(`
      INSERT INTO plans (code, name, billing_frequency, price, min_quantity, allow_early_close, allow_pause, allow_renewal, is_active)
      VALUES ('PLAN-ENT', 'Enterprise Annual Contract', 'yearly', 4990.00, 5, TRUE, FALSE, TRUE, TRUE)
      RETURNING id;
    `);
    const planEntId = planEntRes.rows[0].id;

    // Link Products to Plans
    await client.query(`
      INSERT INTO plan_products (plan_id, product_id, quantity, unit_price)
      VALUES 
        ($1, $2, 1, 99.00),
        ($3, $4, 1, 499.00),
        ($3, $2, 1, 99.00),
        ($5, $4, 5, 499.00),
        ($5, $6, 5, 150.00),
        ($5, $7, 1, 249.00);
    `, [planStarterId, prodInvId, planGrowthId, prodErpId, planEntId, prodSlaId, prodSecId]);

    // 6. Quotation Templates
    console.log("[6/10] Seeding quotation templates...");
    const tmplGrowthRes = await client.query(`
      INSERT INTO quotation_templates (name, plan_id, validity_days, description)
      VALUES ('Growth Cloud Starter Template', $1, 30, 'Recommended bundle for scaling companies: Odoo Enterprise ERP suite + Invoicing Engine')
      RETURNING id;
    `, [planGrowthId]);
    const tmplGrowthId = tmplGrowthRes.rows[0].id;

    await client.query(`
      INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, unit_price)
      VALUES 
        ($1, $2, $3, 1, 1059.00),
        ($1, $4, NULL, 1, 99.00);
    `, [tmplGrowthId, prodErpId, varErpOdooId, prodInvId]);

    const tmplEntRes = await client.query(`
      INSERT INTO quotation_templates (name, plan_id, validity_days, description)
      VALUES ('Enterprise Multi-Seat Annual Template', $1, 45, 'Comprehensive annual enterprise agreement with 5 seats, 24/7 SLA, and security vault')
      RETURNING id;
    `, [planEntId]);
    const tmplEntId = tmplEntRes.rows[0].id;

    await client.query(`
      INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, unit_price)
      VALUES 
        ($1, $2, $3, 5, 1449.00),
        ($1, $4, $5, 5, 350.00),
        ($1, $6, NULL, 1, 249.00);
    `, [tmplEntId, prodErpId, varErpMultiCloudId, prodSlaId, varSlaCriticalId, prodSecId]);

    // 7. Customers (8 Real Enterprise Companies)
    console.log("[7/10] Seeding enterprise customers across industries...");
    const customerList = [
      {
        company: "Nexus Health Systems",
        name: "Dr. Eleanor Vance",
        email: "eleanor.vance@nexushealth.org",
        phone: "+91 80 4123 4567",
        tax_id: "GST-29AABCU9603R1ZM",
        address: "Level 8, Nexus Tech Tower, Whitefield, Bengaluru, Karnataka 560066",
        user_key: "eleanor.vance@nexushealth.org"
      },
      {
        company: "Apex Logistics Corp",
        name: "David Sterling",
        email: "billing@apexlogistics.com",
        phone: "+91 22 6789 0123",
        tax_id: "GST-27AAACP1234F1ZQ",
        address: "Plot 42, Trans-Thane Creek Industrial Area, Navi Mumbai, Maharashtra 400705",
        user_key: "billing@apexlogistics.com"
      },
      {
        company: "Greenleaf Retailers Inc.",
        name: "Amara Green",
        email: "contact@greenleaf.shop",
        phone: "+91 44 2855 9012",
        tax_id: "GST-33AABCG5512B1ZX",
        address: "88 Anna Salai, Guindy, Chennai, Tamil Nadu 600032",
        user_key: "contact@greenleaf.shop"
      },
      {
        company: "CloudScale Analytics Inc.",
        name: "Vikram Sethi",
        email: "tech@cloudscale.io",
        phone: "+91 124 456 7890",
        tax_id: "GST-06AABCC9988D1Z2",
        address: "DLF Cyber City, Tower 10-B, Sector 24, Gurugram, Haryana 122002",
        user_key: "tech@cloudscale.io"
      },
      {
        company: "FinGuard Global Security",
        name: "Elena Rostova",
        email: "finance@finguard.com",
        phone: "+91 40 6677 8899",
        tax_id: "GST-36AAACF4422E1ZK",
        address: "HITEC City, Phase II, Madhapur, Hyderabad, Telangana 500081",
        user_key: "finance@finguard.com"
      },
      {
        company: "BioCare Diagnostics Labs",
        name: "Dr. Rajesh Menon",
        email: "ops@biocare-labs.in",
        phone: "+91 484 233 4455",
        tax_id: "GST-32AABCB7711H1ZP",
        address: "Infopark Phase 1, Kakkanad, Kochi, Kerala 682042",
        user_key: "ops@biocare-labs.in"
      },
      {
        company: "Starlight Media Group",
        name: "Chloe Zhao",
        email: "accounts@starlightmedia.com",
        phone: "+91 33 2289 1234",
        tax_id: "GST-19AAACS3344M1Z5",
        address: "Park Street Commercial Complex, Block C, Kolkata, West Bengal 700016",
        user_key: "accounts@starlightmedia.com"
      },
      {
        company: "Vanguard Dynamics",
        name: "Marcus Vance",
        email: "admin@vanguarddynamic.com",
        phone: "+91 79 4001 2233",
        tax_id: "GST-24AAACV8899P1ZL",
        address: "GIDC Electronic Estate, Sector 25, Gandhinagar, Gujarat 382024",
        user_key: "admin@vanguarddynamic.com"
      }
    ];

    const customerMap = {};
    for (const c of customerList) {
      const uId = userMap[c.user_key.toLowerCase()];
      const res = await client.query(
        `INSERT INTO customers (name, email, phone, company, billing_address, tax_id, currency, user_id, created_by, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, 'INR', $7, $8, TRUE)
         RETURNING id, customer_number, company;`,
        [c.name, c.email, c.phone, c.company, c.address, c.tax_id, uId, marcusStaffId]
      );
      customerMap[c.company] = res.rows[0];
    }

    // 8. Subscriptions and Lines
    console.log("[8/10] Seeding live subscriptions across accounts...");
    // Helper to insert a subscription + lines cleanly
    async function createSubscriptionRecord({
      company,
      planId,
      status,
      startDate,
      nextBillingDate,
      expiryDate,
      lines,
      assignedStaffId
    }) {
      const cust = customerMap[company];
      let subtotal = 0;
      let taxAmount = 0;
      let discountAmount = 0;

      for (const line of lines) {
        const lineSub = line.quantity * line.unit_price;
        const lineTax = (lineSub * (line.tax_rate / 100));
        subtotal += lineSub;
        taxAmount += lineTax;
      }
      subtotal = Math.round(subtotal * 100) / 100;
      taxAmount = Math.round(taxAmount * 100) / 100;
      const totalAmount = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;

      const subRes = await client.query(`
        INSERT INTO subscriptions (
          customer_id, plan_id, assigned_staff_id, status, payment_terms,
          start_date, next_billing_date, expiry_date, currency,
          subtotal, tax_amount, discount_amount, total_amount
        )
        VALUES ($1, $2, $3, $4, 'Net 30', $5, $6, $7, 'INR', $8, $9, $10, $11)
        RETURNING id, subscription_number, customer_id, total_amount;
      `, [
        cust.id, planId, assignedStaffId || marcusStaffId, status,
        startDate, nextBillingDate, expiryDate,
        subtotal, taxAmount, discountAmount, totalAmount
      ]);
      const sub = subRes.rows[0];

      // Lines
      for (const line of lines) {
        const lineSub = Math.round(line.quantity * line.unit_price * 100) / 100;
        const lineTax = Math.round((lineSub * (line.tax_rate / 100)) * 100) / 100;
        const lineTot = Math.round((lineSub + lineTax) * 100) / 100;
        const pName = prodNameMap[line.product_id] || "Software License";

        await client.query(`
          INSERT INTO subscription_lines (
            subscription_id, product_id, variant_id, product_name, description, quantity, unit_price,
            line_subtotal, tax_rule_id, tax_rate_snapshot, tax_amount, discount_amount, line_total
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 18.00, $10, 0.00, $11);
        `, [
          sub.id, line.product_id, line.variant_id || null, pName, pName, line.quantity, line.unit_price,
          lineSub, tax18Id, lineTax, lineTot
        ]);
      }

      // Lifecycle Event
      await client.query(`
        INSERT INTO subscription_events (subscription_id, event_type, from_status, to_status, reason, notes, performed_by)
        VALUES ($1, 'activated', 'draft', $2, 'Enterprise Contract Activated', 'Automated onboarding workflow completed', $3);
      `, [sub.id, status, marcusStaffId]);

      return sub;
    }

    // Sub 1: Nexus Health Systems (Active Growth Cloud Monthly)
    const subNexus = await createSubscriptionRecord({
      company: "Nexus Health Systems",
      planId: planGrowthId,
      status: "active",
      startDate: "2026-09-01",
      nextBillingDate: "2026-11-01",
      expiryDate: "2027-08-31",
      lines: [
        { product_id: prodErpId, variant_id: varErpOdooId, quantity: 1, unit_price: 1059.00, tax_rate: 18.00 }
      ],
      assignedStaffId: marcusStaffId
    });

    // Sub 2: Apex Logistics Corp (Active Starter Monthly)
    const subApex = await createSubscriptionRecord({
      company: "Apex Logistics Corp",
      planId: planStarterId,
      status: "active",
      startDate: "2026-09-15",
      nextBillingDate: "2026-11-15",
      expiryDate: "2027-09-14",
      lines: [
        { product_id: prodInvId, variant_id: null, quantity: 2, unit_price: 99.00, tax_rate: 18.00 }
      ],
      assignedStaffId: sarahStaffId
    });

    // Sub 3: CloudScale Analytics (Active Enterprise Annual with 5 Seats)
    const subCloudScale = await createSubscriptionRecord({
      company: "CloudScale Analytics Inc.",
      planId: planEntId,
      status: "active",
      startDate: "2026-08-15",
      nextBillingDate: "2027-08-15",
      expiryDate: "2027-08-14",
      lines: [
        { product_id: prodErpId, variant_id: varErpMultiCloudId, quantity: 5, unit_price: 1449.00, tax_rate: 18.00 },
        { product_id: prodSlaId, variant_id: varSlaCriticalId, quantity: 5, unit_price: 350.00, tax_rate: 18.00 },
        { product_id: prodSecId, variant_id: null, quantity: 1, unit_price: 249.00, tax_rate: 18.00 }
      ],
      assignedStaffId: sarahStaffId
    });

    // Sub 4: Greenleaf Retailers (Paused for seasonal warehouse overhaul)
    const subGreenleaf = await createSubscriptionRecord({
      company: "Greenleaf Retailers Inc.",
      planId: planGrowthId,
      status: "paused",
      startDate: "2026-07-01",
      nextBillingDate: "2026-12-01",
      expiryDate: "2027-06-30",
      lines: [
        { product_id: prodErpId, variant_id: varErpStdId, quantity: 1, unit_price: 499.00, tax_rate: 18.00 }
      ],
      assignedStaffId: marcusStaffId
    });

    // Sub 5: FinGuard Global Security (Active Dedicated Platform)
    const subFinGuard = await createSubscriptionRecord({
      company: "FinGuard Global Security",
      planId: planGrowthId,
      status: "active",
      startDate: "2026-09-20",
      nextBillingDate: "2026-11-20",
      expiryDate: "2027-09-19",
      lines: [
        { product_id: prodErpId, variant_id: varErpOdooId, quantity: 2, unit_price: 1059.00, tax_rate: 18.00 },
        { product_id: prodSecId, variant_id: null, quantity: 2, unit_price: 249.00, tax_rate: 18.00 }
      ],
      assignedStaffId: sarahStaffId
    });

    // Sub 6: BioCare Diagnostics (Active Clinical Diagnostics Support)
    const subBioCare = await createSubscriptionRecord({
      company: "BioCare Diagnostics Labs",
      planId: planGrowthId,
      status: "active",
      startDate: "2026-10-01",
      nextBillingDate: "2026-11-01",
      expiryDate: "2027-09-30",
      lines: [
        { product_id: prodErpId, variant_id: varErpOdooId, quantity: 1, unit_price: 1059.00, tax_rate: 18.00 }
      ],
      assignedStaffId: marcusStaffId
    });

    // Sub 7: Starlight Media Group (Confirmed Subscription, Ready to Go Live)
    const subStarlight = await createSubscriptionRecord({
      company: "Starlight Media Group",
      planId: planStarterId,
      status: "confirmed",
      startDate: "2026-11-01",
      nextBillingDate: "2026-12-01",
      expiryDate: "2027-10-31",
      lines: [
        { product_id: prodApiId, variant_id: null, quantity: 1, unit_price: 199.00, tax_rate: 18.00 },
        { product_id: prodInvId, variant_id: null, quantity: 1, unit_price: 99.00, tax_rate: 18.00 }
      ],
      assignedStaffId: sarahStaffId
    });

    // Sub 8: Vanguard Dynamics (Active Industrial Automation Deal)
    const subVanguard = await createSubscriptionRecord({
      company: "Vanguard Dynamics",
      planId: planEntId,
      status: "active",
      startDate: "2026-08-01",
      nextBillingDate: "2027-08-01",
      expiryDate: "2027-07-31",
      lines: [
        { product_id: prodErpId, variant_id: varErpMultiCloudId, quantity: 3, unit_price: 1449.00, tax_rate: 18.00 },
        { product_id: prodAnlId, variant_id: null, quantity: 1, unit_price: 349.00, tax_rate: 18.00 }
      ],
      assignedStaffId: marcusStaffId
    });

    // 9. Quotations & Proposals
    console.log("[9/10] Seeding quotation pipeline and commercial proposals...");
    const quoteData = [
      {
        company: "Nexus Health Systems",
        planId: planGrowthId,
        templateId: tmplGrowthId,
        status: "confirmed",
        subtotal: 1059.00,
        tax: 190.62,
        total: 1249.62,
        issueDate: "2026-08-25",
        validUntil: "2026-09-24",
        convertedSubId: subNexus.id,
        lines: [{ prod: prodErpId, variant: varErpOdooId, qty: 1, price: 1059.00, tax: 190.62, tot: 1249.62 }]
      },
      {
        company: "Apex Logistics Corp",
        planId: planStarterId,
        templateId: null,
        status: "confirmed",
        subtotal: 198.00,
        tax: 35.64,
        total: 233.64,
        issueDate: "2026-09-05",
        validUntil: "2026-10-05",
        convertedSubId: subApex.id,
        lines: [{ prod: prodInvId, variant: null, qty: 2, price: 99.00, tax: 35.64, tot: 233.64 }]
      },
      {
        company: "CloudScale Analytics Inc.",
        planId: planEntId,
        templateId: tmplEntId,
        status: "confirmed",
        subtotal: 9244.00,
        tax: 1663.92,
        total: 10907.92,
        issueDate: "2026-08-01",
        validUntil: "2026-08-31",
        convertedSubId: subCloudScale.id,
        lines: [
          { prod: prodErpId, variant: varErpMultiCloudId, qty: 5, price: 1449.00, tax: 1304.10, tot: 8549.10 },
          { prod: prodSlaId, variant: varSlaCriticalId, qty: 5, price: 350.00, tax: 315.00, tot: 2065.00 },
          { prod: prodSecId, variant: null, qty: 1, price: 249.00, tax: 44.82, tot: 293.82 }
        ]
      },
      {
        company: "Greenleaf Retailers Inc.",
        planId: planGrowthId,
        templateId: tmplGrowthId,
        status: "quotation", // Open proposal
        subtotal: 1158.00,
        tax: 208.44,
        total: 1366.44,
        issueDate: "2026-10-20",
        validUntil: "2026-11-20",
        convertedSubId: null,
        lines: [
          { prod: prodErpId, variant: varErpOdooId, qty: 1, price: 1059.00, tax: 190.62, tot: 1249.62 },
          { prod: prodInvId, variant: null, qty: 1, price: 99.00, tax: 17.82, tot: 116.82 }
        ]
      },
      {
        company: "FinGuard Global Security",
        planId: planGrowthId,
        templateId: null,
        status: "confirmed",
        subtotal: 2616.00,
        tax: 470.88,
        total: 3086.88,
        issueDate: "2026-09-10",
        validUntil: "2026-10-10",
        convertedSubId: subFinGuard.id,
        lines: [
          { prod: prodErpId, variant: varErpOdooId, qty: 2, price: 1059.00, tax: 381.24, tot: 2499.24 },
          { prod: prodSecId, variant: null, qty: 2, price: 249.00, tax: 89.64, tot: 587.64 }
        ]
      },
      {
        company: "BioCare Diagnostics Labs",
        planId: planGrowthId,
        templateId: tmplGrowthId,
        status: "confirmed",
        subtotal: 1059.00,
        tax: 190.62,
        total: 1249.62,
        issueDate: "2026-09-22",
        validUntil: "2026-10-22",
        convertedSubId: subBioCare.id,
        lines: [{ prod: prodErpId, variant: varErpOdooId, qty: 1, price: 1059.00, tax: 190.62, tot: 1249.62 }]
      },
      {
        company: "Starlight Media Group",
        planId: planStarterId,
        templateId: null,
        status: "draft", // Proposal in draft
        subtotal: 298.00,
        tax: 53.64,
        total: 351.64,
        issueDate: "2026-10-28",
        validUntil: "2026-11-28",
        convertedSubId: null,
        lines: [
          { prod: prodApiId, variant: null, qty: 1, price: 199.00, tax: 35.82, tot: 234.82 },
          { prod: prodInvId, variant: null, qty: 1, price: 99.00, tax: 17.82, tot: 116.82 }
        ]
      },
      {
        company: "Vanguard Dynamics",
        planId: planEntId,
        templateId: null,
        status: "confirmed",
        subtotal: 4696.00,
        tax: 845.28,
        total: 5541.28,
        issueDate: "2026-07-25",
        validUntil: "2026-08-25",
        convertedSubId: subVanguard.id,
        lines: [
          { prod: prodErpId, variant: varErpMultiCloudId, qty: 3, price: 1449.00, tax: 782.46, tot: 5129.46 },
          { prod: prodAnlId, variant: null, qty: 1, price: 349.00, tax: 62.82, tot: 411.82 }
        ]
      }
    ];

    for (const q of quoteData) {
      const cust = customerMap[q.company];
      const qRes = await client.query(`
        INSERT INTO quotations (
          customer_id, plan_id, template_id, created_by, status,
          issue_date, valid_until, currency,
          subtotal, tax_total, discount_total, total_amount
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'INR', $8, $9, 0.00, $10)
        RETURNING id;
      `, [
        cust.id, q.planId, q.templateId, marcusStaffId, q.status,
        q.issueDate, q.validUntil,
        q.subtotal, q.tax, q.total
      ]);
      const quoteId = qRes.rows[0].id;

      for (const line of q.lines) {
        const pName = prodNameMap[line.prod] || "Subscription Software";
        await client.query(`
          INSERT INTO quotation_lines (
            quotation_id, product_id, variant_id, product_name, description, quantity, unit_price,
            line_subtotal, tax_rule_id, tax_rate_snapshot, tax_amount, discount_amount, line_total
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 18.00, $10, 0.00, $11);
        `, [
          quoteId, line.prod, line.variant, pName, pName, line.qty, line.price,
          Math.round(line.qty * line.price * 100) / 100,
          tax18Id, line.tax, line.tot
        ]);
      }
    }

    // 10. Invoices and Payments
    console.log("[10/10] Seeding invoices, ledger lines, and payment transactions...");
    const invoiceList = [
      {
        subscription: subNexus,
        company: "Nexus Health Systems",
        periodStart: "2026-09-01",
        periodEnd: "2026-09-30",
        invoiceDate: "2026-09-01",
        dueDate: "2026-09-30",
        subtotal: 1059.00,
        tax: 190.62,
        total: 1249.62,
        paid: 1249.62,
        outstanding: 0.00,
        status: "paid",
        notes: "Monthly cycle Sep 2026 - Nexus Health Systems ERP Suite",
        line: { prod: prodErpId, desc: "Business ERP Suite - Odoo Enterprise Edition", qty: 1, price: 1059.00, tax: 190.62, tot: 1249.62 },
        payment: { method: "bank_transfer", ref: "HDFC-NEFT-99182301", date: "2026-09-05" }
      },
      {
        subscription: subNexus,
        company: "Nexus Health Systems",
        periodStart: "2026-10-01",
        periodEnd: "2026-10-31",
        invoiceDate: "2026-10-01",
        dueDate: "2026-10-31",
        subtotal: 1059.00,
        tax: 190.62,
        total: 1249.62,
        paid: 1249.62,
        outstanding: 0.00,
        status: "paid",
        notes: "Monthly cycle Oct 2026 - Nexus Health Systems ERP Suite",
        line: { prod: prodErpId, desc: "Business ERP Suite - Odoo Enterprise Edition", qty: 1, price: 1059.00, tax: 190.62, tot: 1249.62 },
        payment: { method: "bank_transfer", ref: "HDFC-NEFT-10492831", date: "2026-10-04" }
      },
      {
        subscription: subApex,
        company: "Apex Logistics Corp",
        periodStart: "2026-09-15",
        periodEnd: "2026-10-14",
        invoiceDate: "2026-09-15",
        dueDate: "2026-10-15",
        subtotal: 198.00,
        tax: 35.64,
        total: 233.64,
        paid: 100.00,
        outstanding: 133.64,
        status: "partially_paid",
        notes: "Monthly cycle Sep 2026 - Automated Invoicing 2 seats. Partial payment received via UPI.",
        line: { prod: prodInvId, desc: "Automated Invoicing Engine (2 units)", qty: 2, price: 99.00, tax: 35.64, tot: 233.64 },
        payment: { method: "upi", ref: "UPI/2026/8839210984@icici", date: "2026-09-20" }
      },
      {
        subscription: subCloudScale,
        company: "CloudScale Analytics Inc.",
        periodStart: "2026-08-15",
        periodEnd: "2027-08-14",
        invoiceDate: "2026-08-15",
        dueDate: "2026-09-15",
        subtotal: 9244.00,
        tax: 1663.92,
        total: 10907.92,
        paid: 10907.92,
        outstanding: 0.00,
        status: "paid",
        notes: "Annual Enterprise Contract - CloudScale Analytics Inc. (5 Multi-Cloud seats + SLA + Security)",
        line: { prod: prodErpId, desc: "Enterprise Annual Contract - 5 Multi-Cloud Seats & High Availability", qty: 5, price: 1848.80, tax: 1663.92, tot: 10907.92 },
        payment: { method: "bank_transfer", ref: "ICICI-RTGS-772910384", date: "2026-08-20" }
      },
      {
        subscription: subFinGuard,
        company: "FinGuard Global Security",
        periodStart: "2026-09-20",
        periodEnd: "2026-10-19",
        invoiceDate: "2026-09-20",
        dueDate: "2026-10-15", // Overdue!
        subtotal: 2616.00,
        tax: 470.88,
        total: 3086.88,
        paid: 0.00,
        outstanding: 3086.88,
        status: "confirmed",
        notes: "Overdue monthly bill for FinGuard Global Security. Account executive follow-up required.",
        line: { prod: prodErpId, desc: "Enterprise Platform & Security Vault Bundle", qty: 2, price: 1308.00, tax: 470.88, tot: 3086.88 },
        payment: null
      },
      {
        subscription: subBioCare,
        company: "BioCare Diagnostics Labs",
        periodStart: "2026-10-01",
        periodEnd: "2026-10-31",
        invoiceDate: "2026-10-01",
        dueDate: "2026-10-31",
        subtotal: 1059.00,
        tax: 190.62,
        total: 1249.62,
        paid: 1249.62,
        outstanding: 0.00,
        status: "paid",
        notes: "Clinical diagnostics portal monthly software licensing",
        line: { prod: prodErpId, desc: "Business ERP Suite - Odoo Enterprise Edition", qty: 1, price: 1059.00, tax: 190.62, tot: 1249.62 },
        payment: { method: "credit_card", ref: "AUTH_VISA_4242_9921", date: "2026-10-05" }
      },
      {
        subscription: subVanguard,
        company: "Vanguard Dynamics",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        invoiceDate: "2026-08-01",
        dueDate: "2026-08-31",
        subtotal: 4696.00,
        tax: 845.28,
        total: 5541.28,
        paid: 5541.28,
        outstanding: 0.00,
        status: "paid",
        notes: "Industrial Automation Systems ERP + AI Revenue Analytics Suite",
        line: { prod: prodErpId, desc: "Multi-Cloud ERP Seats + AI Analytics Suite", qty: 1, price: 4696.00, tax: 845.28, tot: 5541.28 },
        payment: { method: "bank_transfer", ref: "AXIS-RTGS-55291039", date: "2026-08-05" }
      },
      {
        subscription: subStarlight,
        company: "Starlight Media Group",
        periodStart: "2026-11-01",
        periodEnd: "2026-11-30",
        invoiceDate: "2026-10-28",
        dueDate: "2026-11-20", // Confirmed, due in future
        subtotal: 298.00,
        tax: 53.64,
        total: 351.64,
        paid: 0.00,
        outstanding: 351.64,
        status: "confirmed",
        notes: "Upcoming monthly billing term for API Gateway & Automated Invoicing engine",
        line: { prod: prodApiId, desc: "High-Throughput API Gateway & Invoicing Bundle", qty: 1, price: 298.00, tax: 53.64, tot: 351.64 },
        payment: null
      }
    ];

    for (const inv of invoiceList) {
      const cust = customerMap[inv.company];
      const invRes = await client.query(`
        INSERT INTO invoices (
          subscription_id, customer_id, billing_period_start, billing_period_end,
          invoice_date, due_date, currency,
          subtotal, tax_total, discount_total, total_amount, paid_amount, outstanding_amount,
          status, notes, sent_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'INR', $7, $8, 0.00, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
        RETURNING id, invoice_number;
      `, [
        inv.subscription.id, cust.id, inv.periodStart, inv.periodEnd,
        inv.invoiceDate, inv.dueDate,
        inv.subtotal, inv.tax, inv.total, inv.paid, inv.outstanding,
        inv.status, inv.notes
      ]);
      const createdInv = invRes.rows[0];

      // Insert line
      const invProdName = prodNameMap[inv.line.prod] || "Subscription Software";
      await client.query(`
        INSERT INTO invoice_lines (
          invoice_id, product_id, product_name, description, quantity, unit_price,
          line_subtotal, tax_rule_id, tax_rate_snapshot, tax_amount, discount_amount, line_total,
          period_start, period_end
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 18.00, $9, 0.00, $10, $11, $12);
      `, [
        createdInv.id, inv.line.prod, invProdName, inv.line.desc, inv.line.qty, inv.line.price,
        inv.subtotal, tax18Id, inv.tax, inv.total, inv.periodStart, inv.periodEnd
      ]);

      // Insert payment if recorded
      if (inv.payment && inv.paid > 0) {
        await client.query(`
          INSERT INTO payments (
            invoice_id, payment_method, amount, currency, payment_date,
            reference_number, note, created_by
          )
          VALUES ($1, $2, $3, 'INR', $4, $5, 'Payment received and reconciled', $6);
        `, [
          createdInv.id, inv.payment.method, inv.paid, inv.payment.date,
          inv.payment.ref, marcusStaffId
        ]);
      }
    }

    await client.query("COMMIT;");
    console.log("\n=============================================================");
    console.log("✓ SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=============================================================\n");

  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("\n[X] SEEDING FAILED - Transaction rolled back:");
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
