<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import {
    Download,
    Plus,
    Search,
    Filter,
    Calendar,
    ArrowUpDown,
    MoreHorizontal,
    FileText,
    ArrowLeft,
    CheckCircle2,
    Clock,
    AlertCircle,
    Receipt,
    CreditCard,
    Repeat,
    DollarSign,
    Send,
    Printer,
    Building2,
    Mail,
    X,
    ChevronLeft,
    ChevronRight,
    ExternalLink
  } from "lucide-svelte";

  // Currency Formatter for clean financial display
  function formatINR(val) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(val);
  }

  // --- DATA SOURCES ---
  const initialInvoices = [
    {
      id: "INV-2026-001",
      customer: "Nexus Health Systems",
      contact: "Dr. Eleanor Vance",
      email: "eleanor.vance@nexushealth.org",
      address: "742 Evergreen Terrace, Suite 400, Boston, MA 02115",
      taxId: "GST-29AABCU9603R1ZM",
      subscriptionRef: "SUB-8001 (Growth Cloud Monthly)",
      paymentTerms: "Net 30",
      issueDate: "19 Oct 2026",
      dueDate: "18 Nov 2026",
      amount: 3660.03,
      balance: 0.00,
      paidAmount: 3660.03,
      status: "Paid",
      items: [
        { description: "Brightloop Platform Core (Dedicated Cloud Cluster)", quantity: 2, unitPrice: 1699.00, discount: 369.70, tax: 305.82, total: 3334.12 },
        { description: "Enterprise Compliance & Audit Vault", quantity: 1, unitPrice: 299.00, discount: 0.00, tax: 26.91, total: 325.91 }
      ],
      payments: [
        { id: "TXN-8492049", date: "20 Oct 2026", method: "Bank Wire (NEFT)", amount: 3660.03, status: "Settled" }
      ]
    },
    {
      id: "INV-2026-002",
      customer: "CloudScale Analytics Inc.",
      contact: "Marcus Brody",
      email: "mbrody@cloudscale.io",
      address: "100 Tech Highway, 12th Floor, San Francisco, CA 94105",
      taxId: "GST-27AAACP1234F1ZQ",
      subscriptionRef: "SUB-8002 (Enterprise Annual)",
      paymentTerms: "Net 15",
      issueDate: "15 Feb 2026",
      dueDate: "02 Mar 2026",
      amount: 10642.50,
      balance: 0.00,
      paidAmount: 10642.50,
      status: "Paid",
      items: [
        { description: "Brightloop Platform Core Multi-Region HA (Annual)", quantity: 1, unitPrice: 9900.00, discount: 0.00, tax: 742.50, total: 10642.50 }
      ],
      payments: [
        { id: "TXN-9918237", date: "16 Feb 2026", method: "Corporate Credit Card", amount: 10642.50, status: "Settled" }
      ]
    },
    {
      id: "INV-2026-003",
      customer: "Apex Retail Solutions",
      contact: "Sarah Jenkins",
      email: "s.jenkins@apexretail.com",
      address: "245 Market St, Austin, TX 78701",
      taxId: "GST-06AABCA5678B1ZT",
      subscriptionRef: "SUB-8003 (Growth Cloud Monthly)",
      paymentTerms: "Due Upon Receipt",
      issueDate: "01 Oct 2026",
      dueDate: "15 Oct 2026",
      amount: 857.85,
      balance: 457.85,
      paidAmount: 400.00,
      status: "Partially Paid",
      items: [
        { description: "Brightloop Core Platform - Monthly Retainer", quantity: 1, unitPrice: 499.00, discount: 0.00, tax: 37.42, total: 536.42 },
        { description: "Real-Time Telemetry & Insights Stream", quantity: 1, unitPrice: 299.00, discount: 0.00, tax: 22.43, total: 321.43 }
      ],
      payments: [
        { id: "TXN-8821901", date: "10 Oct 2026", method: "UPI Instant Transfer", amount: 400.00, status: "Settled" }
      ]
    },
    {
      id: "INV-2026-004",
      customer: "FinGuard Global Security",
      contact: "Derrick Vance",
      email: "dvance@finguard.com",
      address: "14 Canary Wharf, London, E14 5AB, UK",
      taxId: "GB-992014811",
      subscriptionRef: "SUB-8004 (Engineering Support Weekly)",
      paymentTerms: "Net 30",
      issueDate: "15 Sep 2026",
      dueDate: "15 Oct 2026",
      amount: 1540.00,
      balance: 1540.00,
      paidAmount: 0.00,
      status: "Overdue",
      items: [
        { description: "Dedicated 24/7 Architecture Sprint (4 Sprints)", quantity: 4, unitPrice: 350.00, discount: 0.00, tax: 140.00, total: 1540.00 }
      ],
      payments: []
    },
    {
      id: "INV-2026-005",
      customer: "Apex Retail Solutions",
      contact: "Sarah Jenkins",
      email: "s.jenkins@apexretail.com",
      address: "245 Market St, Austin, TX 78701",
      taxId: "GST-06AABCA5678B1ZT",
      subscriptionRef: "SUB-8003 (Growth Cloud Monthly)",
      paymentTerms: "Net 15",
      issueDate: "25 Oct 2026",
      dueDate: "09 Nov 2026",
      amount: 482.68,
      balance: 482.68,
      paidAmount: 0.00,
      status: "Confirmed",
      items: [
        { description: "Brightloop Core Addon Seat Expansion", quantity: 1, unitPrice: 499.00, discount: 50.00, tax: 33.68, total: 482.68 }
      ],
      payments: []
    },
    {
      id: "INV-2026-006",
      customer: "Orbit Dynamics Corp",
      contact: "Elena Rostova",
      email: "e.rostova@orbitdynamics.aero",
      address: "500 Aerospace Blvd, Seattle, WA 98108",
      taxId: "US-338291048",
      subscriptionRef: "SUB-8005 (Aerospace Fleet License)",
      paymentTerms: "Net 30",
      issueDate: "28 Oct 2026",
      dueDate: "28 Nov 2026",
      amount: 1267.00,
      balance: 1267.00,
      paidAmount: 0.00,
      status: "Sent",
      items: [
        { description: "Brightloop High-Throughput Burst Simulation", quantity: 1, unitPrice: 1150.00, discount: 0.00, tax: 117.00, total: 1267.00 }
      ],
      payments: []
    },
    {
      id: "INV-2026-007",
      customer: "Beacon Logistics Hub",
      contact: "Tariq Al-Mansoor",
      email: "tariq@beaconlogistics.net",
      address: "880 Port Way, Long Beach, CA 90802",
      taxId: "US-661928371",
      subscriptionRef: "Direct Contract",
      paymentTerms: "Net 30",
      issueDate: "29 Oct 2026",
      dueDate: "29 Nov 2026",
      amount: 500.00,
      balance: 500.00,
      paidAmount: 0.00,
      status: "Draft",
      items: [
        { description: "Platform API Integrations & Webhook Setup", quantity: 1, unitPrice: 500.00, discount: 0.00, tax: 0.00, total: 500.00 }
      ],
      payments: []
    }
  ];

  // Secondary Tab Collections
  const paymentRecords = [
    { id: "PAY-2026-901", invoiceId: "INV-2026-001", customer: "Nexus Health Systems", method: "Bank Wire (NEFT)", date: "20 Oct 2026", amount: 3660.03, status: "Settled" },
    { id: "PAY-2026-902", invoiceId: "INV-2026-002", customer: "CloudScale Analytics Inc.", method: "Credit Card (Stripe)", date: "16 Feb 2026", amount: 10642.50, status: "Settled" },
    { id: "PAY-2026-903", invoiceId: "INV-2026-003", customer: "Apex Retail Solutions", method: "UPI Transfer", date: "10 Oct 2026", amount: 400.00, status: "Settled" }
  ];

  const recurringSchedules = [
    { scheduleId: "REC-101", customer: "Nexus Health Systems", plan: "Growth Cloud Monthly", interval: "Monthly", nextRun: "19 Nov 2026", amount: 3660.03, autoBill: "Enabled" },
    { scheduleId: "REC-102", customer: "CloudScale Analytics Inc.", plan: "Enterprise Annual", interval: "Yearly", nextRun: "15 Feb 2027", amount: 10642.50, autoBill: "Enabled" },
    { scheduleId: "REC-103", customer: "Apex Retail Solutions", plan: "Growth Cloud Monthly", interval: "Monthly", nextRun: "01 Nov 2026", amount: 857.85, autoBill: "Enabled" },
    { scheduleId: "REC-104", customer: "FinGuard Global Security", plan: "Engineering Support Weekly", interval: "Weekly", nextRun: "03 Nov 2026", amount: 350.00, autoBill: "Paused" }
  ];

  const gatewayTransactions = [
    { ref: "TXN-8492049", gateway: "ICICI / HDFC Corporate Treasury", method: "Bank Wire", status: "Success", timestamp: "2026-10-20 14:22", fee: 0.00 },
    { ref: "TXN-9918237", gateway: "Stripe Enterprise", method: "Visa Infinite 4242", status: "Success", timestamp: "2026-02-16 09:15", fee: 212.85 },
    { ref: "TXN-8821901", gateway: "NPCI / Razorpay UPI", method: "UPI VPA (apex@okhdfc)", status: "Success", timestamp: "2026-10-10 17:40", fee: 0.00 }
  ];

  // --- STATE ---
  let activeTab = $state("all"); // 'all' | 'payments' | 'recurring' | 'transactions'
  let selectedInvoice = $state(null); // When an invoice is clicked, opens dedicated view
  let openDropdownId = $state(null); // Three-dot dropdown state
  let isGenerateModalOpen = $state(false);

  // Filters State
  let searchQuery = $state("");
  let statusFilter = $state("All");
  let dateRangeFilter = $state("All Time");
  let paymentStatusFilter = $state("All");
  let sortBy = $state("latest"); // 'latest' | 'earliest' | 'amount-high' | 'amount-low'

  // Standardized Status Badges (Section 3)
  const statusStyles = {
    Draft: "bg-[#4a5568] text-white border-transparent",
    Confirmed: "bg-[#183f42] text-white border-transparent",
    Sent: "bg-[#2f855a] text-white border-transparent",
    "Partially Paid": "bg-amber-100 text-amber-900 border-amber-300",
    Paid: "bg-[#2f855a] text-white border-transparent",
    Overdue: "bg-[#c53030] text-white border-transparent",
    Cancelled: "bg-zinc-100 text-zinc-500 border-zinc-200"
  };

  // Filtered & Sorted Invoices
  const filteredInvoices = $derived.by(() => {
    return initialInvoices
      .filter(inv => {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          q === "" ||
          inv.id.toLowerCase().includes(q) ||
          inv.customer.toLowerCase().includes(q) ||
          inv.contact.toLowerCase().includes(q);

        const matchesStatus =
          statusFilter === "All" || inv.status === statusFilter;

        const matchesPayment =
          paymentStatusFilter === "All" ||
          (paymentStatusFilter === "Fully Paid" && inv.balance === 0) ||
          (paymentStatusFilter === "Unpaid" && inv.paidAmount === 0) ||
          (paymentStatusFilter === "Partial" && inv.paidAmount > 0 && inv.balance > 0);

        return matchesQuery && matchesStatus && matchesPayment;
      })
      .sort((a, b) => {
        if (sortBy === "amount-high") return b.amount - a.amount;
        if (sortBy === "amount-low") return a.amount - b.amount;
        return 0;
      });
  });

  function handleOpenDetails(inv) {
    selectedInvoice = inv;
    openDropdownId = null;
  }

  function handleBackToList() {
    selectedInvoice = null;
  }

  function toggleDropdown(id, e) {
    e.stopPropagation();
    openDropdownId = openDropdownId === id ? null : id;
  }

  function closeDropdown() {
    openDropdownId = null;
  }

  function handlePrintInvoice() {
    window.print();
  }
</script>

<svelte:window onclick={closeDropdown} />

<AppShell title="Invoices & Billing">
  <!-- DEDICATED INVOICE DETAILS EXPERIENCE (Section 4) -->
  {#if selectedInvoice}
    <div class="space-y-6 max-w-5xl mx-auto">
      <!-- Breadcrumb & Back Link -->
      <div class="flex items-center justify-between">
        <button
          onclick={handleBackToList}
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#717786] hover:text-[#183f42] transition-colors"
        >
          <ArrowLeft class="w-3.5 h-3.5" /> Back to all invoices
        </button>

        <div class="text-xs text-[#717786]">
          Billing / Invoices / <span class="font-semibold text-[#171923]">{selectedInvoice.id}</span>
        </div>
      </div>

      <!-- Detail Header Card -->
      <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl">
        <Card.Content class="p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-3">
                <h2 class="text-xl font-bold text-[#171923] tracking-tight">{selectedInvoice.id}</h2>
                <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyles[selectedInvoice.status] || 'bg-zinc-100 text-zinc-700'}`}>
                  {selectedInvoice.status}
                </span>
              </div>
              <p class="text-xs text-[#717786]">
                Issued to <span class="font-semibold text-[#171923]">{selectedInvoice.customer}</span> on {selectedInvoice.issueDate}
              </p>
            </div>

            <!-- Header Action Buttons -->
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onclick={handlePrintInvoice}
                class="text-xs border-[#E5E7EB] text-[#171923] hover:bg-[#F8F9FC] h-8 gap-1.5"
              >
                <Printer class="w-3.5 h-3.5 text-[#717786]" /> Download PDF
              </Button>
              <Button
                variant="outline"
                size="xs"
                class="text-xs border-[#E5E7EB] text-[#171923] hover:bg-[#F8F9FC] h-8 gap-1.5"
              >
                <Send class="w-3.5 h-3.5 text-[#717786]" /> Send Invoice
              </Button>
              {#if selectedInvoice.balance > 0}
                <Button
                  size="xs"
                  class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold h-8 gap-1.5 shadow-xs"
                >
                  <DollarSign class="w-3.5 h-3.5" /> Record Payment
                </Button>
              {/if}
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Financial Summary Cards (Section 4) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl p-5">
          <div class="text-xs font-medium text-[#717786]">Invoice Total</div>
          <div class="text-2xl font-bold text-[#171923] mt-1">{formatINR(selectedInvoice.amount)}</div>
          <div class="text-[11px] text-[#717786] mt-0.5">Gross billable sum</div>
        </Card.Root>

        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl p-5">
          <div class="text-xs font-medium text-[#717786]">Amount Paid</div>
          <div class="text-2xl font-bold text-[#16A34A] mt-1">{formatINR(selectedInvoice.paidAmount)}</div>
          <div class="text-[11px] text-[#717786] mt-0.5">Cleared settlements</div>
        </Card.Root>

        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl p-5">
          <div class="text-xs font-medium text-[#717786]">Outstanding Balance</div>
          <div class={`text-2xl font-bold mt-1 ${selectedInvoice.balance > 0 ? 'text-[#DC2626]' : 'text-[#717786]'}`}>
            {formatINR(selectedInvoice.balance)}
          </div>
          <div class="text-[11px] text-[#717786] mt-0.5">Due by {selectedInvoice.dueDate}</div>
        </Card.Root>
      </div>

      <!-- Invoice Information Details Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl">
          <Card.Header class="pb-3 border-b border-[#E5E7EB]">
            <Card.Title class="text-xs font-bold text-[#171923] uppercase tracking-wider flex items-center gap-2">
              <Building2 class="w-3.5 h-3.5 text-[#717786]" /> Customer Details
            </Card.Title>
          </Card.Header>
          <Card.Content class="p-5 space-y-3 text-xs">
            <div>
              <div class="font-bold text-[#171923] text-sm">{selectedInvoice.customer}</div>
              <div class="text-[#717786] mt-0.5">Attn: {selectedInvoice.contact}</div>
            </div>
            <div>
              <div class="text-[#717786]">Email Address</div>
              <div class="text-[#171923] font-medium">{selectedInvoice.email}</div>
            </div>
            <div>
              <div class="text-[#717786]">Billing Address</div>
              <div class="text-[#171923]">{selectedInvoice.address}</div>
            </div>
            <div>
              <div class="text-[#717786]">Tax ID / GSTIN</div>
              <div class="text-[#171923] font-mono">{selectedInvoice.taxId}</div>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl">
          <Card.Header class="pb-3 border-b border-[#E5E7EB]">
            <Card.Title class="text-xs font-bold text-[#171923] uppercase tracking-wider flex items-center gap-2">
              <Clock class="w-3.5 h-3.5 text-[#717786]" /> Terms & References
            </Card.Title>
          </Card.Header>
          <Card.Content class="p-5 space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-[#717786]">Issue Date</div>
                <div class="text-[#171923] font-semibold">{selectedInvoice.issueDate}</div>
              </div>
              <div>
                <div class="text-[#717786]">Due Date</div>
                <div class="text-[#171923] font-semibold">{selectedInvoice.dueDate}</div>
              </div>
            </div>
            <div>
              <div class="text-[#717786]">Payment Terms</div>
              <div class="text-[#171923] font-medium">{selectedInvoice.paymentTerms}</div>
            </div>
            <div>
              <div class="text-[#717786]">Subscription Reference</div>
              <div class="text-[#183f42] font-medium hover:underline cursor-pointer">
                {selectedInvoice.subscriptionRef}
              </div>
            </div>
            <div>
              <div class="text-[#717786]">Invoice Status</div>
              <div class="mt-1">
                <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyles[selectedInvoice.status] || 'bg-zinc-100 text-zinc-700'}`}>
                  {selectedInvoice.status}
                </span>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </div>

      <!-- Invoice Breakdown Table (Section 4) -->
      <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl overflow-hidden">
        <Card.Header class="pb-3 border-b border-[#E5E7EB]">
          <Card.Title class="text-xs font-bold text-[#171923] uppercase tracking-wider">
            Invoice Breakdown
          </Card.Title>
        </Card.Header>
        <Card.Content class="p-0">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-[#F8F9FC] border-b border-[#E5E7EB] text-[#717786] font-semibold text-[11px]">
              <tr>
                <th class="py-2.5 px-5">Description</th>
                <th class="py-2.5 px-4 text-center">Qty</th>
                <th class="py-2.5 px-4 text-right">Unit Price</th>
                <th class="py-2.5 px-4 text-right">Discount</th>
                <th class="py-2.5 px-4 text-right">Tax</th>
                <th class="py-2.5 px-5 text-right">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E5E7EB]">
              {#each selectedInvoice.items as item}
                <tr class="hover:bg-[#F8F9FC]">
                  <td class="py-3 px-5 font-medium text-[#171923]">{item.description}</td>
                  <td class="py-3 px-4 text-center text-[#717786]">{item.quantity}</td>
                  <td class="py-3 px-4 text-right text-[#717786]">{formatINR(item.unitPrice)}</td>
                  <td class="py-3 px-4 text-right text-[#717786]">
                    {item.discount > 0 ? `-${formatINR(item.discount)}` : "—"}
                  </td>
                  <td class="py-3 px-4 text-right text-[#717786]">{formatINR(item.tax)}</td>
                  <td class="py-3 px-5 text-right font-bold text-[#171923]">{formatINR(item.total)}</td>
                </tr>
              {/each}
            </tbody>
          </table>

          <!-- Subtotals Summary Box -->
          <div class="p-5 bg-[#F8F9FC] border-t border-[#E5E7EB] flex justify-end">
            <div class="w-64 space-y-1.5 text-xs">
              <div class="flex justify-between text-[#717786]">
                <span>Total Amount:</span>
                <span class="font-bold text-[#171923] text-sm">{formatINR(selectedInvoice.amount)}</span>
              </div>
              <div class="flex justify-between text-[#16A34A]">
                <span>Amount Paid:</span>
                <span class="font-semibold">{formatINR(selectedInvoice.paidAmount)}</span>
              </div>
              <div class="flex justify-between pt-1 border-t border-[#E5E7EB] font-bold">
                <span class={selectedInvoice.balance > 0 ? 'text-[#DC2626]' : 'text-[#171923]'}>Balance Due:</span>
                <span class={selectedInvoice.balance > 0 ? 'text-[#DC2626]' : 'text-[#171923]'}>
                  {formatINR(selectedInvoice.balance)}
                </span>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Payment History (Section 4) -->
      <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl overflow-hidden">
        <Card.Header class="pb-3 border-b border-[#E5E7EB]">
          <Card.Title class="text-xs font-bold text-[#171923] uppercase tracking-wider flex items-center gap-2">
            <CreditCard class="w-3.5 h-3.5 text-[#717786]" /> Payment History
          </Card.Title>
        </Card.Header>
        <Card.Content class="p-0">
          {#if selectedInvoice.payments.length === 0}
            <div class="p-6 text-center text-xs text-[#717786]">
              No payments have been recorded for this invoice yet.
            </div>
          {:else}
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-[#F8F9FC] border-b border-[#E5E7EB] text-[#717786] font-semibold text-[11px]">
                <tr>
                  <th class="py-2.5 px-5">Transaction ID</th>
                  <th class="py-2.5 px-4">Payment Date</th>
                  <th class="py-2.5 px-4">Payment Method</th>
                  <th class="py-2.5 px-4 text-right">Amount</th>
                  <th class="py-2.5 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E5E7EB]">
                {#each selectedInvoice.payments as pay}
                  <tr class="hover:bg-[#F8F9FC]">
                    <td class="py-3 px-5 font-mono font-medium text-[#171923]">{pay.id}</td>
                    <td class="py-3 px-4 text-[#717786]">{pay.date}</td>
                    <td class="py-3 px-4 text-[#171923]">{pay.method}</td>
                    <td class="py-3 px-4 text-right font-bold text-[#16A34A]">{formatINR(pay.amount)}</td>
                    <td class="py-3 px-5 text-center">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>

  <!-- MAIN INVOICES & BILLING LISTING VIEW -->
  {:else}
    <div class="space-y-6">
      <!-- 1. PAGE HEADER (Section 1A) -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 class="text-[22px] font-bold text-[#171923] tracking-tight">Invoices & Billing</h1>
          <p class="text-xs text-[#717786] mt-0.5">
            Manage invoices, track payments and monitor outstanding receivables.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="xs"
            class="text-xs border-[#E5E7EB] bg-white hover:bg-[#F8F9FC] text-[#171923] font-medium h-8 px-3 rounded-lg gap-1.5 shadow-2xs"
          >
            <Download class="w-3.5 h-3.5 text-[#717786]" /> Export
          </Button>

          <Button
            variant="default"
            size="xs"
            onclick={() => (isGenerateModalOpen = true)}
            class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold h-8 px-3.5 rounded-lg gap-1.5 shadow-xs"
          >
            <Plus class="w-3.5 h-3.5" /> Generate Invoice
          </Button>
        </div>
      </div>

      <!-- 2. FINANCIAL SUMMARY CARDS matching theme.jpeg -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Invoiced -->
        <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-start mb-3">
            <Receipt class="w-4 h-4 text-white" />
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">₹18,450.00</div>
            <div class="text-xs font-medium text-teal-100/90 mt-1">Total Invoiced</div>
            <div class="text-[11px] text-teal-200/80 mt-1">+12.5% vs last month</div>
          </div>
        </div>

        <!-- Collected -->
        <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-start mb-3">
            <CheckCircle2 class="w-4 h-4 text-white" />
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">₹14,702.50</div>
            <div class="text-xs font-medium text-teal-100/90 mt-1">Collected</div>
            <div class="text-[11px] text-teal-200/80 mt-1">+8.2% vs last month</div>
          </div>
        </div>

        <!-- Outstanding -->
        <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-start mb-3">
            <Clock class="w-4 h-4 text-white" />
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">₹3,747.50</div>
            <div class="text-xs font-medium text-teal-100/90 mt-1">Outstanding</div>
            <div class="text-[11px] text-teal-200/80 mt-1">4 invoices pending</div>
          </div>
        </div>

        <!-- Overdue -->
        <div class="bg-[#183f42] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 self-start mb-3">
            <AlertCircle class="w-4 h-4 text-white" />
          </div>
          <div>
            <div class="text-xl sm:text-2xl font-bold tracking-tight text-white">₹1,540.00</div>
            <div class="text-xs font-medium text-teal-100/90 mt-1">Overdue</div>
            <div class="text-[11px] text-teal-200/80 mt-1">1 invoice requires attention</div>
          </div>
        </div>
      </div>

      <!-- 3. NAVIGATION TABS (Section 5 & 6) -->
      <div class="flex items-center gap-1 border-b border-[#E5E7EB]">
        <button
          onclick={() => (activeTab = "all")}
          class={`px-3.5 py-2 text-xs font-semibold transition-all relative ${
            activeTab === 'all'
              ? 'text-[#183f42]'
              : 'text-[#717786] hover:text-[#171923]'
          }`}
        >
          All Invoices
          {#if activeTab === 'all'}
            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#183f42]"></div>
          {/if}
        </button>

        <button
          onclick={() => (activeTab = "payments")}
          class={`px-3.5 py-2 text-xs font-semibold transition-all relative ${
            activeTab === 'payments'
              ? 'text-[#183f42]'
              : 'text-[#717786] hover:text-[#171923]'
          }`}
        >
          Payments ({paymentRecords.length})
          {#if activeTab === 'payments'}
            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#183f42]"></div>
          {/if}
        </button>

        <button
          onclick={() => (activeTab = "recurring")}
          class={`px-3.5 py-2 text-xs font-semibold transition-all relative ${
            activeTab === 'recurring'
              ? 'text-[#183f42]'
              : 'text-[#717786] hover:text-[#171923]'
          }`}
        >
          Recurring Billing
          {#if activeTab === 'recurring'}
            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#183f42]"></div>
          {/if}
        </button>

        <button
          onclick={() => (activeTab = "transactions")}
          class={`px-3.5 py-2 text-xs font-semibold transition-all relative ${
            activeTab === 'transactions'
              ? 'text-[#183f42]'
              : 'text-[#717786] hover:text-[#171923]'
          }`}
        >
          Transactions
          {#if activeTab === 'transactions'}
            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#183f42]"></div>
          {/if}
        </button>
      </div>

      <!-- TAB 1: ALL INVOICES (Main Experience) -->
      {#if activeTab === "all"}
        <!-- 4. SEARCH AND FILTERS (Section 1D) -->
        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl">
          <Card.Content class="p-3">
            <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
              <!-- Search Control -->
              <div class="relative w-full sm:w-64">
                <Search class="w-3.5 h-3.5 text-[#717786] absolute left-2.5 top-2.5" />
                <Input
                  type="text"
                  placeholder="Search by invoice or customer..."
                  bind:value={searchQuery}
                  class="h-8 pl-8 pr-3 text-xs bg-[#F8F9FC] border-[#E5E7EB] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-lg text-[#171923]"
                />
              </div>

              <!-- Compact Filter Selects -->
              <div class="flex flex-wrap items-center gap-2">
                <!-- Status Filter -->
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] text-[#717786]">Status:</span>
                  <select
                    bind:value={statusFilter}
                    class="h-8 text-xs bg-white border border-[#E5E7EB] rounded-lg px-2.5 text-[#171923] font-medium outline-none focus:border-[#183f42]"
                  >
                    <option value="All">All</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Sent">Sent</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                <!-- Date Range -->
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] text-[#717786]">Date:</span>
                  <select
                    bind:value={dateRangeFilter}
                    class="h-8 text-xs bg-white border border-[#E5E7EB] rounded-lg px-2.5 text-[#171923] font-medium outline-none focus:border-[#183f42]"
                  >
                    <option value="All Time">All Time</option>
                    <option value="This Month">This Month</option>
                    <option value="Last Month">Last Month</option>
                    <option value="This Quarter">This Quarter</option>
                  </select>
                </div>

                <!-- Payment Status -->
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] text-[#717786]">Payment:</span>
                  <select
                    bind:value={paymentStatusFilter}
                    class="h-8 text-xs bg-white border border-[#E5E7EB] rounded-lg px-2.5 text-[#171923] font-medium outline-none focus:border-[#183f42]"
                  >
                    <option value="All">All</option>
                    <option value="Fully Paid">Fully Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>

                <!-- Sort By -->
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] text-[#717786]">Sort:</span>
                  <select
                    bind:value={sortBy}
                    class="h-8 text-xs bg-white border border-[#E5E7EB] rounded-lg px-2.5 text-[#171923] font-medium outline-none focus:border-[#183f42]"
                  >
                    <option value="latest">Latest First</option>
                    <option value="amount-high">Amount (High to Low)</option>
                    <option value="amount-low">Amount (Low to High)</option>
                  </select>
                </div>
              </div>
            </div>
          </Card.Content>
        </Card.Root>

        <!-- 5. INVOICE TABLE (Section 1C) -->
        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl overflow-hidden">
          <Card.Content class="p-0">
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left border-collapse">
                <thead class="bg-[#F8F9FC] border-b border-[#E5E7EB] text-[#717786] font-semibold text-[11px]">
                  <tr>
                    <th class="py-3 px-5">Invoice</th>
                    <th class="py-3 px-4">Customer</th>
                    <th class="py-3 px-4">Issue Date</th>
                    <th class="py-3 px-4">Due Date</th>
                    <th class="py-3 px-4 text-right">Amount</th>
                    <th class="py-3 px-4 text-right">Balance</th>
                    <th class="py-3 px-4 text-center">Status</th>
                    <th class="py-3 px-4 text-right w-12"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E5E7EB]">
                  {#if filteredInvoices.length === 0}
                    <tr>
                      <td colspan="8" class="py-8 text-center text-[#717786]">
                        No invoices match the selected filter criteria.
                      </td>
                    </tr>
                  {:else}
                    {#each filteredInvoices as inv}
                      <tr class="hover:bg-[#F8F9FC] transition-colors group">
                        <!-- Clickable Invoice Number -->
                        <td class="py-3.5 px-5">
                          <button
                            onclick={() => handleOpenDetails(inv)}
                            class="font-semibold text-[#171923] group-hover:text-[#183f42] transition-colors inline-flex items-center gap-1 text-left"
                            title="View Invoice Details"
                          >
                            <span>{inv.id}</span>
                          </button>
                        </td>

                        <!-- Customer Details -->
                        <td class="py-3.5 px-4">
                          <div class="font-medium text-[#171923]">{inv.customer}</div>
                          <div class="text-[11px] text-[#717786]">{inv.contact}</div>
                        </td>

                        <!-- Issue Date -->
                        <td class="py-3.5 px-4 text-[#717786]">{inv.issueDate}</td>

                        <!-- Due Date -->
                        <td class="py-3.5 px-4 text-[#717786]">{inv.dueDate}</td>

                        <!-- Amount (Right-aligned, Consistent Formatting) -->
                        <td class="py-3.5 px-4 text-right font-bold text-[#171923]">
                          {formatINR(inv.amount)}
                        </td>

                        <!-- Balance (Right-aligned) -->
                        <td class={`py-3.5 px-4 text-right font-semibold ${inv.balance > 0 ? (inv.status === 'Overdue' ? 'text-[#DC2626]' : 'text-[#D97706]') : 'text-[#717786]'}`}>
                          {formatINR(inv.balance)}
                        </td>

                        <!-- Standardized Status Badge (Section 3) -->
                        <td class="py-3.5 px-4 text-center">
                          <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyles[inv.status] || 'bg-zinc-100 text-zinc-700'}`}>
                            {inv.status}
                          </span>
                        </td>

                        <!-- Actions inside Three-Dot Dropdown (Section 1C) -->
                        <td class="py-3.5 px-4 text-right relative">
                          <button
                            onclick={(e) => toggleDropdown(inv.id, e)}
                            class="h-7 w-7 rounded-md flex items-center justify-center text-[#717786] hover:text-[#171923] hover:bg-zinc-100 transition-colors ml-auto"
                            title="More actions"
                          >
                            <MoreHorizontal class="w-4 h-4" />
                          </button>

                          <!-- Dropdown Menu -->
                          {#if openDropdownId === inv.id}
                            <div
                              class="absolute right-4 top-10 w-44 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 py-1 text-left text-xs"
                              role="menu"
                              tabindex="-1"
                              onclick={(e) => e.stopPropagation()}
                              onkeydown={(e) => { if (e.key === 'Escape') openDropdownId = null; }}
                            >
                              <button
                                onclick={() => handleOpenDetails(inv)}
                                class="w-full px-3 py-1.5 text-left text-[#171923] hover:bg-[#F8F9FC] flex items-center gap-2"
                              >
                                <FileText class="w-3.5 h-3.5 text-[#717786]" /> View Details
                              </button>
                              <button
                                onclick={handlePrintInvoice}
                                class="w-full px-3 py-1.5 text-left text-[#171923] hover:bg-[#F8F9FC] flex items-center gap-2"
                              >
                                <Download class="w-3.5 h-3.5 text-[#717786]" /> Download PDF
                              </button>
                              <button
                                onclick={() => { openDropdownId = null; }}
                                class="w-full px-3 py-1.5 text-left text-[#171923] hover:bg-[#F8F9FC] flex items-center gap-2"
                              >
                                <Send class="w-3.5 h-3.5 text-[#717786]" /> Send Invoice
                              </button>
                              {#if inv.balance > 0}
                                <button
                                  onclick={() => { handleOpenDetails(inv); }}
                                  class="w-full px-3 py-1.5 text-left text-[#183f42] hover:bg-[#e6f4f2] flex items-center gap-2 font-medium"
                                >
                                  <DollarSign class="w-3.5 h-3.5 text-[#183f42]" /> Record Payment
                                </button>
                              {/if}
                            </div>
                          {/if}
                        </td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
              </table>
            </div>

            <!-- 6. PAGINATION (Section 1E) -->
            <div class="p-4 border-t border-[#E5E7EB] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#717786]">
              <div class="flex items-center gap-2">
                <span>Showing <strong class="text-[#171923]">1–{filteredInvoices.length}</strong> of <strong class="text-[#171923]">120</strong> invoices</span>
                <span class="text-zinc-300">•</span>
                <div class="flex items-center gap-1">
                  <span>Rows per page:</span>
                  <select class="h-6 text-xs bg-white border border-[#E5E7EB] rounded px-1.5 text-[#171923]">
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>

              <div class="flex items-center gap-1.5">
                <Button variant="outline" size="xs" class="h-7 px-2.5 text-xs border-[#E5E7EB] text-[#717786] gap-1 hover:bg-[#F8F9FC]">
                  <ChevronLeft class="w-3.5 h-3.5" /> Previous
                </Button>
                <Button variant="outline" size="xs" class="h-7 px-2.5 text-xs border-[#E5E7EB] text-[#171923] font-semibold bg-[#F8F9FC]">
                  1
                </Button>
                <Button variant="ghost" size="xs" class="h-7 px-2.5 text-xs text-[#717786]">
                  2
                </Button>
                <Button variant="ghost" size="xs" class="h-7 px-2.5 text-xs text-[#717786]">
                  3
                </Button>
                <Button variant="outline" size="xs" class="h-7 px-2.5 text-xs border-[#E5E7EB] text-[#717786] gap-1 hover:bg-[#F8F9FC]">
                  Next <ChevronRight class="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card.Root>

      <!-- TAB 2: PAYMENTS (Reconciled Transactions) -->
      {:else if activeTab === "payments"}
        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl overflow-hidden">
          <Card.Header class="pb-3 border-b border-[#E5E7EB] flex flex-row items-center justify-between">
            <div>
              <Card.Title class="text-xs font-bold text-[#171923] uppercase tracking-wider">
                Reconciled Payment Records
              </Card.Title>
              <Card.Description class="text-xs text-[#717786]">
                Verified inbound settlements across banking rails and credit card gateways.
              </Card.Description>
            </div>
            <Button variant="outline" size="xs" class="text-xs border-[#E5E7EB] gap-1">
              <Download class="w-3.5 h-3.5 text-[#717786]" /> Export Records
            </Button>
          </Card.Header>
          <Card.Content class="p-0">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-[#F8F9FC] border-b border-[#E5E7EB] text-[#717786] font-semibold text-[11px]">
                <tr>
                  <th class="py-3 px-5">Payment Ref</th>
                  <th class="py-3 px-4">Invoice #</th>
                  <th class="py-3 px-4">Customer</th>
                  <th class="py-3 px-4">Payment Method</th>
                  <th class="py-3 px-4">Payment Date</th>
                  <th class="py-3 px-4 text-right">Amount</th>
                  <th class="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E5E7EB]">
                {#each paymentRecords as p}
                  <tr class="hover:bg-[#F8F9FC]">
                    <td class="py-3.5 px-5 font-mono font-medium text-[#171923]">{p.id}</td>
                    <td class="py-3.5 px-4 font-semibold text-[#171923]">{p.invoiceId}</td>
                    <td class="py-3.5 px-4 text-[#171923]">{p.customer}</td>
                    <td class="py-3.5 px-4 text-[#717786]">{p.method}</td>
                    <td class="py-3.5 px-4 text-[#717786]">{p.date}</td>
                    <td class="py-3.5 px-4 text-right font-bold text-[#16A34A]">{formatINR(p.amount)}</td>
                    <td class="py-3.5 px-5 text-center">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </Card.Content>
        </Card.Root>

      <!-- TAB 3: RECURRING BILLING (Automated Schedules) -->
      {:else if activeTab === "recurring"}
        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl overflow-hidden">
          <Card.Header class="pb-3 border-b border-[#E5E7EB] flex flex-row items-center justify-between">
            <div>
              <Card.Title class="text-xs font-bold text-[#171923] uppercase tracking-wider">
                Automated Billing Schedules
              </Card.Title>
              <Card.Description class="text-xs text-[#717786]">
                Subscriptions scheduled for automated invoice generation.
              </Card.Description>
            </div>
            <Button variant="default" size="xs" class="text-xs bg-[#183f42] hover:bg-[#123033] text-white gap-1 font-semibold">
              <Plus class="w-3.5 h-3.5" /> New Schedule
            </Button>
          </Card.Header>
          <Card.Content class="p-0">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-[#F8F9FC] border-b border-[#E5E7EB] text-[#717786] font-semibold text-[11px]">
                <tr>
                  <th class="py-3 px-5">Schedule ID</th>
                  <th class="py-3 px-4">Customer</th>
                  <th class="py-3 px-4">Subscription Plan</th>
                  <th class="py-3 px-4">Frequency</th>
                  <th class="py-3 px-4">Next Billing Date</th>
                  <th class="py-3 px-4 text-right">Cycle Fee</th>
                  <th class="py-3 px-5 text-center">Auto-Billing</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E5E7EB]">
                {#each recurringSchedules as rec}
                  <tr class="hover:bg-[#F8F9FC]">
                    <td class="py-3.5 px-5 font-semibold text-[#171923]">{rec.scheduleId}</td>
                    <td class="py-3.5 px-4 font-bold text-[#171923]">{rec.customer}</td>
                    <td class="py-3.5 px-4 text-[#717786]">{rec.plan}</td>
                    <td class="py-3.5 px-4 text-[#171923] font-medium">{rec.interval}</td>
                    <td class="py-3.5 px-4 text-[#717786]">{rec.nextRun}</td>
                    <td class="py-3.5 px-4 text-right font-bold text-[#171923]">{formatINR(rec.amount)}</td>
                    <td class="py-3.5 px-5 text-center">
                      <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        rec.autoBill === 'Enabled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {rec.autoBill}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </Card.Content>
        </Card.Root>

      <!-- TAB 4: TRANSACTIONS (Payment Gateway Logs) -->
      {:else if activeTab === "transactions"}
        <Card.Root class="bg-white border-[#E5E7EB] shadow-xs rounded-xl overflow-hidden">
          <Card.Header class="pb-3 border-b border-[#E5E7EB]">
            <Card.Title class="text-xs font-bold text-[#171923] uppercase tracking-wider">
              Gateway Settlement Logs
            </Card.Title>
            <Card.Description class="text-xs text-[#717786]">
              Real-time payment gateway webhooks and settlement status.
            </Card.Description>
          </Card.Header>
          <Card.Content class="p-0">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-[#F8F9FC] border-b border-[#E5E7EB] text-[#717786] font-semibold text-[11px]">
                <tr>
                  <th class="py-3 px-5">Gateway Reference</th>
                  <th class="py-3 px-4">Processing Rail</th>
                  <th class="py-3 px-4">Payment Method</th>
                  <th class="py-3 px-4">Timestamp</th>
                  <th class="py-3 px-4 text-right">Gateway Fee</th>
                  <th class="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E5E7EB]">
                {#each gatewayTransactions as tx}
                  <tr class="hover:bg-[#F8F9FC]">
                    <td class="py-3.5 px-5 font-mono font-medium text-[#171923]">{tx.ref}</td>
                    <td class="py-3.5 px-4 text-[#171923] font-medium">{tx.gateway}</td>
                    <td class="py-3.5 px-4 text-[#717786]">{tx.method}</td>
                    <td class="py-3.5 px-4 text-[#717786]">{tx.timestamp}</td>
                    <td class="py-3.5 px-4 text-right text-[#717786]">{formatINR(tx.fee)}</td>
                    <td class="py-3.5 px-5 text-center">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </Card.Content>
        </Card.Root>
      {/if}
    </div>
  {/if}
</AppShell>

<!-- Generate Invoice Modal Dialog -->
{#if isGenerateModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
    <div class="bg-white border border-[#E5E7EB] rounded-xl shadow-xl max-w-md w-full overflow-hidden text-xs">
      <div class="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
        <div>
          <h3 class="font-bold text-[#171923] text-sm">Generate New Invoice</h3>
          <p class="text-[#717786] text-[11px] mt-0.5">Create a billable statement for an enterprise customer.</p>
        </div>
        <button onclick={() => (isGenerateModalOpen = false)} class="text-[#717786] hover:text-[#171923]">
          <X class="w-4 h-4" />
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); isGenerateModalOpen = false; }} class="p-4 space-y-3.5">
        <div class="space-y-1">
          <label for="cust-select" class="font-medium text-[#171923]">Customer Account *</label>
          <select id="cust-select" class="w-full h-8 text-xs bg-white border border-[#E5E7EB] rounded-lg px-2.5 text-[#171923]">
            <option>Nexus Health Systems</option>
            <option>CloudScale Analytics Inc.</option>
            <option>Apex Retail Solutions</option>
            <option>FinGuard Global Security</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label for="inv-date" class="font-medium text-[#171923]">Invoice Date *</label>
            <Input id="inv-date" type="date" value="2026-10-31" class="h-8 text-xs" />
          </div>
          <div class="space-y-1">
            <label for="due-date" class="font-medium text-[#171923]">Due Date *</label>
            <Input id="due-date" type="date" value="2026-11-30" class="h-8 text-xs" />
          </div>
        </div>

        <div class="space-y-1">
          <label for="inv-amt" class="font-medium text-[#171923]">Invoice Total Amount (₹) *</label>
          <Input id="inv-amt" type="number" value="3499.00" class="h-8 text-xs" />
        </div>

        <div class="space-y-1">
          <label for="inv-desc" class="font-medium text-[#171923]">Line Item Description</label>
          <Input id="inv-desc" type="text" placeholder="e.g. Growth Cloud Tier Retainer" class="h-8 text-xs" />
        </div>

        <div class="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
          <Button variant="outline" size="xs" onclick={() => (isGenerateModalOpen = false)}>
            Cancel
          </Button>
          <Button type="submit" size="xs" class="bg-[#183f42] hover:bg-[#123033] text-white font-semibold shadow-xs">
            Generate & Issue Invoice
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}
