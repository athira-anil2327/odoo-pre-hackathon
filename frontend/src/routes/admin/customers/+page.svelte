<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { authApi } from "$lib/api.js";
  import {
    Search,
    Filter,
    Eye,
    Edit2,
    Users,
    UserPlus,
    User,
    Mail,
    Lock,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    X
  } from "lucide-svelte";

  const customers = [
    { id: "CUST-1001", company: "Nexus Health Systems", contact: "Dr. Eleanor Vance", email: "eleanor.vance@nexushealth.org", subs: 2, total: "$3,660.03", status: "Active" },
    { id: "CUST-1002", company: "CloudScale Analytics Inc.", contact: "Marcus Brody", email: "mbrody@cloudscale.io", subs: 1, total: "$10,642.50", status: "Active" },
    { id: "CUST-1003", company: "Apex Retail Solutions", contact: "Sarah Jenkins", email: "s.jenkins@apexretail.com", subs: 1, total: "$857.85", status: "Active" },
    { id: "CUST-1004", company: "FinGuard Global Security", contact: "Derrick Vance", email: "dvance@finguard.com", subs: 1, total: "$1,540.00", status: "Active" },
    { id: "CUST-1005", company: "Beacon Logistics Hub", contact: "Tariq Al-Mansoor", email: "tariq@beaconlogistics.net", subs: 0, total: "$499.00", status: "Inactive" }
  ];

  let searchQuery = $state("");

  // Create Employee modal state
  let showCreateEmployeeModal = $state(false);
  let empName = $state("");
  let empEmail = $state("");
  let empRole = $state("staff");
  let empPassword = $state("");
  let showEmpPassword = $state(false);
  let empError = $state("");
  let empSuccess = $state("");
  let isCreatingEmp = $state(false);

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

  const filteredCustomers = $derived(
    customers.filter(c =>
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
</script>

<AppShell title="Customer Management">
  <div class="space-y-6">
    <div class="flex items-center justify-between pb-4 border-b border-zinc-200/70">
      <div>
        <h2 class="text-base font-bold text-zinc-900 tracking-tight">Customer Directory</h2>
        <p class="text-xs text-zinc-500 mt-0.5">Corporate subscriber accounts and billing contacts (Customers register via Portal).</p>
      </div>
      <!-- Replaced Add Customer with Create Employee -->
      <Button
        onclick={() => (showCreateEmployeeModal = true)}
        size="xs"
        class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl gap-1.5 shadow-xs transition-all"
      >
        <UserPlus class="w-3.5 h-3.5" /> Create Employee
      </Button>
    </div>

    <!-- Filter & Search Toolbar -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl">
      <Card.Content class="p-3.5 flex items-center justify-between gap-4">
        <div class="relative w-72">
          <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <Input
            type="text"
            bind:value={searchQuery}
            placeholder="Search company or contact..."
            class="h-8 pl-9 text-xs bg-zinc-50 border-zinc-200 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-100 rounded-lg"
          />
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="xs" class="h-8 text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-lg gap-1.5">
            <Filter class="w-3 h-3 text-zinc-400" /> Filter Status
          </Button>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Table -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
      <Card.Content class="p-3">
        <Table.Root>
          <Table.Header class="text-zinc-400">
            <Table.Row class="hover:bg-transparent">
              <Table.Head class="h-9 text-xs font-semibold px-4">Customer ID</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Company Name</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Contact Person</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Email</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center">Subscriptions</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Revenue</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center">Status</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="text-xs">
            {#each filteredCustomers as c}
              <Table.Row class="transition-all hover:bg-fuchsia-50/20">
                <Table.Cell class="py-3 px-4 font-semibold text-zinc-900">{c.id}</Table.Cell>
                <Table.Cell class="py-3 px-4 font-bold text-zinc-900">{c.company}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-zinc-700">{c.contact}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-zinc-500">{c.email}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-center">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700">
                    {c.subs}
                  </span>
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-right font-bold text-zinc-900">{c.total}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-center">
                  <span class={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    c.status === 'Active'
                      ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/60'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}>
                    {c.status}
                  </span>
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="xs" class="h-7 w-7 p-0 text-zinc-500 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-lg">
                      <Eye class="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="xs" class="h-7 w-7 p-0 text-zinc-500 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-lg">
                      <Edit2 class="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </Card.Content>
    </Card.Root>
  </div>
</AppShell>

<!-- MODAL: CREATE EMPLOYEE -->
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
