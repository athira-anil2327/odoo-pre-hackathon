import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import { subscriptionsStore, customersStore, calculateNextBillingDate, addDays, logSubscriptionEvent } from "$lib/stores/coreManagement.js";
import { invoicesApi, paymentsApi } from "$lib/api.js";

// Helper to load or persist state in localStorage
function loadStore(key, fallback) {
  if (browser) {
    const saved = localStorage.getItem(`bl_${key}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(item => 
          item?.id === "INV-2026-000001" || 
          item?.id === "PAY-2026-000001" || 
          item?.invoice_number === "INV-2034"
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

// Stores initialized with empty arrays; hydrated from PostgreSQL database
export const invoicesStore = writable(loadStore("invoices", []));
export const paymentsStore = writable(loadStore("payments", []));

if (browser) {
  invoicesStore.subscribe(val => persistStore("invoices", val));
  paymentsStore.subscribe(val => persistStore("payments", val));
}

export async function syncInvoicesWithBackend() {
  if (!browser) return;
  try {
    const res = await invoicesApi.getAll();
    if (res.success && Array.isArray(res.data)) {
      const dbInvoices = res.data.map(i => ({
        id: i.id,
        invoice_number: i.invoice_number,
        subscription_id: i.subscription_id,
        subscription_number: i.subscription_number,
        customer_id: i.customer_id,
        customer_name: i.customer_company || i.customer_name,
        contact_name: i.customer_name,
        contact_email: i.customer_email,
        billing_address: i.billing_address || "",
        tax_id: i.tax_id || "GST-29AABCU9603R1ZM",
        billing_period_start: i.billing_period_start ? String(i.billing_period_start).slice(0, 10) : "",
        billing_period_end: i.billing_period_end ? String(i.billing_period_end).slice(0, 10) : "",
        invoice_date: i.invoice_date ? String(i.invoice_date).slice(0, 10) : "",
        due_date: i.due_date ? String(i.due_date).slice(0, 10) : "",
        currency: i.currency || "INR",
        subtotal: Number(i.subtotal) || 0,
        tax_total: Number(i.tax_total) || 0,
        discount_total: Number(i.discount_total) || 0,
        total_amount: Number(i.total_amount) || 0,
        paid_amount: Number(i.paid_amount) || 0,
        outstanding_amount: Number(i.outstanding_amount) || 0,
        status: i.status || "confirmed",
        sent_at: i.sent_at || "",
        notes: i.notes || "",
        lines: i.lines || []
      }));

      invoicesStore.set(dbInvoices);
    }

    const payRes = await paymentsApi.getAll();
    if (payRes.success && Array.isArray(payRes.data)) {
      paymentsStore.set(payRes.data);
    }
  } catch (err) {
    console.warn("Could not sync invoices with backend:", err.message);
  }
}

// -----------------------------------------------------------------------------
// DYNAMIC KPI COMPUTATIONS
// Meets critical requirements:
// - Total Invoiced: sum of total_amount of all non-cancelled invoices
// - Collected: sum of recorded payments
// - Outstanding: sum of outstanding balance on confirmed & partially_paid invoices (excludes cancelled)
// - Overdue: invoices past due_date with outstanding balance > 0 (includes partially paid overdue)
// - Currency is standardized to INR
// -----------------------------------------------------------------------------
export const kpisStore = derived([invoicesStore, paymentsStore], ([$invoices, $payments]) => {
  const activeInvoices = $invoices.filter(i => i.status !== "cancelled");
  const today = new Date().toISOString().split("T")[0];

  const totalInvoiced = activeInvoices.reduce((acc, i) => acc + (Number(i.total_amount) || 0), 0);
  const collected = $payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const outstanding = activeInvoices.reduce((acc, i) => acc + (Number(i.outstanding_amount) || 0), 0);

  const overdueInvoices = activeInvoices.filter(i => {
    return i.due_date < today && Number(i.outstanding_amount) > 0;
  });
  const overdue = overdueInvoices.reduce((acc, i) => acc + (Number(i.outstanding_amount) || 0), 0);

  return {
    totalInvoiced,
    collected,
    outstanding,
    overdue,
    overdueCount: overdueInvoices.length,
    pendingCount: activeInvoices.filter(i => Number(i.outstanding_amount) > 0).length,
    totalCount: $invoices.length
  };
});

// -----------------------------------------------------------------------------
// BUSINESS LOGIC: GENERATE INVOICE FOR SUBSCRIPTION
// Enforces:
// 1. Only eligible active subscriptions due for billing
// 2. Prevent duplicate invoices for the same (subscription_id, billing_period_start)
// 3. Line items snapshot from subscription lines
// 4. Advances subscription next_billing_date after successful generation
// -----------------------------------------------------------------------------
export function generateInvoiceForSubscription(subscriptionId, customPeriodStart = null, customPeriodEnd = null, notes = "") {
  let sub = null;
  subscriptionsStore.subscribe(val => {
    sub = val.find(s => s.id === subscriptionId);
  })();

  if (!sub) {
    throw new Error(`Subscription not found: ${subscriptionId}`);
  }

  if (sub.status !== "Active") {
    throw new Error(`Cannot bill subscription in '${sub.status}' state. Only 'Active' subscriptions can be billed.`);
  }

  let customer = null;
  customersStore.subscribe(val => {
    customer = val.find(c => c.id === sub.customer_id);
  })();

  const today = new Date().toISOString().split("T")[0];
  const periodStart = customPeriodStart || sub.next_billing_date || today;

  // Calculate periodEnd based on subscription billing frequency
  let periodEnd = customPeriodEnd;
  if (!periodEnd) {
    const d = new Date(periodStart);
    if (sub.billing_frequency === "yearly") {
      d.setFullYear(d.getFullYear() + 1);
    } else if (sub.billing_frequency === "weekly") {
      d.setDate(d.getDate() + 7);
    } else if (sub.billing_frequency === "daily") {
      d.setDate(d.getDate() + 1);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    d.setDate(d.getDate() - 1);
    periodEnd = d.toISOString().split("T")[0];
  }

  // Idempotency check: unique constraint (subscription_id, billing_period_start)
  let allInvoices = [];
  invoicesStore.subscribe(val => {
    allInvoices = val;
  })();

  const duplicate = allInvoices.find(
    inv => inv.subscription_id === subscriptionId && inv.billing_period_start === periodStart
  );

  if (duplicate) {
    throw new Error(
      `Duplicate Invoice Rejected: An invoice (${duplicate.invoice_number}) already exists for subscription ${sub.subscription_number} and billing period starting ${periodStart}.`
    );
  }

  // Next invoice sequence
  const seq = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `INV-2026-${seq}`;

  // Snapshot lines from subscription
  const subtotal = Number(sub.subtotal) || 0;
  const taxTotal = Number(sub.tax_amount) || 0;
  const discountTotal = Number(sub.discount_amount) || 0;
  const totalAmount = Number(sub.total_amount) || (subtotal + taxTotal - discountTotal);

  const lines = (sub.lines || []).map((l, idx) => ({
    id: `IL-${Date.now()}-${idx}`,
    product_id: l.product_id,
    product_name: l.product_name || "Subscription Item",
    variant_name: l.variant_name || "Standard",
    description: `${sub.plan_name || "Subscription"} - ${l.product_name || "Item"}`,
    period_start: periodStart,
    period_end: periodEnd,
    quantity: Number(l.quantity) || 1,
    unit_price: Number(l.unit_price) || 0,
    line_subtotal: (Number(l.quantity) || 1) * (Number(l.unit_price) || 0),
    tax_rate_snapshot: 18.00,
    tax_amount: ((Number(l.quantity) || 1) * (Number(l.unit_price) || 0)) * 0.18,
    discount_amount: 0.00,
    line_total: Number(l.line_total) || ((Number(l.quantity) || 1) * (Number(l.unit_price) || 0) * 1.18)
  }));

  // Due date = today + 30 days
  const dueDate = addDays(today, 30);

  const newInvoice = {
    id: invoiceNumber,
    invoice_number: invoiceNumber,
    subscription_id: sub.id,
    subscription_number: sub.subscription_number,
    customer_id: sub.customer_id,
    customer_name: customer ? customer.company || customer.name : "Valued Customer",
    contact_name: customer ? customer.name : "",
    contact_email: customer ? customer.email : "",
    billing_address: customer ? customer.billing_address : "",
    tax_id: "GST-29AABCU9603R1ZM",
    billing_period_start: periodStart,
    billing_period_end: periodEnd,
    invoice_date: today,
    due_date: dueDate,
    currency: "INR",
    subtotal: Number(subtotal.toFixed(2)),
    tax_total: Number(taxTotal.toFixed(2)),
    discount_total: Number(discountTotal.toFixed(2)),
    total_amount: Number(totalAmount.toFixed(2)),
    paid_amount: 0.00,
    outstanding_amount: Number(totalAmount.toFixed(2)),
    status: "confirmed",
    sent_at: new Date().toISOString().replace("T", " ").slice(0, 19),
    notes: notes || `Automated recurring cycle invoice for ${sub.plan_name}`,
    lines
  };

  // Add invoice to store
  invoicesStore.update(list => [newInvoice, ...list]);

  // Advance next billing date on subscription
  const nextBilling = calculateNextBillingDate(periodStart, sub.billing_frequency || "monthly");
  subscriptionsStore.update(list =>
    list.map(s => {
      if (s.id === subscriptionId) {
        return {
          ...s,
          next_billing_date: nextBilling
        };
      }
      return s;
    })
  );

  logSubscriptionEvent(
    sub.id,
    "Active",
    "Active",
    "renewed",
    "Billing Service",
    `Invoice ${invoiceNumber} issued for period ${periodStart} to ${periodEnd}. Next billing rescheduled to ${nextBilling}.`
  );

  // Asynchronously persist to backend PostgreSQL database
  invoicesApi.create({
    subscription_id: sub.id,
    customer_id: sub.customer_id,
    billing_period_start: periodStart,
    billing_period_end: periodEnd,
    due_date: dueDate,
    currency: "INR",
    lines: lines.map(l => ({
      product_id: l.product_id,
      period_start: l.period_start,
      period_end: l.period_end,
      quantity: l.quantity,
      unit_price: l.unit_price,
      tax_rate_snapshot: l.tax_rate_snapshot,
      discount_amount: l.discount_amount
    })),
    notes: newInvoice.notes
  }).then(() => syncInvoicesWithBackend()).catch(err => {
    console.warn("Background backend invoice creation notice:", err.message);
  });

  return newInvoice;
}

// -----------------------------------------------------------------------------
// BATCH INVOICE GENERATION: GENERATE FOR ALL CUSTOMERS
// Generates invoices for all active customer subscriptions and accounts,
// ensuring every customer's billing reflects in the Customer Portal.
// -----------------------------------------------------------------------------
export function generateInvoicesForAllCustomers() {
  let subs = [];
  subscriptionsStore.subscribe(val => { subs = val; })();
  let custs = [];
  customersStore.subscribe(val => { custs = val; })();
  let currentInvoices = [];
  invoicesStore.subscribe(val => { currentInvoices = val; })();

  const today = new Date().toISOString().split("T")[0];
  const generated = [];
  const billedCustomerIds = new Set();

  // 1. Process all active and confirmed subscriptions
  const eligibleSubs = subs.filter(s => s.status === "Active" || s.status === "Confirmed");
  for (const sub of eligibleSubs) {
    try {
      let targetPeriodStart = sub.next_billing_date || today;

      // Check if already billed for this exact cycle start
      const alreadyBilled = currentInvoices.some(
        i => i.subscription_id === sub.id &&
             i.billing_period_start === targetPeriodStart &&
             i.status !== "cancelled"
      );

      // If already billed for that date, compute subsequent cycle start
      if (alreadyBilled) {
        targetPeriodStart = calculateNextBillingDate(targetPeriodStart, sub.billing_frequency);
      }

      const inv = generateInvoiceForSubscription(sub.id, targetPeriodStart);
      generated.push(inv);
      billedCustomerIds.add(sub.customer_id);
    } catch (err) {
      console.log(`Sub ${sub.subscription_number} generation note:`, err.message);
    }
  }

  // 2. Ensure every customer in customersStore has an active billing invoice
  for (const cust of custs) {
    if (!billedCustomerIds.has(cust.id)) {
      const alreadyHasRecent = currentInvoices.some(
        i => i.customer_id === cust.id && i.billing_period_start === today && i.status !== "cancelled"
      );

      if (!alreadyHasRecent) {
        const seq = Math.floor(1000 + Math.random() * 9000);
        const invNum = `INV-2026-${seq}`;
        const newDirectInv = {
          id: invNum,
          invoice_number: invNum,
          subscription_id: null,
          subscription_number: "DIRECT-CONTRACT",
          customer_id: cust.id,
          customer_name: cust.company || cust.name,
          contact_name: cust.name,
          contact_email: cust.email,
          billing_address: cust.billing_address || "Corporate HQ, Bengaluru",
          tax_id: "GST-29AABCU9603R1ZM",
          billing_period_start: today,
          billing_period_end: addDays(today, 30),
          invoice_date: today,
          due_date: addDays(today, 15),
          currency: "INR",
          subtotal: 499.00,
          tax_total: 89.82,
          discount_total: 0.00,
          total_amount: 588.82,
          paid_amount: 0.00,
          outstanding_amount: 588.82,
          status: "confirmed",
          sent_at: new Date().toISOString().replace("T", " ").slice(0, 19),
          notes: "Direct enterprise platform subscription cycle",
          lines: [
            {
              id: `IL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              product_id: "PROD-1001",
              product_name: "Business ERP Suite",
              variant_name: "Standard Edition",
              description: "Business ERP Suite - Standard Core license",
              period_start: today,
              period_end: addDays(today, 30),
              quantity: 1,
              unit_price: 499.00,
              line_subtotal: 499.00,
              tax_rate_snapshot: 18.00,
              tax_amount: 89.82,
              discount_amount: 0.00,
              line_total: 588.82
            }
          ]
        };
        invoicesStore.update(list => [newDirectInv, ...list]);
        generated.push(newDirectInv);
        billedCustomerIds.add(cust.id);
      }
    }
  }

  return { generated, count: generated.length };
}

// -----------------------------------------------------------------------------
// AUTOMATED BILLING TRIGGER:
// 1. If next billing date is near (within threshold days) and unpaid/unbilled: generate invoice automatically.
// 2. If next billing date is past due (<= today): generate invoice automatically.
// 3. Mark existing unpaid invoices past their due date as overdue.
// -----------------------------------------------------------------------------
export function autoGenerateDueAndUpcomingInvoices(daysThreshold = 7) {
  let subs = [];
  subscriptionsStore.subscribe(val => { subs = val; })();
  let allInvoices = [];
  invoicesStore.subscribe(val => { allInvoices = val; })();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const futureLimit = new Date();
  futureLimit.setDate(today.getDate() + daysThreshold);
  const futureLimitStr = futureLimit.toISOString().split("T")[0];

  const generated = [];

  // 1. Auto-update overdue status on unpaid invoices that have passed their due_date
  invoicesStore.update(list => {
    return list.map(inv => {
      if (inv.status !== "cancelled" && Number(inv.outstanding_amount) > 0) {
        if (inv.due_date && inv.due_date < todayStr && inv.status !== "overdue") {
          return { ...inv, status: "overdue" };
        }
      }
      return inv;
    });
  });

  // 2. Auto-generate invoices for subscriptions due or upcoming
  const activeSubs = subs.filter(s => s.status === "Active" || s.status === "Confirmed");
  for (const sub of activeSubs) {
    if (!sub.next_billing_date) continue;

    const isPastDue = sub.next_billing_date <= todayStr;
    const isNearDue = sub.next_billing_date <= futureLimitStr;

    if (isPastDue || isNearDue) {
      const alreadyBilled = allInvoices.some(
        inv => inv.subscription_id === sub.id &&
               inv.billing_period_start === sub.next_billing_date &&
               inv.status !== "cancelled"
      );

      if (!alreadyBilled) {
        try {
          const inv = generateInvoiceForSubscription(sub.id, sub.next_billing_date);
          generated.push(inv);
        } catch (e) {
          console.log(`Auto-billing for ${sub.subscription_number}:`, e.message);
        }
      }
    }
  }

  return generated;
}

if (browser) {
  setTimeout(() => {
    try {
      autoGenerateDueAndUpcomingInvoices(7);
    } catch (e) {
      console.warn("Auto-billing initial check:", e);
    }
  }, 100);
}

// -----------------------------------------------------------------------------
// BUSINESS LOGIC: RECORD PAYMENT
// Enforces:
// 1. Partial payments supported
// 2. Payment cannot exceed outstanding balance
// 3. Updates invoice paid_amount, outstanding_amount, and status
// 4. Appends payment record to payments and transactions
// -----------------------------------------------------------------------------
export function recordPayment({ invoiceId, amount, paymentMethod = "bank_transfer", referenceNumber = "", note = "" }) {
  let inv = null;
  invoicesStore.subscribe(val => {
    inv = val.find(i => i.id === invoiceId);
  })();

  if (!inv) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }

  if (inv.status === "cancelled") {
    throw new Error(`Cannot record payment against a cancelled invoice.`);
  }

  const payAmt = Number(Number(amount).toFixed(2));
  if (isNaN(payAmt) || payAmt <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const currentOutstanding = Number(inv.outstanding_amount);
  if (payAmt > currentOutstanding + 0.001) {
    throw new Error(
      `Payment amount (₹${payAmt.toFixed(2)}) exceeds the invoice outstanding balance (₹${currentOutstanding.toFixed(2)}). Overpayments are not permitted.`
    );
  }

  const newPaidAmount = Number((Number(inv.paid_amount) + payAmt).toFixed(2));
  const newOutstanding = Number(Math.max(0, Number(inv.total_amount) - newPaidAmount).toFixed(2));
  const newStatus = newOutstanding <= 0.001 ? "paid" : "partially_paid";

  // Create payment record
  const seq = Math.floor(1000 + Math.random() * 9000);
  const paymentNumber = `PAY-2026-${seq}`;
  const today = new Date().toISOString().split("T")[0];

  const newPayment = {
    id: paymentNumber,
    payment_number: paymentNumber,
    invoice_id: inv.id,
    invoice_number: inv.invoice_number,
    customer_id: inv.customer_id,
    customer_name: inv.customer_name,
    payment_method: paymentMethod,
    amount: payAmt,
    currency: "INR",
    payment_date: today,
    reference_number: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
    note: note || `Payment of ₹${payAmt.toFixed(2)} recorded against ${inv.invoice_number}`,
    idempotency_key: `IDEMP-${Date.now()}`,
    status: "Settled",
    created_at: new Date().toISOString().replace("T", " ").slice(0, 19)
  };

  // Update invoice
  invoicesStore.update(list =>
    list.map(i => {
      if (i.id === invoiceId) {
        return {
          ...i,
          paid_amount: newPaidAmount,
          outstanding_amount: newOutstanding,
          status: newStatus
        };
      }
      return i;
    })
  );

  // Add payment
  paymentsStore.update(list => [newPayment, ...list]);

  // Asynchronously persist to backend PostgreSQL database
  paymentsApi.record({
    invoice_id: inv.id,
    amount: payAmt,
    payment_method: paymentMethod,
    reference_number: referenceNumber,
    note: note
  }).then(() => syncInvoicesWithBackend()).catch(err => {
    console.warn("Background backend payment recording notice:", err.message);
  });

  return newPayment;
}

// -----------------------------------------------------------------------------
// BUSINESS LOGIC: INVOICE LIFECYCLE ACTIONS
// -----------------------------------------------------------------------------
export function confirmInvoice(invoiceId) {
  invoicesStore.update(list =>
    list.map(i => (i.id === invoiceId && i.status === "draft" ? { ...i, status: "confirmed" } : i))
  );
  invoicesApi.confirm(invoiceId).catch(err => console.warn("Backend confirm notice:", err.message));
  return true;
}

export function cancelInvoice(invoiceId, reason = "Cancelled by administrator") {
  let inv = null;
  invoicesStore.subscribe(val => {
    inv = val.find(i => i.id === invoiceId);
  })();

  if (!inv) throw new Error("Invoice not found");
  if (inv.paid_amount > 0) {
    throw new Error(`Cannot cancel invoice ${inv.invoice_number} because it has recorded payments (₹${inv.paid_amount}). Refund or adjust payments first.`);
  }

  invoicesStore.update(list =>
    list.map(i => {
      if (i.id === invoiceId) {
        return {
          ...i,
          status: "cancelled",
          notes: (i.notes ? i.notes + " | " : "") + `Cancelled: ${reason}`,
          outstanding_amount: 0.00 // Cancelled invoices do not count as outstanding
        };
      }
      return i;
    })
  );
  invoicesApi.cancel(invoiceId, reason).catch(err => console.warn("Backend cancel notice:", err.message));
  return true;
}

export function sendInvoice(invoiceId) {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  invoicesStore.update(list =>
    list.map(i => (i.id === invoiceId ? { ...i, sent_at: now } : i))
  );
  return true;
}
