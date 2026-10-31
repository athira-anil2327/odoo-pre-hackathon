import { syncInvoicesWithBackend } from "./invoices.js";
import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import {
  productsApi,
  plansApi,
  customersApi,
  quotationsApi,
  subscriptionsApi
} from "$lib/api.js";

// Helper to load or persist state in localStorage with stale mock protection
function loadStore(key, fallback) {
  if (browser) {
    const saved = localStorage.getItem(`bl_${key}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(item => 
          item?.id === "PROD-1001" || 
          item?.id === "PLAN-2001" || 
          item?.id === "CUST-1001" || 
          item?.id === "QUO-2026-001" || 
          item?.id === "SUB-2026-0001" ||
          item?.customer_number === "CUST-1001"
        )) {
          localStorage.removeItem(`bl_${key}`);
          return fallback;
        }
        return parsed;
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

// Stores initialized with empty arrays; populated from live PostgreSQL database
export const productsStore = writable(loadStore("products", []));
export const plansStore = writable(loadStore("plans", []));
export const customersStore = writable(loadStore("customers", []));
export const templatesStore = writable(loadStore("templates", []));
export const quotationsStore = writable(loadStore("quotations", []));
export const subscriptionsStore = writable(loadStore("subscriptions", []));
export const eventsStore = writable(loadStore("events", []));

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

// Hydrate live data from backend PostgreSQL database
export async function syncWithBackend() {
  if (!browser) return;
  try {
    const [pRes, plRes, cRes, tRes, qRes, sRes, evRes] = await Promise.allSettled([
      productsApi.getAll(),
      plansApi.getAll(),
      customersApi.getAll(),
      quotationsApi.getTemplates(),
      quotationsApi.getAll(),
      subscriptionsApi.getAll(),
      subscriptionsApi.getAllEvents ? subscriptionsApi.getAllEvents() : Promise.resolve({ success: false })
    ]);

    if (pRes.status === "fulfilled" && pRes.value.success && Array.isArray(pRes.value.data)) {
      productsStore.set(pRes.value.data);
    }
    if (plRes.status === "fulfilled" && plRes.value.success && Array.isArray(plRes.value.data)) {
      plansStore.set(plRes.value.data);
    }
    if (cRes.status === "fulfilled" && cRes.value.success && Array.isArray(cRes.value.data)) {
      customersStore.set(cRes.value.data);
    }
    if (tRes.status === "fulfilled" && tRes.value.success && Array.isArray(tRes.value.data)) {
      templatesStore.set(tRes.value.data);
    }
    if (qRes.status === "fulfilled" && qRes.value.success && Array.isArray(qRes.value.data)) {
      const normalizedQuotes = qRes.value.data.map(q => ({
        ...q,
        quote_number: q.quotation_number || q.quote_number,
        quotation_number: q.quotation_number || q.quote_number
      }));
      quotationsStore.set(normalizedQuotes);
    }
    if (sRes.status === "fulfilled" && sRes.value.success && Array.isArray(sRes.value.data)) {
      subscriptionsStore.set(sRes.value.data);
    }
    if (evRes.status === "fulfilled" && evRes.value?.success && Array.isArray(evRes.value.data)) {
      eventsStore.set(evRes.value.data);
    }

    // Also trigger invoice & payment synchronization
    await syncInvoicesWithBackend();
  } catch (err) {
    console.warn("Backend sync notice:", err);
  }
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
export async function addCustomer(custData) {
  if (browser) {
    const res = await customersApi.create({
      name: custData.name,
      email: custData.email.toLowerCase().trim(),
      phone: custData.phone || "",
      company: custData.company || custData.name,
      billing_address: custData.billing_address || ""
    });
    if (res.success && res.data) {
      await syncWithBackend();
      return res.data;
    } else {
      throw new Error(res.error?.message || "Failed to create customer on server");
    }
  }
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
export async function addTemplate(tmplData) {
  if (browser && tmplData.plan_id && tmplData.plan_id.length > 20) {
    const res = await quotationsApi.createTemplate({
      name: tmplData.name,
      plan_id: tmplData.plan_id,
      validity_days: Number(tmplData.validity_days) || 30,
      description: tmplData.description || "",
      lines: tmplData.lines || []
    });
    if (res.success && res.data) {
      await syncWithBackend();
      return res.data;
    }
  }
  const id = `TMPL-${Date.now().toString().slice(-4)}`;
  
  const processedLines = (tmplData.lines || []).map(line => {
    const qty = Number(line.quantity) || 1;
    const unitPrice = Number(line.unit_price) || 0;
    const priceExtra = Number(line.price_extra || line.variant_price_extra) || 0;
    return {
      product_id: line.product_id,
      product_name: line.product_name || "Product",
      variant_id: line.variant_id || null,
      variant_name: line.variant_name || "None",
      quantity: qty,
      unit_price: unitPrice,
      price_extra: priceExtra,
      effective_unit_price: unitPrice + priceExtra,
      line_total: qty * (unitPrice + priceExtra)
    };
  });

  const newTemplate = {
    id,
    name: tmplData.name,
    plan_id: tmplData.plan_id,
    validity_days: Number(tmplData.validity_days) || 30,
    description: tmplData.description || "",
    lines: processedLines
  };

  templatesStore.update(list => [newTemplate, ...list]);

  // Persist directly to backend PostgreSQL database
  if (browser) {
    quotationsApi.createTemplate({
      name: tmplData.name,
      plan_id: tmplData.plan_id,
      validity_days: Number(tmplData.validity_days) || 30,
      description: tmplData.description || "",
      lines: processedLines.map(l => ({
        product_id: l.product_id,
        variant_id: l.variant_id || null,
        quantity: l.quantity,
        unit_price: l.unit_price
      }))
    }).then(res => {
      if (res && res.success && res.data) {
        const saved = res.data;
        templatesStore.update(list =>
          list.map(t => t.id === id ? { ...t, id: saved.id } : t)
        );
      }
    }).catch(err => console.warn("Backend quotation template persist notice:", err));
  }

  return newTemplate;
}

// -------------------------------------------------------------
// QUOTATION CREATION & STATE MACHINE
// -------------------------------------------------------------
export async function createQuotationFromTemplate(templateId, customerId, customLines = null, options = {}) {
  let template = null;
  templatesStore.subscribe(val => {
    template = val.find(t => t.id === templateId);
  })();

  if (!template) {
    throw new Error("Quotation template not found");
  }

  // Persist directly to PostgreSQL database via from-template API
  if (browser && templateId && templateId.length > 20 && customerId && customerId.length > 20) {
    const res = await quotationsApi.createFromTemplate({
      template_id: templateId,
      customer_id: customerId,
      custom_lines: customLines
    });
    if (res.success && res.data) {
      await syncWithBackend();
      return res.data;
    } else {
      throw new Error(res.error?.message || "Failed to create quotation on server");
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const validUntil = options.validUntil || addDays(today, template.validity_days || 30);
  const quoteNumber = `QUO-2026-${Math.floor(100 + Math.random() * 900)}`;
  const status = options.status || "Draft";

  let linesToProcess = customLines || template.lines;
  let subtotal = 0;

  const processedLines = (linesToProcess || []).map((line, idx) => {
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

  const discountAmount = Number(options.discountAmount || 0);
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableBase * 0.18;
  const totalAmount = taxableBase + taxAmount;

  const newQuote = {
    id: quoteNumber,
    quote_number: quoteNumber,
    customer_id: customerId,
    plan_id: template.plan_id,
    template_id: templateId,
    issue_date: today,
    valid_until: validUntil,
    status: status,
    subtotal: Number(subtotal.toFixed(2)),
    tax_rate: 18.00,
    tax_amount: Number(taxAmount.toFixed(2)),
    discount_amount: Number(discountAmount.toFixed(2)),
    total_amount: Number(totalAmount.toFixed(2)),
    converted_subscription_id: null,
    lines: processedLines
  };

  quotationsStore.update(list => [newQuote, ...list]);
  // Persist directly to backend PostgreSQL database
  if (browser) {
    let customer = null;
    customersStore.subscribe(val => {
      customer = val.find(c => c.id === customerId || c.customer_number === customerId);
    })();

    const dbCustId = customer?.id || customerId;
    const dbTmplId = template.id && template.id.length > 20 ? template.id : null;

    quotationsApi.create({
      customer_id: dbCustId,
      plan_id: template.plan_id,
      template_id: dbTmplId,
      valid_until: validUntil,
      payment_terms: "Net 30",
      notes: `Instantiated from template '${template.name}'`,
      lines: processedLines.map(l => ({
        product_id: l.product_id,
        variant_id: l.variant_id,
        quantity: l.quantity,
        unit_price: l.unit_price
      }))
    }).then(res => {
      if (res.success && res.data) {
        const saved = res.data;
        quotationsStore.update(list =>
          list.map(q =>
            q.id === quoteNumber
              ? {
                  ...q,
                  id: saved.id,
                  quote_number: saved.quotation_number || saved.quote_number,
                  quotation_number: saved.quotation_number || saved.quote_number,
                  status: status
                }
              : q
          )
        );

        if (status === "Quotation") {
          quotationsApi.send(saved.id).catch(e => console.warn("Backend send quote notice:", e));
        }
      }
    }).catch(err => console.warn("Backend quotation persist notice:", err));
  }

  return newQuote;
}

// Transition: Draft -> Quotation (Send Quote)
export async function sendQuotation(quoteId) {
  if (browser && quoteId && quoteId.length > 20) {
    const res = await quotationsApi.send(quoteId);
    if (!res.success) throw new Error(res.error?.message || "Failed to send quotation");
    await syncWithBackend();
    return true;
  }
  quotationsStore.update(list =>
    list.map(q => (q.id === quoteId ? { ...q, status: "Quotation" } : q))
  );
  return true;
}

// Transition: Quotation -> Confirmed
// Validates plan.min_quantity and converts into a linked subscription record!
export async function confirmQuotation(quoteId, performedBy = "Staff Operations") {
  if (browser && quoteId && quoteId.length > 20) {
    const res = await quotationsApi.confirm(quoteId);
    if (!res.success) throw new Error(res.error?.message || "Failed to confirm quotation");
    await syncWithBackend();
    return res.data?.subscription || { subscription_number: "Confirmed" };
  }
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
export async function pauseSubscription(subId, reason = "Requested by customer", performedBy = "Staff Operations") {
  if (browser && subId && subId.length > 20) {
    const res = await subscriptionsApi.pause(subId, reason);
    if (!res.success) throw new Error(res.error?.message || "Failed to pause subscription on server");
    await syncWithBackend();
    return true;
  }
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
export async function resumeSubscription(subId, performedBy = "Staff Operations") {
  if (browser && subId && subId.length > 20) {
    const res = await subscriptionsApi.resume(subId);
    if (!res.success) throw new Error(res.error?.message || "Failed to resume subscription on server");
    await syncWithBackend();
    return true;
  }
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
export async function closeSubscription(subId, reason = "Customer cancelled", performedBy = "Staff Operations") {
  if (browser && subId && subId.length > 20) {
    const res = await subscriptionsApi.close(subId, reason);
    if (!res.success) throw new Error(res.error?.message || "Failed to close subscription on server");
    await syncWithBackend();
    return true;
  }
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
  if (browser && subId && subId.length > 20) {
    subscriptionsApi.renew(subId).then(() => syncWithBackend()).catch(err => console.warn("Backend renew notice:", err));
  }
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
