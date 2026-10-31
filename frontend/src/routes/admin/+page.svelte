<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import Chart from "$lib/components/Chart.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { dashboardApi, invoicesApi, authApi } from "$lib/api.js";
  import { browser } from "$app/environment";
  import {
    DollarSign,
    Repeat,
    Clock,
    TrendingUp,
    ArrowUpRight,
    UserPlus,
    Users,
    Download,
    Sparkles,
    Shield,
    Lock,
    Mail,
    User,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    X,
    Briefcase
  } from "lucide-svelte";

  function formatCurrency(val) {
    const num = parseFloat(val) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(num);
  }

  let financeSummary = $state({
    currency: 'INR',
    active_subscriptions_count: '5',
    monthly_recurring_revenue: '3105.62',
    total_revenue_collected: '2347.62',
    total_outstanding_amount: '1149.62',
    overdue_invoices_count: '1',
    overdue_amount: '1149.62'
  });

  const chartData = {
    labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    datasets: [
      {
        label: "Monthly Recurring Revenue (MRR)",
        data: [11200, 12800, 14100, 15600, 16400, 17850]
      }
    ]
  };

  let recentInvoices = $state([
    { id: "INV-2026-001", customer: "Nexus Health Systems", date: "Oct 19, 2026", amount: "₹3,660.03", status: "Paid", badgeClass: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/60" },
    { id: "INV-2026-002", customer: "CloudScale Analytics Inc.", date: "Oct 22, 2026", amount: "₹10,642.50", status: "Paid", badgeClass: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/60" },
    { id: "INV-2026-003", customer: "Apex Retail Solutions", date: "Oct 25, 2026", amount: "₹857.85", status: "Partially Paid", badgeClass: "bg-amber-50 text-amber-700 border-amber-200/60" },
    { id: "INV-2026-004", customer: "FinGuard Global Security", date: "Oct 28, 2026", amount: "₹1,540.00", status: "Overdue", badgeClass: "bg-rose-50 text-rose-700 border-rose-200/60" }
  ]);

  // Employee creation state
  let showCreateEmployeeModal = $state(false);
  let empName = $state("");
  let empEmail = $state("");
  let empRole = $state("staff");
  let empPassword = $state("");
  let showEmpPassword = $state(false);
  let empError = $state("");
  let empSuccess = $state("");
  let isCreatingEmp = $state(false);
  let employees = $state([]);

  function loadEmployees() {
    authApi.getUsers().then(res => {
      if (res.success && Array.isArray(res.data)) {
        employees = res.data.filter(u => u.role === "staff" || u.role === "admin");
      }
    }).catch(err => console.warn("Failed to load employees:", err));
  }

  async function handleCreateEmployee() {
    empError = "";
    empSuccess = "";

    if (!empName || !empEmail || !empPassword) {
      empError = "Please complete all mandatory employee fields.";
      return;
    }

    if (empPassword.length < 6) {
      empError = "Password must be at least 6 characters long.";
      return;
    }

    isCreatingEmp = true;

    try {
      const res = await authApi.createStaff({
        name: empName.trim(),
        email: empEmail.trim().toLowerCase(),
        password: empPassword,
        role: empRole
      });

      if (!res.success) {
        throw new Error(res.error?.message || "Failed to create employee account");
      }

      empSuccess = `Employee ${empName} provisioned successfully with role '${empRole}'!`;
      empName = "";
      empEmail = "";
      empPassword = "";
      loadEmployees();
      setTimeout(() => {
        showCreateEmployeeModal = false;
        empSuccess = "";
      }, 1500);
    } catch (err) {
      empError = err.message || "Failed to create employee.";
    } finally {
      isCreatingEmp = false;
    }
  }

  $effect(() => {
    if (browser) {
      dashboardApi.getFinanceSummary().then(res => {
        if (res.success && res.data) {
          financeSummary = res.data;
        }
      }).catch(err => console.warn("Dashboard metrics load notice:", err));

      invoicesApi.getAll().then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          recentInvoices = res.data.slice(0, 5).map(inv => {
            const isPaid = inv.status === "paid";
            const isPartial = inv.status === "partially_paid";
            const isConfirmed = inv.status === "confirmed";
            return {
              id: inv.invoice_number,
              customer: inv.customer_name || inv.customer_company || "Customer",
              date: new Date(inv.invoice_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
              amount: formatCurrency(inv.total_amount),
              status: inv.status.replace("_", " ").toUpperCase(),
              badgeClass: isPaid
                ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/60"
                : isPartial
                ? "bg-amber-50 text-amber-700 border-amber-200/60"
                : isConfirmed
                ? "bg-blue-50 text-blue-700 border-blue-200/60"
                : "bg-zinc-50 text-zinc-700 border-zinc-200/60"
            };
          });
        }
      }).catch(err => console.warn("Recent invoices load notice:", err));

      loadEmployees();
    }
  });
</script>

<AppShell title="Financial & Operational Overview">
  <div class="space-y-6">
    <!-- Header Action Row -->
    <div class="flex items-center justify-between pb-4 border-b border-zinc-200/70">
      <div>
        <h2 class="text-base font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <span>Overview Dashboard</span>
          <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-fuchsia-700 bg-fuchsia-50 px-2 py-0.5 rounded-full border border-fuchsia-200/60">
            <Sparkles class="w-3 h-3" /> Live Pacing
          </span>
        </h2>
        <p class="text-xs text-zinc-500 mt-0.5">Recurring revenue performance and operational controls across Brightloop Software.</p>
      </div>
      <div class="flex items-center gap-2.5">
        <Button variant="outline" size="xs" class="text-xs border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg gap-1.5 shadow-2xs">
          <Download class="w-3.5 h-3.5 text-zinc-500" /> Export CSV
        </Button>
        <!-- Replaced Create Record / Add Customer with Create Employee -->
        <Button
          onclick={() => (showCreateEmployeeModal = true)}
          variant="default"
          size="xs"
          class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl gap-1.5 shadow-xs transition-all"
        >
          <UserPlus class="w-3.5 h-3.5" /> Create Employee
        </Button>
      </div>
    </div>

    <!-- 4 KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card.Root class="bg-white border-zinc-200/80 shadow-xs hover:border-fuchsia-200 transition-all rounded-xl relative overflow-hidden group">
        <div class="absolute top-0 left-0 right-0 h-1 gradient-magenta opacity-80"></div>
        <Card.Header class="pb-2 pt-4 flex flex-row items-center justify-between space-y-0">
          <span class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Revenue</span>
          <div class="w-7 h-7 rounded-lg bg-fuchsia-50 flex items-center justify-center text-fuchsia-600">
            <DollarSign class="w-4 h-4" />
          </div>
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold tracking-tight text-zinc-900">{formatCurrency(financeSummary.total_revenue_collected)}</div>
          <div class="text-[11px] font-medium text-fuchsia-700 mt-1 flex items-center gap-1">
            <TrendingUp class="w-3 h-3" /> Live from Ledger
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root class="bg-white border-zinc-200/80 shadow-xs hover:border-fuchsia-200 transition-all rounded-xl relative overflow-hidden group">
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-700 to-zinc-900 opacity-80"></div>
        <Card.Header class="pb-2 pt-4 flex flex-row items-center justify-between space-y-0">
          <span class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Subscriptions</span>
          <div class="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
            <Repeat class="w-4 h-4" />
          </div>
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold tracking-tight text-zinc-900">{financeSummary.active_subscriptions_count} Active</div>
          <div class="text-[11px] text-zinc-500 mt-1">Live active contracts</div>
        </Card.Content>
      </Card.Root>

      <Card.Root class="bg-white border-zinc-200/80 shadow-xs hover:border-fuchsia-200 transition-all rounded-xl relative overflow-hidden group">
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-400 to-zinc-600 opacity-80"></div>
        <Card.Header class="pb-2 pt-4 flex flex-row items-center justify-between space-y-0">
          <span class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Outstanding Invoices</span>
          <div class="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
            <Clock class="w-4 h-4" />
          </div>
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold tracking-tight text-zinc-900">{formatCurrency(financeSummary.total_outstanding_amount)}</div>
          <div class="text-[11px] text-zinc-500 mt-1">{financeSummary.overdue_invoices_count || 0} overdue receivable</div>
        </Card.Content>
      </Card.Root>

      <Card.Root class="bg-white border-zinc-200/80 shadow-xs hover:border-fuchsia-200 transition-all rounded-xl relative overflow-hidden group">
        <div class="absolute top-0 left-0 right-0 h-1 gradient-magenta opacity-80"></div>
        <Card.Header class="pb-2 pt-4 flex flex-row items-center justify-between space-y-0">
          <span class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Monthly Recurring (MRR)</span>
          <div class="w-7 h-7 rounded-lg bg-fuchsia-50 flex items-center justify-center text-fuchsia-600">
            <TrendingUp class="w-4 h-4" />
          </div>
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold tracking-tight text-zinc-900">{formatCurrency(financeSummary.monthly_recurring_revenue)}</div>
          <div class="text-[11px] font-medium text-fuchsia-700 mt-1 flex items-center gap-1">
            <TrendingUp class="w-3 h-3" /> Recurring run-rate
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Active Employees Directory (Created by Admin) -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
      <Card.Header class="pb-3 flex flex-row items-center justify-between border-b border-zinc-100">
        <div>
          <Card.Title class="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Briefcase class="w-4 h-4 text-[#183f42]" />
            <span>Staff &amp; Operations Employees</span>
          </Card.Title>
          <Card.Description class="text-xs text-zinc-500">
            Authorized team members provisioned with role-based access control.
          </Card.Description>
        </div>
        <Button
          onclick={() => (showCreateEmployeeModal = true)}
          variant="outline"
          size="xs"
          class="text-xs border-[#183f42] text-[#183f42] hover:bg-[#e6f4f2] rounded-xl gap-1"
        >
          <UserPlus class="w-3.5 h-3.5" /> Add Employee
        </Button>
      </Card.Header>
      <Card.Content class="p-3">
        <Table.Root>
          <Table.Header class="text-zinc-400">
            <Table.Row class="hover:bg-transparent">
              <Table.Head class="h-9 text-xs font-semibold px-4">Employee Name</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Corporate Email</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center">Role</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center">Status</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Created</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="text-xs">
            {#if employees.length === 0}
              <Table.Row>
                <Table.Cell colspan="5" class="py-6 text-center text-zinc-400">
                  No staff employees found. Click "Create Employee" to provision team members.
                </Table.Cell>
              </Table.Row>
            {:else}
              {#each employees as emp}
                <Table.Row class="rounded-xl transition-all hover:bg-zinc-50/60">
                  <Table.Cell class="py-3 px-4 font-semibold text-zinc-900 flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-[#183f42] text-white flex items-center justify-center text-[10px] font-bold">
                      {(emp.name || "E").charAt(0).toUpperCase()}
                    </div>
                    <span>{emp.name}</span>
                  </Table.Cell>
                  <Table.Cell class="py-3 px-4 text-zinc-600">{emp.email}</Table.Cell>
                  <Table.Cell class="py-3 px-4 text-center">
                    <span class={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      emp.role === "admin"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      {emp.role === "admin" ? "Administrator" : "Staff Operations"}
                    </span>
                  </Table.Cell>
                  <Table.Cell class="py-3 px-4 text-center">
                    <span class="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </Table.Cell>
                  <Table.Cell class="py-3 px-4 text-right text-zinc-500">
                    {emp.created_at ? new Date(emp.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Active"}
                  </Table.Cell>
                </Table.Row>
              {/each}
            {/if}
          </Table.Body>
        </Table.Root>
      </Card.Content>
    </Card.Root>

    <!-- Revenue Analytics Chart Card -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
      <Card.Header class="pb-3 flex flex-row items-center justify-between border-b border-zinc-100">
        <div>
          <Card.Title class="text-sm font-bold text-zinc-900">Revenue Trajectory</Card.Title>
          <Card.Description class="text-xs text-zinc-500">
            Monthly recurring pacing over the trailing two quarters.
          </Card.Description>
        </div>
        <div class="flex items-center gap-1 bg-zinc-100/80 p-0.5 rounded-lg border border-zinc-200/60">
          <Button variant="default" size="xs" class="text-xs h-7 gradient-magenta text-white font-semibold rounded-md shadow-2xs">
            Monthly
          </Button>
          <Button variant="ghost" size="xs" class="text-xs h-7 text-zinc-600 hover:text-zinc-900 rounded-md">
            Quarterly
          </Button>
          <Button variant="ghost" size="xs" class="text-xs h-7 text-zinc-600 hover:text-zinc-900 rounded-md">
            Yearly
          </Button>
        </div>
      </Card.Header>
      <Card.Content class="pt-5">
        <Chart data={chartData} height={210} />
      </Card.Content>
    </Card.Root>

    <!-- Recent Invoices Table -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
      <Card.Header class="pb-3 flex flex-row items-center justify-between border-b border-zinc-100">
        <div>
          <Card.Title class="text-sm font-bold text-zinc-900">Recent Invoices</Card.Title>
          <Card.Description class="text-xs text-zinc-500">Latest accounts receivable statements and settlement tracking.</Card.Description>
        </div>
        <Button variant="outline" size="xs" href="/invoices" class="text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-lg">
          View All Invoices
        </Button>
      </Card.Header>
      <Card.Content class="p-3">
        <Table.Root>
          <Table.Header class="text-zinc-400">
            <Table.Row class="hover:bg-transparent">
              <Table.Head class="h-9 text-xs font-semibold px-4">Invoice #</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Customer</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Date</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Amount</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center">Status</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Action</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="text-xs">
            {#each recentInvoices as inv}
              <Table.Row class="rounded-xl transition-all hover:bg-fuchsia-50/20">
                <Table.Cell class="py-3 px-4 font-semibold text-zinc-900">{inv.id}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-zinc-800 font-medium">{inv.customer}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-zinc-500">{inv.date}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-right font-bold text-zinc-900">{inv.amount}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-center">
                  <span class={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${inv.badgeClass}`}>
                    {inv.status}
                  </span>
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-right">
                  <Button variant="ghost" size="xs" class="h-7 text-xs text-zinc-600 hover:text-fuchsia-700 hover:bg-fuchsia-50/50 rounded-lg gap-1">
                    Details <ArrowUpRight class="w-3 h-3" />
                  </Button>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </Card.Content>
    </Card.Root>
  </div>
</AppShell>

<!-- MODAL: CREATE EMPLOYEE (ADMIN ONLY) -->
{#if showCreateEmployeeModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-[#edf2f3] mb-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-[#e6f4f2] text-[#183f42] flex items-center justify-center">
            <UserPlus class="w-4 h-4" />
          </div>
          <div>
            <h3 class="font-bold text-[#122b2e] text-sm">Create New Employee</h3>
            <p class="text-[11px] text-[#7e9599]">Provision staff or operational access with RBAC credentials</p>
          </div>
        </div>
        <button
          onclick={() => { showCreateEmployeeModal = false; empError = ""; empSuccess = ""; }}
          class="p-1 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      {#if empError}
        <div class="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
          <span>{empError}</span>
        </div>
      {/if}

      {#if empSuccess}
        <div class="mb-3 p-2.5 rounded-xl bg-[#e6f4f2] border border-[#bde4df] text-[#143e42] text-xs flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{empSuccess}</span>
        </div>
      {/if}

      <form class="space-y-3.5" onsubmit={(e) => { e.preventDefault(); handleCreateEmployee(); }}>
        <div class="space-y-1">
          <Label for="emp-name" class="font-semibold text-[#122b2e]">Full Name *</Label>
          <div class="relative">
            <User class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <Input
              id="emp-name"
              type="text"
              bind:value={empName}
              placeholder="e.g. Sarah Jenkins"
              class="pl-9 h-9 text-xs bg-[#f8fafb] border-[#e5ecee] rounded-xl"
              required
            />
          </div>
        </div>

        <div class="space-y-1">
          <Label for="emp-email" class="font-semibold text-[#122b2e]">Corporate Email *</Label>
          <div class="relative">
            <Mail class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <Input
              id="emp-email"
              type="email"
              bind:value={empEmail}
              placeholder="e.g. sales@brightloop.io"
              class="pl-9 h-9 text-xs bg-[#f8fafb] border-[#e5ecee] rounded-xl"
              required
            />
          </div>
        </div>

        <div class="space-y-1">
          <Label for="emp-role" class="font-semibold text-[#122b2e]">Employee Role *</Label>
          <select
            id="emp-role"
            bind:value={empRole}
            class="w-full h-9 px-3 text-xs bg-[#f8fafb] border border-[#e5ecee] focus:border-[#183f42] rounded-xl text-[#122b2e] focus:outline-none"
          >
            <option value="staff">Staff Operations (Sales &amp; Quotations)</option>
            <option value="admin">Administrator (Full Platform Control)</option>
          </select>
        </div>

        <div class="space-y-1">
          <Label for="emp-pwd" class="font-semibold text-[#122b2e]">Initial Password *</Label>
          <div class="relative">
            <Lock class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <Input
              id="emp-pwd"
              type={showEmpPassword ? "text" : "password"}
              bind:value={empPassword}
              placeholder="Min 6 characters..."
              class="pl-9 pr-9 h-9 text-xs bg-[#f8fafb] border-[#e5ecee] rounded-xl"
              required
            />
            <button
              type="button"
              onclick={() => (showEmpPassword = !showEmpPassword)}
              class="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
            >
              {#if showEmpPassword}
                <EyeOff class="w-3.5 h-3.5" />
              {:else}
                <Eye class="w-3.5 h-3.5" />
              {/if}
            </button>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#edf2f3]">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onclick={() => { showCreateEmployeeModal = false; empError = ""; empSuccess = ""; }}
            class="rounded-xl h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isCreatingEmp}
            class="bg-[#183f42] hover:bg-[#123033] text-white rounded-xl h-8 text-xs font-semibold px-4 flex items-center gap-1.5"
          >
            {#if isCreatingEmp}
              <div class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Creating...</span>
            {:else}
              <UserPlus class="w-3.5 h-3.5" />
              <span>Create Employee Account</span>
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}
