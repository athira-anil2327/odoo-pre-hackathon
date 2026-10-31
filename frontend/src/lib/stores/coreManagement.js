import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";

// Initial seed data aligned with Brightloop schema & hackathon scenarios
const initialProducts = [
  {
    id: "PROD-1001",
    name: "Business ERP Suite",
    type: "software",
    sales_price: 499.00,
    cost_price: 150.00,
    notes: "Main business software suite with CRM, billing, and inventory modules",
    is_active: true,
    variants: [
      {
        id: "VAR-1001-STD",
        attribute_name: "Brand",
        attribute_value: "Standard Edition",
        price_extra: 0.00,
        sku: "ERP-STD"
      },
      {
        id: "VAR-1001-ODOO",
        attribute_name: "Brand",
        attribute_value: "Odoo Enterprise Edition",
        price_extra: 560.00,
        sku: "ERP-ODOO-ENT"
      }
    ]
  },
  {
    id: "PROD-1002",
    name: "Automated Invoicing Addon",
    type: "addon",
    sales_price: 99.00,
    cost_price: 20.00,
    notes: "Add-on module to automatically generate, calculate taxes, and email recurring invoices",
    is_active: true,
    variants: []
  },
  {
    id: "PROD-1003",
    name: "Priority 24/7 SLA Support",
    type: "service",
    sales_price: 150.00,
    cost_price: 50.00,
    notes: "Dedicated SLA support channel with sub-hour guaranteed turnaround",
    is_active: true,
    variants: []
  }
];

const initialPlans = [
  {
    id: "PLAN-2001",
    name: "Starter Monthly",
    billing_frequency: "monthly",
    price: 199.00,
    min_quantity: 1,
    start_date: "2026-01-01",
    end_date: "2027-12-31",
    auto_close_on_end: false,
    allow_early_close: true,
    allow_pause: true,
    allow_renewal: true,
    is_active: true,
    included_products: ["PROD-1002"]
  },
  {
    id: "PLAN-2002",
    name: "Growth Cloud Monthly",
    billing_frequency: "monthly",
    price: 499.00,
    min_quantity: 1,
    start_date: "2026-01-01",
    end_date: "2027-12-31",
    auto_close_on_end: false,
    allow_early_close: true,
    allow_pause: true,
    allow_renewal: true,
    is_active: true,
    included_products: ["PROD-1001", "PROD-1002"]
  },
  {
    id: "PLAN-2003",
    name: "Enterprise Annual Contract",
    billing_frequency: "yearly",
    price: 4990.00,
    min_quantity: 5,
    start_date: "2026-01-01",
    end_date: "2027-12-31",
    auto_close_on_end: true,
    allow_early_close: true,
    allow_pause: false, // Explicitly locked: Pause not allowed on locked yearly contract
    allow_renewal: true,
    is_active: true,
    included_products: ["PROD-1001", "PROD-1002", "PROD-1003"]
  }
];

const initialCustomers = [
  {
    id: "CUST-1001",
    customer_number: "CUST-1001",
    name: "Dr. Eleanor Vance",
    email: "eleanor.vance@nexushealth.org",
    phone: "+1 (555) 234-8901",
    company: "Nexus Health Systems",
    billing_address: "742 Evergreen Terrace, Springfield, OR",
    user_id: "USR-003",
    status: "Active"
  },
  {
    id: "CUST-1002",
    customer_number: "CUST-1002",
    name: "Marcus Brody (Apex)",
    email: "billing@apexlogistics.com",
    phone: "+1 (555) 887-2190",
    company: "Apex Logistics Corp",
    billing_address: "1200 Market Street, Suite 400, Philadelphia, PA",
    user_id: "USR-004",
    status: "Active"
  },
  {
    id: "CUST-1003",
    customer_number: "CUST-1003",
    name: "Greenleaf Retailers",
    email: "contact@greenleaf.shop",
    phone: "+1 (555) 431-7722",
    company: "Greenleaf Retailers Inc.",
    billing_address: "55 Broadway Ave, New York, NY",
    user_id: null,
    status: "Active"
  }
];

const initialTemplates = [
  {
    id: "TMPL-3001",
    name: "Growth Cloud Starter Template",
    plan_id: "PLAN-2002",
    validity_days: 30,
    description: "Standard bundle for growing businesses with Odoo Enterprise ERP suite and Automated Invoicing Addon",
    lines: [
      {
        product_id: "PROD-1001",
        variant_id: "VAR-1001-ODOO",
        quantity: 1,
        unit_price: 499.00,
        variant_price_extra: 560.00
      },
      {
        product_id: "PROD-1002",
        variant_id: null,
        quantity: 1,
        unit_price: 99.00,
        variant_price_extra: 0.00
      }
    ]
  },
  {
    id: "TMPL-3002",
    name: "Enterprise Multi-Seat Annual Template",
    plan_id: "PLAN-2003",
    validity_days: 45,
    description: "Comprehensive locked annual enterprise deal with 5-seat minimum and 24/7 priority support",
    lines: [
      {
        product_id: "PROD-1001",
        variant_id: "VAR-1001-ODOO",
        quantity: 5,
        unit_price: 499.00,
        variant_price_extra: 560.00
      },
      {
        product_id: "PROD-1003",
        variant_id: null,
        quantity: 5,
        unit_price: 150.00,
        variant_price_extra: 0.00
      }
    ]
  }
];

const initialQuotations = [
  {
    id: "QUO-2026-001",
    quote_number: "QUO-2026-001",
    customer_id: "CUST-1001",
    plan_id: "PLAN-2002",
    template_id: "TMPL-3001",
    issue_date: "2026-10-15",
    valid_until: "2026-11-14",
    status: "Confirmed",
    subtotal: 1158.00,
    tax_rate: 18.00,
    tax_amount: 208.44,
    discount_amount: 0.00,
    total_amount: 1366.44,
    converted_subscription_id: "SUB-2026-0001",
    lines: [
      {
        id: "QL-1",
        product_id: "PROD-1001",
        product_name: "Business ERP Suite",
        variant_id: "VAR-1001-ODOO",
        variant_name: "Odoo Enterprise Edition (+560.00)",
        quantity: 1,
        unit_price: 499.00,
        price_extra: 560.00,
        effective_unit_price: 1059.00,
        line_subtotal: 1059.00,
        tax_amount: 190.62,
        line_total: 1249.62
      },
      {
        id: "QL-2",
        product_id: "PROD-1002",
        product_name: "Automated Invoicing Addon",
        variant_id: null,
        variant_name: "None",
        quantity: 1,
        unit_price: 99.00,
        price_extra: 0.00,
        effective_unit_price: 99.00,
        line_subtotal: 99.00,
        tax_amount: 17.82,
        line_total: 116.82
      }
    ]
  },
  {
    id: "QUO-2026-002",
    quote_number: "QUO-2026-002",
    customer_id: "CUST-1002",
    plan_id: "PLAN-2001",
    template_id: null,
    issue_date: "2026-10-22",
    valid_until: "2026-11-21",
    status: "Quotation",
    subtotal: 199.00,
    tax_rate: 18.00,
    tax_amount: 35.82,
    discount_amount: 0.00,
    total_amount: 234.82,
    converted_subscription_id: null,
    lines: [
      {
        id: "QL-3",
        product_id: "PROD-1001",
        product_name: "Business ERP Suite",
        variant_id: "VAR-1001-STD",
        variant_name: "Standard Edition",
        quantity: 1,
        unit_price: 199.00,
        price_extra: 0.00,
        effective_unit_price: 199.00,
        line_subtotal: 199.00,
        tax_amount: 35.82,
        line_total: 234.82
      }
    ]
  },
  {
    id: "QUO-2026-003",
    quote_number: "QUO-2026-003",
    customer_id: "CUST-1003",
    plan_id: "PLAN-2003",
    template_id: "TMPL-3002",
    issue_date: "2026-10-28",
    valid_until: "2026-12-12",
    status: "Draft",
    subtotal: 6045.00,
    tax_rate: 18.00,
    tax_amount: 1088.10,
    discount_amount: 0.00,
    total_amount: 7133.10,
    converted_subscription_id: null,
    lines: [
      {
        id: "QL-4",
        product_id: "PROD-1001",
        product_name: "Business ERP Suite",
        variant_id: "VAR-1001-ODOO",
        variant_name: "Odoo Enterprise Edition (+560.00)",
        quantity: 5,
        unit_price: 499.00,
        price_extra: 560.00,
        effective_unit_price: 1059.00,
        line_subtotal: 5295.00,
        tax_amount: 953.10,
        line_total: 6248.10
      },
      {
        id: "QL-5",
        product_id: "PROD-1003",
        product_name: "Priority 24/7 SLA Support",
        variant_id: null,
        variant_name: "None",
        quantity: 5,
        unit_price: 150.00,
        price_extra: 0.00,
        effective_unit_price: 150.00,
        line_subtotal: 750.00,
        tax_amount: 135.00,
        line_total: 885.00
      }
    ]
  }
];

const initialSubscriptions = [
  {
    id: "SUB-2026-0001",
    subscription_number: "SUB-2026-0001",
    customer_id: "CUST-1001",
    plan_id: "PLAN-2002",
    plan_name: "Growth Cloud Monthly",
    billing_frequency: "monthly",
    status: "Active",
    start_date: "2026-10-01",
    expiry_date: "2027-09-30",
    next_billing_date: "2026-11-01",
    payment_terms: "Immediate",
    subtotal: 1059.00,
    tax_amount: 190.62,
    discount_amount: 0.00,
    total_amount: 1249.62,
    paused_at: null,
    closed_at: null,
    renewed_from_subscription_id: null,
    lines: [
      {
        product_id: "PROD-1001",
        product_name: "Business ERP Suite",
        variant_id: "VAR-1001-ODOO",
        variant_name: "Odoo Enterprise Edition (+560.00)",
        quantity: 1,
        unit_price: 1059.00,
        line_total: 1249.62
      }
    ]
  },
  {
    id: "SUB-2026-0002",
    subscription_number: "SUB-2026-0002",
    customer_id: "CUST-1002",
    plan_id: "PLAN-2001",
    plan_name: "Starter Monthly",
    billing_frequency: "monthly",
    status: "Active",
    start_date: "2026-09-15",
    expiry_date: "2027-09-15",
    next_billing_date: "2026-11-15",
    payment_terms: "Net 30",
    subtotal: 199.00,
    tax_amount: 35.82,
    discount_amount: 0.00,
    total_amount: 234.82,
    paused_at: null,
    closed_at: null,
    renewed_from_subscription_id: null,
    lines: [
      {
        product_id: "PROD-1001",
        product_name: "Business ERP Suite",
        variant_id: "VAR-1001-STD",
        variant_name: "Standard Edition",
        quantity: 1,
        unit_price: 199.00,
        line_total: 234.82
      }
    ]
  },
  {
    id: "SUB-2026-0003",
    subscription_number: "SUB-2026-0003",
    customer_id: "CUST-1003",
    plan_id: "PLAN-2003",
    plan_name: "Enterprise Annual Contract",
    billing_frequency: "yearly",
    status: "Confirmed",
    start_date: "2026-10-31",
    expiry_date: "2027-10-31",
    next_billing_date: null, // Set upon activation
    payment_terms: "Immediate",
    subtotal: 6045.00,
    tax_amount: 1088.10,
    discount_amount: 0.00,
    total_amount: 7133.10,
    paused_at: null,
    closed_at: null,
    renewed_from_subscription_id: null,
    lines: [
      {
        product_id: "PROD-1001",
        product_name: "Business ERP Suite",
        variant_id: "VAR-1001-ODOO",
        variant_name: "Odoo Enterprise Edition (+560.00)",
        quantity: 5,
        unit_price: 1059.00,
        line_total: 6248.10
      },
      {
        product_id: "PROD-1003",
        product_name: "Priority 24/7 SLA Support",
        variant_id: null,
        variant_name: "None",
        quantity: 5,
        unit_price: 150.00,
        line_total: 885.00
      }
    ]
  }
];

const initialEvents = [
  {
    id: "EVT-001",
    subscription_id: "SUB-2026-0001",
    from_status: "Draft",
    to_status: "Quotation",
    event_type: "sent",
    performed_by: "Sales Representative",
    reason: "Proposal dispatched to customer",
    timestamp: "2026-10-15 10:30:00"
  },
  {
    id: "EVT-002",
    subscription_id: "SUB-2026-0001",
    from_status: "Quotation",
    to_status: "Confirmed",
    event_type: "confirmed",
    performed_by: "Dr. Eleanor Vance",
    reason: "Quotation accepted & min_quantity verified",
    timestamp: "2026-10-18 14:15:00"
  },
  {
    id: "EVT-003",
    subscription_id: "SUB-2026-0001",
    from_status: "Confirmed",
    to_status: "Active",
    event_type: "activated",
    performed_by: "Internal Billing System",
    reason: "Contract activated, next_billing_date set to 2026-11-01",
    timestamp: "2026-10-19 09:00:00"
  },
  {
    id: "EVT-004",
    subscription_id: "SUB-2026-0002",
    from_status: "Confirmed",
    to_status: "Active",
    event_type: "activated",
    performed_by: "Internal Billing System",
    reason: "Contract activated with monthly frequency",
    timestamp: "2026-09-15 10:00:00"
  },
  {
    id: "EVT-005",
    subscription_id: "SUB-2026-0003",
    from_status: "Quotation",
    to_status: "Confirmed",
    event_type: "confirmed",
    performed_by: "Brightloop Staff",
    reason: "Verified enterprise min_quantity of 5 seats",
    timestamp: "2026-10-31 11:00:00"
  }
];

// Helper to load or persist state in localStorage
function loadStore(key, fallback) {
  if (browser) {
    const saved = localStorage.getItem(`bl_${key}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(`Error parsing store ${key}`, e);
      }
    }
  }
  return fallback;
}

function persistStore(key, value) {
  if (browser) {
    localStorage.setItem(`bl_${key}`, JSON.stringify(value));
  }
}

// Create stores
export const productsStore = writable(loadStore("products", initialProducts));
export const plansStore = writable(loadStore("plans", initialPlans));
export const customersStore = writable(loadStore("customers", initialCustomers));
export const templatesStore = writable(loadStore("templates", initialTemplates));
export const quotationsStore = writable(loadStore("quotations", initialQuotations));
export const subscriptionsStore = writable(loadStore("subscriptions", initialSubscriptions));
export const eventsStore = writable(loadStore("events", initialEvents));

// Auto-persist on changes
if (browser) {
  productsStore.subscribe(val => persistStore("products", val));
  plansStore.subscribe(val => persistStore("plans", val));
  customersStore.subscribe(val => persistStore("customers", val));
  templatesStore.subscribe(val => persistStore("templates", val));
  quotationsStore.subscribe(val => persistStore("quotations", val));
  subscriptionsStore.subscribe(val => persistStore("subscriptions", val));
  eventsStore.subscribe(val => persistStore("events", val));
}

// Mathematical date computation based on plan frequency
export function calculateNextBillingDate(startDateStr, frequency) {
  const d = new Date(startDateStr);
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];

  if (frequency === "daily") {
    d.setDate(d.getDate() + 1);
  } else if (frequency === "weekly") {
    d.setDate(d.getDate() + 7);
  } else if (frequency === "monthly") {
    d.setMonth(d.getMonth() + 1);
  } else if (frequency === "yearly") {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().split("T")[0];
}

// Date offset calculation: date + days
export function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + Number(days));
  return d.toISOString().split("T")[0];
}

// -------------------------------------------------------------
// PRODUCT & VARIANT ACTIONS
// -------------------------------------------------------------
export function addProduct(productData) {
  const id = `PROD-${Date.now().toString().slice(-4)}`;
  const newProduct = {
    id,
    name: productData.name,
    type: productData.type || "software",
    sales_price: Number(productData.sales_price) || 0,
    cost_price: Number(productData.cost_price) || 0,
    notes: productData.notes || "",
    is_active: productData.is_active !== false,
    variants: productData.variants || []
  };
  productsStore.update(list => [newProduct, ...list]);
  return newProduct;
}

export function addVariantToProduct(productId, variantData) {
  const varId = `VAR-${Date.now().toString().slice(-4)}`;
  const newVariant = {
    id: varId,
    attribute_name: variantData.attribute_name || "Brand",
    attribute_value: variantData.attribute_value || "Odoo",
    price_extra: Number(variantData.price_extra) || 0,
    sku: variantData.sku || `SKU-${Date.now().toString().slice(-4)}`
  };

  productsStore.update(list =>
    list.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          variants: [...(p.variants || []), newVariant]
        };
      }
      return p;
    })
  );
  return newVariant;
}

// -------------------------------------------------------------
// PLAN ACTIONS
// -------------------------------------------------------------
export function addPlan(planData) {
  const id = `PLAN-${Date.now().toString().slice(-4)}`;
  const newPlan = {
    id,
    name: planData.name,
    billing_frequency: planData.billing_frequency || "monthly",
    price: Number(planData.price) || 0,
    min_quantity: Number(planData.min_quantity) || 1,
    start_date: planData.start_date || new Date().toISOString().split("T")[0],
    end_date: planData.end_date || "2027-12-31",
    auto_close_on_end: Boolean(planData.auto_close_on_end),
    allow_early_close: planData.allow_early_close !== false,
    allow_pause: planData.allow_pause !== false,
    allow_renewal: planData.allow_renewal !== false,
    is_active: true,
    included_products: planData.included_products || []
  };
  plansStore.update(list => [newPlan, ...list]);
  return newPlan;
}

// -------------------------------------------------------------
// CUSTOMER ACTIONS
// -------------------------------------------------------------
export function addCustomer(custData) {
  const seq = Math.floor(1000 + Math.random() * 9000);
  const custNumber = `CUST-${seq}`;
  const newCust = {
    id: custNumber,
    customer_number: custNumber,
    name: custData.name,
    email: custData.email.toLowerCase().trim(),
    phone: custData.phone || "",
    company: custData.company || custData.name,
    billing_address: custData.billing_address || "",
    user_id: custData.user_id || null,
    status: "Active"
  };
  customersStore.update(list => [newCust, ...list]);
  return newCust;
}

// -------------------------------------------------------------
// QUOTATION TEMPLATE ACTIONS
// -------------------------------------------------------------
export function addTemplate(tmplData) {
  const id = `TMPL-${Date.now().toString().slice(-4)}`;
  const newTemplate = {
    id,
    name: tmplData.name,
    plan_id: tmplData.plan_id,
    validity_days: Number(tmplData.validity_days) || 30,
    description: tmplData.description || "",
    lines: tmplData.lines || []
  };
  templatesStore.update(list => [newTemplate, ...list]);
  return newTemplate;
}

// -------------------------------------------------------------
// QUOTATION CREATION & STATE MACHINE
// -------------------------------------------------------------
export function createQuotationFromTemplate(templateId, customerId, customLines = null) {
  let template = null;
  templatesStore.subscribe(val => {
    template = val.find(t => t.id === templateId);
  })();

  if (!template) {
    throw new Error("Quotation template not found");
  }

  const today = new Date().toISOString().split("T")[0];
  const validUntil = addDays(today, template.validity_days);
  const quoteNumber = `QUO-2026-${Math.floor(100 + Math.random() * 900)}`;

  let linesToProcess = customLines || template.lines;
  let subtotal = 0;

  const processedLines = linesToProcess.map((line, idx) => {
    const qty = Number(line.quantity) || 1;
    const basePrice = Number(line.unit_price) || 0;
    const priceExtra = Number(line.price_extra || line.variant_price_extra) || 0;
    const effectiveUnitPrice = basePrice + priceExtra;
    const lineSubtotal = effectiveUnitPrice * qty;
    const taxAmount = lineSubtotal * 0.18; // 18% Standard Tax
    const lineTotal = lineSubtotal + taxAmount;

    subtotal += lineSubtotal;

    return {
      id: `QL-${Date.now()}-${idx}`,
      product_id: line.product_id,
      product_name: line.product_name || "Product",
      variant_id: line.variant_id || null,
      variant_name: line.variant_name || "None",
      quantity: qty,
      unit_price: basePrice,
      price_extra: priceExtra,
      effective_unit_price: effectiveUnitPrice,
      line_subtotal: lineSubtotal,
      tax_amount: taxAmount,
      line_total: lineTotal
    };
  });

  const taxAmount = subtotal * 0.18;
  const totalAmount = subtotal + taxAmount;

  const newQuote = {
    id: quoteNumber,
    quote_number: quoteNumber,
    customer_id: customerId,
    plan_id: template.plan_id,
    template_id: templateId,
    issue_date: today,
    valid_until: validUntil,
    status: "Draft",
    subtotal: Number(subtotal.toFixed(2)),
    tax_rate: 18.00,
    tax_amount: Number(taxAmount.toFixed(2)),
    discount_amount: 0.00,
    total_amount: Number(totalAmount.toFixed(2)),
    converted_subscription_id: null,
    lines: processedLines
  };

  quotationsStore.update(list => [newQuote, ...list]);
  return newQuote;
}

// Transition: Draft -> Quotation (Send Quote)
export function sendQuotation(quoteId) {
  quotationsStore.update(list =>
    list.map(q => (q.id === quoteId ? { ...q, status: "Quotation" } : q))
  );
  return true;
}

// Transition: Quotation -> Confirmed
// Validates plan.min_quantity and converts into a linked subscription record!
export function confirmQuotation(quoteId, performedBy = "Staff Operations") {
  let quote = null;
  quotationsStore.subscribe(val => {
    quote = val.find(q => q.id === quoteId);
  })();

  if (!quote) throw new Error("Quotation not found");

  let plan = null;
  plansStore.subscribe(val => {
    plan = val.find(p => p.id === quote.plan_id);
  })();

  // 1. Enforce Plan Minimum Quantity Check
  const totalQuantity = (quote.lines || []).reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);
  const minRequired = plan ? plan.min_quantity : 1;

  if (totalQuantity < minRequired) {
    throw new Error(
      `Plan requirement violated: Total quantity (${totalQuantity}) is below the required plan minimum of ${minRequired}.`
    );
  }

  // 2. Generate linked subscription record
  const subNumber = `SUB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const today = new Date().toISOString().split("T")[0];
  const expiry = addDays(today, plan?.billing_frequency === "yearly" ? 365 : 30);

  const newSub = {
    id: subNumber,
    subscription_number: subNumber,
    customer_id: quote.customer_id,
    plan_id: quote.plan_id,
    plan_name: plan ? plan.name : "Custom Subscription",
    billing_frequency: plan ? plan.billing_frequency : "monthly",
    status: "Confirmed",
    start_date: today,
    expiry_date: expiry,
    next_billing_date: null, // Computed upon activation
    payment_terms: "Immediate",
    subtotal: quote.subtotal,
    tax_amount: quote.tax_amount,
    discount_amount: quote.discount_amount,
    total_amount: quote.total_amount,
    paused_at: null,
    closed_at: null,
    renewed_from_subscription_id: null,
    lines: quote.lines.map(l => ({
      product_id: l.product_id,
      product_name: l.product_name,
      variant_id: l.variant_id,
      variant_name: l.variant_name,
      quantity: l.quantity,
      unit_price: l.effective_unit_price,
      line_total: l.line_total
    }))
  };

  // Update Quotation
  quotationsStore.update(list =>
    list.map(q =>
      q.id === quoteId
        ? { ...q, status: "Confirmed", converted_subscription_id: subNumber }
        : q
    )
  );

  // Add Subscription
  subscriptionsStore.update(list => [newSub, ...list]);

  // Log Audit Event
  logSubscriptionEvent(
    subNumber,
    "Quotation",
    "Confirmed",
    "confirmed",
    performedBy,
    `Quotation ${quote.quote_number} confirmed. Verified quantity ${totalQuantity} >= ${minRequired}.`
  );

  return newSub;
}

// -------------------------------------------------------------
// SUBSCRIPTION LIFECYCLE STATE MACHINE & AUDIT LOGGING
// -------------------------------------------------------------
export function logSubscriptionEvent(subId, fromStatus, toStatus, eventType, performedBy, reason) {
  const newEvt = {
    id: `EVT-${Date.now().toString().slice(-4)}`,
    subscription_id: subId,
    from_status: fromStatus,
    to_status: toStatus,
    event_type: eventType,
    performed_by: performedBy,
    reason,
    timestamp: new Date().toISOString().replace("T", " ").slice(0, 19)
  };
  eventsStore.update(list => [newEvt, ...list]);
  return newEvt;
}

// Transition: Confirmed -> Active (Activation)
export function activateSubscription(subId, performedBy = "Staff Operations") {
  let sub = null;
  subscriptionsStore.subscribe(val => {
    sub = val.find(s => s.id === subId);
  })();

  if (!sub) throw new Error("Subscription not found");
  if (sub.status !== "Confirmed") {
    throw new Error(`Cannot activate subscription in status '${sub.status}'. Must be 'Confirmed'.`);
  }

  let plan = null;
  plansStore.subscribe(val => {
    plan = val.find(p => p.id === sub.plan_id);
  })();

  const today = new Date().toISOString().split("T")[0];
  const freq = plan ? plan.billing_frequency : sub.billing_frequency || "monthly";
  const nextBilling = calculateNextBillingDate(today, freq);
  const expiry = addDays(today, freq === "yearly" ? 365 : 30);

  subscriptionsStore.update(list =>
    list.map(s => {
      if (s.id === subId) {
        return {
          ...s,
          status: "Active",
          start_date: today,
          expiry_date: expiry,
          next_billing_date: nextBilling
        };
      }
      return s;
    })
  );

  logSubscriptionEvent(
    subId,
    "Confirmed",
    "Active",
    "activated",
    performedBy,
    `Subscription activated. Next billing date scheduled for ${nextBilling} (${freq} billing).`
  );

  return true;
}

// Transition: Active -> Paused (Pause)
export function pauseSubscription(subId, reason = "Requested by customer", performedBy = "Staff Operations") {
  let sub = null;
  subscriptionsStore.subscribe(val => {
    sub = val.find(s => s.id === subId);
  })();

  if (!sub) throw new Error("Subscription not found");

  let plan = null;
  plansStore.subscribe(val => {
    plan = val.find(p => p.id === sub.plan_id);
  })();

  // Verify Lifecycle Policy: allow_pause
  if (plan && plan.allow_pause === false) {
    throw new Error(`Policy Rejection: Subscription plan '${plan.name}' does not allow pausing.`);
  }

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  subscriptionsStore.update(list =>
    list.map(s => (s.id === subId ? { ...s, status: "Paused", paused_at: now } : s))
  );

  logSubscriptionEvent(
    subId,
    "Active",
    "Paused",
    "paused",
    performedBy,
    `Subscription paused: ${reason}`
  );

  return true;
}

// Transition: Paused -> Active (Resume)
export function resumeSubscription(subId, performedBy = "Staff Operations") {
  subscriptionsStore.update(list =>
    list.map(s => (s.id === subId ? { ...s, status: "Active", paused_at: null } : s))
  );

  logSubscriptionEvent(
    subId,
    "Paused",
    "Active",
    "resumed",
    performedBy,
    "Subscription resumed and recurring service restored."
  );

  return true;
}

// Transition: Active -> Closed (Early Closure)
export function closeSubscription(subId, reason = "Customer cancelled", performedBy = "Staff Operations") {
  let sub = null;
  subscriptionsStore.subscribe(val => {
    sub = val.find(s => s.id === subId);
  })();

  if (!sub) throw new Error("Subscription not found");

  let plan = null;
  plansStore.subscribe(val => {
    plan = val.find(p => p.id === sub.plan_id);
  })();

  const today = new Date().toISOString().split("T")[0];
  const isEarlyClosure = sub.expiry_date && today < sub.expiry_date;

  // Verify Lifecycle Policy: allow_early_close
  if (isEarlyClosure && plan && plan.allow_early_close === false) {
    throw new Error(`Policy Rejection: Subscription plan '${plan.name}' does not allow early closure before expiry date.`);
  }

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  subscriptionsStore.update(list =>
    list.map(s => (s.id === subId ? { ...s, status: "Closed", closed_at: now } : s))
  );

  logSubscriptionEvent(
    subId,
    sub.status,
    "Closed",
    "closed",
    performedBy,
    `Subscription closed: ${reason}`
  );

  return true;
}

// Transition: Renewal (Create new subscription linked via renewed_from_subscription_id)
export function renewSubscription(subId, performedBy = "Staff Operations") {
  let sub = null;
  subscriptionsStore.subscribe(val => {
    sub = val.find(s => s.id === subId);
  })();

  if (!sub) throw new Error("Subscription not found");

  let plan = null;
  plansStore.subscribe(val => {
    plan = val.find(p => p.id === sub.plan_id);
  })();

  // Verify Lifecycle Policy: allow_renewal
  if (plan && plan.allow_renewal === false) {
    throw new Error(`Policy Rejection: Subscription plan '${plan.name}' does not permit renewals.`);
  }

  const seq = Math.floor(1000 + Math.random() * 9000);
  const newSubNumber = `SUB-2026-${seq}`;
  const renewalStartDate = sub.expiry_date || new Date().toISOString().split("T")[0];
  const freq = plan ? plan.billing_frequency : sub.billing_frequency || "monthly";
  const newExpiry = addDays(renewalStartDate, freq === "yearly" ? 365 : 30);
  const nextBilling = calculateNextBillingDate(renewalStartDate, freq);

  const renewedSub = {
    ...sub,
    id: newSubNumber,
    subscription_number: newSubNumber,
    status: "Active",
    start_date: renewalStartDate,
    expiry_date: newExpiry,
    next_billing_date: nextBilling,
    renewed_from_subscription_id: sub.id,
    paused_at: null,
    closed_at: null
  };

  subscriptionsStore.update(list => [renewedSub, ...list]);

  logSubscriptionEvent(
    sub.id,
    sub.status,
    "Renewed",
    "renewed",
    performedBy,
    `Subscription renewed into ${newSubNumber} through ${newExpiry}.`
  );

  logSubscriptionEvent(
    newSubNumber,
    "Draft",
    "Active",
    "created",
    performedBy,
    `Renewal subscription created referencing parent ${sub.id}.`
  );

  return renewedSub;
}
