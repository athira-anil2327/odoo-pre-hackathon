<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { customersStore, subscriptionsStore } from "$lib/stores/coreManagement.js";
  import { authApi } from "$lib/api.js";
  import {
    Search,
    Filter,
    Eye,
    Users,
    Building2,
    Mail,
    Phone,
    MapPin,
    Repeat,
    X,
    CheckCircle2,
    Shield,
    UserPlus,
    User,
    Lock,
    EyeOff,
    AlertCircle
  } from "lucide-svelte";

  let searchQuery = $state("");
  let showCustomerDetailModal = $state(false);
  let selectedCustomer = $state(null);

  // Create Employee Form State (Replacing Add Customer)
  let showCreateEmployeeModal = $state(false);
  let empName = $state("");
  let empEmail = $state("");
  let empRole = $state("staff");
  let empPassword = $state("");
  let showEmpPassword = $state(false);
  let empError = $state("");
  let empSuccess = $state("");
  let isCreatingEmp = $state(false);

  const filteredCustomers = $derived(
    $customersStore.filter(c => {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.customer_number.toLowerCase().includes(q)
      );
    })
  );

  function getCustomerSubscriptions(custId) {
    return $subscriptionsStore.filter(s => s.customer_id === custId);
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

  function handleViewCustomer(c) {
    selectedCustomer = c;
    showCustomerDetailModal = true;
  }
</script>

<AppShell title="Customer Management">
  <div class="space-y-6">
    <div class="flex items-center justify-between pb-4 border-b border-[#edf2f3]">
      <div>
        <h2 class="text-base font-bold text-[#122b2e] tracking-tight">Customer Directory</h2>
        <p class="text-xs text-[#7e9599] mt-0.5">
          Enterprise subscriber accounts and billing contacts (Customers register via Portal).
        </p>
      </div>
      <!-- Option to Create Employee instead of Add Customer -->
      <Button
        onclick={() => (showCreateEmployeeModal = true)}
        size="xs"
        class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl gap-1.5 shadow-xs transition-all"
      >
        <UserPlus class="w-3.5 h-3.5" /> Create Employee
      </Button>
    </div>

    <!-- Filter & Search Toolbar -->
    <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl">
      <Card.Content class="p-3.5 flex items-center justify-between gap-4">
        <div class="relative w-80">
          <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <Input
            type="text"
            bind:value={searchQuery}
            placeholder="Search by name, company, email, or ID..."
            class="pl-9 text-xs h-9 bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
          />
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="xs" class="h-9 text-xs rounded-xl border-[#e5ecee] text-[#586f73]">
            <Filter class="w-3.5 h-3.5 mr-1" /> All Customers ({$customersStore.length})
          </Button>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Customers Table -->
    <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl overflow-hidden">
      <Card.Content class="p-0">
        <Table.Root>
          <Table.Header class="bg-[#f8fafb] border-b border-[#edf2f3]">
            <Table.Row class="hover:bg-transparent">
              <Table.Head class="text-xs font-semibold text-[#586f73] px-6 py-3">Customer ID</Table.Head>
              <Table.Head class="text-xs font-semibold text-[#586f73] px-6 py-3">Company / Account</Table.Head>
              <Table.Head class="text-xs font-semibold text-[#586f73] px-6 py-3">Contact Person</Table.Head>
              <Table.Head class="text-xs font-semibold text-[#586f73] px-6 py-3">Email Address</Table.Head>
              <Table.Head class="text-xs font-semibold text-[#586f73] px-6 py-3">Active Subscriptions</Table.Head>
              <Table.Head class="text-xs font-semibold text-[#586f73] px-6 py-3 text-right">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="text-xs divide-y divide-[#edf2f3]">
            {#if filteredCustomers.length === 0}
              <Table.Row>
                <Table.Cell colspan="6" class="px-6 py-8 text-center text-[#7e9599]">
                  No customers found matching your search.
                </Table.Cell>
              </Table.Row>
            {:else}
              {#each filteredCustomers as cust}
                {@const subs = getCustomerSubscriptions(cust.id)}
                <Table.Row class="hover:bg-[#fcfdfd] transition-colors">
                  <Table.Cell class="px-6 py-3.5 font-bold text-[#183f42]">
                    {cust.customer_number}
                  </Table.Cell>
                  <Table.Cell class="px-6 py-3.5 font-semibold text-[#122b2e]">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-lg bg-[#e6f4f2] text-[#143e42] flex items-center justify-center font-bold text-[11px]">
                        {cust.company.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{cust.company}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell class="px-6 py-3.5 text-[#586f73]">
                    {cust.name}
                  </Table.Cell>
                  <Table.Cell class="px-6 py-3.5 text-[#586f73]">
                    {cust.email}
                  </Table.Cell>
                  <Table.Cell class="px-6 py-3.5">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f4f2] text-[#143e42]">
                      <Repeat class="w-3 h-3" />
                      {subs.length} active
                    </span>
                  </Table.Cell>
                  <Table.Cell class="px-6 py-3.5 text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      onclick={() => handleViewCustomer(cust)}
                      class="text-xs text-[#183f42] hover:bg-[#e6f4f2] rounded-lg"
                    >
                      <Eye class="w-3.5 h-3.5 mr-1" /> View Profile
                    </Button>
                  </Table.Cell>
                </Table.Row>
              {/each}
            {/if}
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

<!-- MODAL: VIEW CUSTOMER PROFILE & LINKED SUBSCRIPTIONS -->
{#if showCustomerDetailModal && selectedCustomer}
  {@const subs = getCustomerSubscriptions(selectedCustomer.id)}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-lg w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
        <div class="flex items-center gap-2">
          <Building2 class="w-4 h-4 text-[#183f42]" />
          <h3 class="font-bold text-[#122b2e]">{selectedCustomer.company}</h3>
        </div>
        <button onclick={() => (showCustomerDetailModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-4">
        <!-- Customer Info -->
        <div class="bg-[#f8fafb] p-3 rounded-xl border border-[#edf2f3] grid grid-cols-2 gap-2">
          <div>
            <span class="text-[10px] text-[#8c9ba5] uppercase font-bold">Contact Person</span>
            <p class="font-semibold text-[#122b2e]">{selectedCustomer.name}</p>
          </div>
          <div>
            <span class="text-[10px] text-[#8c9ba5] uppercase font-bold">Customer Number</span>
            <p class="font-mono font-bold text-[#183f42]">{selectedCustomer.customer_number}</p>
          </div>
          <div>
            <span class="text-[10px] text-[#8c9ba5] uppercase font-bold">Email</span>
            <p class="text-[#586f73]">{selectedCustomer.email}</p>
          </div>
          <div>
            <span class="text-[10px] text-[#8c9ba5] uppercase font-bold">Phone</span>
            <p class="text-[#586f73]">{selectedCustomer.phone || "N/A"}</p>
          </div>
          <div class="col-span-2">
            <span class="text-[10px] text-[#8c9ba5] uppercase font-bold">Billing Address</span>
            <p class="text-[#586f73]">{selectedCustomer.billing_address || "Headquarters"}</p>
          </div>
        </div>

        <!-- Subscriptions List -->
        <div>
          <h4 class="font-bold text-[#122b2e] mb-2 flex items-center justify-between">
            <span>Linked Active Subscriptions</span>
            <span class="text-[11px] text-[#7e9599] font-normal">{subs.length} active</span>
          </h4>
          {#if subs.length === 0}
            <p class="text-zinc-400 italic py-2">No active subscriptions currently on file for this account.</p>
          {:else}
            <div class="space-y-2">
              {#each subs as s}
                <div class="p-2.5 rounded-xl border border-[#edf2f3] bg-white flex items-center justify-between">
                  <div>
                    <span class="font-bold text-[#183f42]">{s.id}</span>
                    <p class="text-[#586f73]">{s.plan} • {s.billing_cycle}</p>
                  </div>
                  <div class="text-right">
                    <span class="font-bold text-[#122b2e]">${s.price_cents ? (s.price_cents / 100).toFixed(2) : '0.00'}/mo</span>
                    <span class="block text-[10px] text-emerald-600 font-semibold">{s.status}</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="flex justify-end pt-4 border-t border-zinc-100 mt-4">
        <Button variant="outline" size="xs" onclick={() => (showCustomerDetailModal = false)} class="rounded-xl">Close</Button>
      </div>
    </div>
  </div>
{/if}
