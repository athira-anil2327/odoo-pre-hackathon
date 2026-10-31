import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import { subscriptionsStore, customersStore, calculateNextBillingDate, addDays, logSubscriptionEvent } from "$lib/stores/coreManagement.js";

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

// Initial Invoices aligned with PostgreSQL schema and initial subscriptions/customers
const initialInvoices = [
  {
    id: "INV-2026-000001",
    invoice_number: "INV-2026-000001",
    subscription_id: "SUB-2026-0001",
    subscription_number: "SUB-2026-0001",
    customer_id: "CUST-1001",
    customer_name: "Nexus Health Systems",
    contact_name: "Dr. Eleanor Vance",
    contact_email: "eleanor.vance@nexushealth.org",
    billing_address: "742 Evergreen Terrace, Springfield, OR",
    tax_id: "GST-29AABCU9603R1ZM",
    billing_period_start: "2026-10-01",
    billing_period_end: "2026-10-31",
    invoice_date: "2026-10-01",
    due_date: "2026-10-31",
    currency: "INR",
    subtotal: 1059.00,
    tax_total: 190.62,
    discount_total: 0.00,
    total_amount: 1249.62,
    paid_amount: 1249.62,
    outstanding_amount: 0.00,
    status: "paid",
    sent_at: "2026-10-01 10:00:00",
    notes: "Monthly billing cycle for Growth Cloud Cloud ERP suite",
    lines: [
      {
        id: "IL-001",
        product_id: "PROD-1001",
        product_name: "Business ERP Suite",
        variant_name: "Odoo Enterprise Edition (+560.00)",
        description: "Business ERP Suite - Odoo Enterprise Edition with CRM & Billing",
        period_start: "2026-10-01",
        period_end: "2026-10-31",
        quantity: 1,
        unit_price: 1059.00,
        line_subtotal: 1059.00,
        tax_rate_snapshot: 18.00,
        tax_amount: 190.62,
        discount_amount: 0.00,
        line_total: 1249.62
      }
    ]
  },
  {
    id: "INV-2026-000002",
    invoice_number: "INV-2026-000002",
    subscription_id: "SUB-2026-0002",
    subscription_number: "SUB-2026-0002",
    customer_id: "CUST-1002",
    customer_name: "Apex Logistics Corp",
    contact_name: "Marcus Brody",
    contact_email: "billing@apexlogistics.com",
    billing_address: "1200 Market Street, Suite 400, Philadelphia, PA",
    tax_id: "GST-27AAACP1234F1ZQ",
    billing_period_start: "2026-09-15",
    billing_period_end: "2026-10-14",
    invoice_date: "2026-09-15",
    due_date: "2026-10-15",
    currency: "INR",
    subtotal: 199.00,
    tax_total: 35.82,
    discount_total: 0.00,
    total_amount: 234.82,
    paid_amount: 100.00,
    outstanding_amount: 134.82,
    status: "partially_paid",
    sent_at: "2026-09-15 11:30:00",
    notes: "Starter Monthly subscription billing term with partial payment recorded",
    lines: [
      {
        id: "IL-002",
        product_id: "PROD-1001",
        product_name: "Business ERP Suite",
        variant_name: "Standard Edition",
        description: "Starter Monthly - Standard Edition suite",
        period_start: "2026-09-15",
        period_end: "2026-10-14",
        quantity: 1,
        unit_price: 199.00,
        line_subtotal: 199.00,
        tax_rate_snapshot: 18.00,
        tax_amount: 35.82,
        discount_amount: 0.00,
        line_total: 234.82
      }
    ]
  },
  {
    id: "INV-2026-000003",
    invoice_number: "INV-2026-000003",
    subscription_id: "SUB-2026-0002",
    subscription_number: "SUB-2026-0002",
    customer_id: "CUST-1002",
    customer_name: "Apex Logistics Corp",
    contact_name: "Marcus Brody",
    contact_email: "billing@apexlogistics.com",
    billing_address: "1200 Market Street, Suite 400, Philadelphia, PA",
    tax_id: "GST-27AAACP1234F1ZQ",
    billing_period_start: "2026-10-15",
    billing_period_end: "2026-11-14",
    invoice_date: "2026-10-15",
    due_date: "2026-10-25", // Deliberately past due for demonstration
    currency: "INR",
    subtotal: 199.00,
    tax_total: 35.82,
    discount_total: 0.00,
    total_amount: 234.82,
    paid_amount: 0.00,
    outstanding_amount: 234.82,
    status: "confirmed",
    sent_at: "2026-10-15 09:00:00",
    notes: "Overdue monthly renewal cycle invoice",
    lines: [
      {
        id: "IL-003",
        product_id: "PROD-1001",
        product_name: "Business ERP Suite",
        variant_name: "Standard Edition",
        description: "Starter Monthly - Standard Edition suite",
        period_start: "2026-10-15",
        period_end: "2026-11-14",
        quantity: 1,
        unit_price: 199.00,
        line_subtotal: 199.00,
        tax_rate_snapshot: 18.00,
        tax_amount: 35.82,
        discount_amount: 0.00,
        line_total: 234.82
      }
    ]
  },
  {
    id: "INV-2026-000004",
    invoice_number: "INV-2026-000004",
    subscription_id: "SUB-2026-0001",
    subscription_number: "SUB-2026-0001",
    customer_id: "CUST-1001",
    customer_name: "Nexus Health Systems",
    contact_name: "Dr. Eleanor Vance",
    contact_email: "eleanor.vance@nexushealth.org",
    billing_address: "742 Evergreen Terrace, Springfield, OR",
    tax_id: "GST-29AABCU9603R1ZM",
    billing_period_start: "2026-09-01",
    billing_period_end: "2026-09-30",
    invoice_date: "2026-09-01",
    due_date: "2026-09-30",
    currency: "INR",
    subtotal: 1059.00,
    tax_total: 190.62,
    discount_total: 0.00,
    total_amount: 1249.62,
    paid_amount: 1249.62,
    outstanding_amount: 0.00,
    status: "paid",
    sent_at: "2026-09-01 10:00:00",
    notes: "Initial deployment cycle",
    lines: [
      {
        id: "IL-004",
        product_id: "PROD-1001",
        product_name: "Business ERP Suite",
        variant_name: "Odoo Enterprise Edition (+560.00)",
        description: "Business ERP Suite - Odoo Enterprise Edition license",
        period_start: "2026-09-01",
        period_end: "2026-09-30",
        quantity: 1,
        unit_price: 1059.00,
        line_subtotal: 1059.00,
        tax_rate_snapshot: 18.00,
        tax_amount: 190.62,
        discount_amount: 0.00,
        line_total: 1249.62
      }
    ]
  }
];

// Initial Payment Records aligned with PostgreSQL schema
const initialPayments = [
  {
    id: "PAY-2026-000001",
    payment_number: "PAY-2026-000001",
    invoice_id: "INV-2026-000001",
    invoice_number: "INV-2026-000001",
    customer_id: "CUST-1001",
    customer_name: "Nexus Health Systems",
    payment_method: "bank_transfer",
    amount: 1249.62,
    currency: "INR",
    payment_date: "2026-10-02",
    reference_number: "NEFT-HDFC-9918231",
    note: "Corporate RTGS/NEFT settlement received",
    idempotency_key: "IDEMP-PAY-0001",
    status: "Settled",
    created_at: "2026-10-02 11:30:00"
  },
  {
    id: "PAY-2026-000002",
    payment_number: "PAY-2026-000002",
    invoice_id: "INV-2026-000002",
    invoice_number: "INV-2026-000002",
    customer_id: "CUST-1002",
    customer_name: "Apex Logistics Corp",
    payment_method: "upi",
    amount: 100.00,
    currency: "INR",
    payment_date: "2026-09-20",
    reference_number: "UPI-ICICI-4820194",
    note: "Partial interim deposit via UPI handle",
    idempotency_key: "IDEMP-PAY-0002",
    status: "Settled",
    created_at: "2026-09-20 16:45:00"
  },
  {
    id: "PAY-2026-000003",
    payment_number: "PAY-2026-000003",
    invoice_id: "INV-2026-000004",
    invoice_number: "INV-2026-000004",
    customer_id: "CUST-1001",
    customer_name: "Nexus Health Systems",
    payment_method: "credit_card",
    amount: 1249.62,
    currency: "INR",
    payment_date: "2026-09-02",
    reference_number: "CC-VISA-4242-AUTH819",
    note: "Direct online auto-charge processed via payment gateway",
    idempotency_key: "IDEMP-PAY-0003",
    status: "Settled",
    created_at: "2026-09-02 09:12:00"
  }
];

export const invoicesStore = writable(loadStore("invoices", initialInvoices));
export const paymentsStore = writable(loadStore("payments", initialPayments));

if (browser) {
  invoicesStore.subscribe(val => persistStore("invoices", val));
  paymentsStore.subscribe(val => persistStore("payments", val));
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

  return newInvoice;
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

  return newPayment;
}

// -----------------------------------------------------------------------------
// BUSINESS LOGIC: INVOICE LIFECYCLE ACTIONS
// -----------------------------------------------------------------------------
export function confirmInvoice(invoiceId) {
  invoicesStore.update(list =>
    list.map(i => (i.id === invoiceId && i.status === "draft" ? { ...i, status: "confirmed" } : i))
  );
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
  return true;
}

export function sendInvoice(invoiceId) {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  invoicesStore.update(list =>
    list.map(i => (i.id === invoiceId ? { ...i, sent_at: now } : i))
  );
  return true;
}
