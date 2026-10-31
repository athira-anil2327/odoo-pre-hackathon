<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { customersStore, subscriptionsStore, addCustomer } from "$lib/stores/coreManagement.js";
  import {
    Search,
    Plus,
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
    Shield
  } from "lucide-svelte";

  let searchQuery = $state("");
  let showAddCustomerModal = $state(false);
  let showCustomerDetailModal = $state(false);
  let selectedCustomer = $state(null);

  // New Customer Form
  let newName = $state("");
  let newCompany = $state("");
  let newEmail = $state("");
  let newPhone = $state("");
  let newAddress = $state("");

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

  function handleCreateCustomer() {
    if (!newName || !newEmail) return;
    addCustomer({
      name: newName,
      company: newCompany || newName,
      email: newEmail,
      phone: newPhone,
      billing_address: newAddress
    });
    newName = "";
    newCompany = "";
    newEmail = "";
    newPhone = "";
    newAddress = "";
    showAddCustomerModal = false;
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
          Enterprise subscriber accounts, billing addresses, and linked subscriptions.
        </p>
      </div>
      <Button
        onclick={() => (showAddCustomerModal = true)}
        size="xs"
        class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl gap-1.5 shadow-xs"
      >
        <Plus class="w-3.5 h-3.5" /> Add Customer
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
            placeholder="Search by company, contact, or customer #..."
            class="h-9 pl-9 text-xs bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
          />
        </div>
        <div class="text-xs text-[#7e9599]">
          Showing <b>{filteredCustomers.length}</b> customer profiles
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Customers Table -->
    <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl overflow-hidden">
      <Card.Content class="p-3">
        <Table.Root>
          <Table.Header class="text-[#8c9ba5]">
            <Table.Row class="hover:bg-transparent border-[#edf2f3]">
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Customer #</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Company Name</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Contact Person</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Email Address</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Phone</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center text-[#8c9ba5]">Active Subs</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center text-[#8c9ba5]">Status</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right text-[#8c9ba5]">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="text-xs">
            {#each filteredCustomers as c}
              {@const subs = getCustomerSubscriptions(c.id)}
              <Table.Row class="transition-all hover:bg-[#f8fafb] border-[#f4f7f8]">
                <Table.Cell class="py-3 px-4 font-bold text-[#122b2e]">{c.customer_number}</Table.Cell>
                <Table.Cell class="py-3 px-4 font-bold text-[#122b2e]">{c.company}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-[#586f73]">{c.name}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-[#7e9599]">{c.email}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-[#7e9599]">{c.phone || "—"}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-center">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]">
                    {subs.length} Active
                  </span>
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-center">
                  <span class="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]">
                    {c.status}
                  </span>
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-right">
                  <button
                    onclick={() => handleViewCustomer(c)}
                    class="p-1 rounded text-zinc-400 hover:text-[#183f42] hover:bg-[#e6f4f2]/50 transition-colors"
                    title="View Customer Profile & Subscriptions"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </Card.Content>
    </Card.Root>
  </div>
</AppShell>

<!-- MODAL: ADD CUSTOMER -->
{#if showAddCustomerModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-md w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
        <div class="flex items-center gap-2">
          <Users class="w-4 h-4 text-[#183f42]" />
          <h3 class="font-bold text-[#122b2e]">Add Customer Record</h3>
        </div>
        <button onclick={() => (showAddCustomerModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-3">
        <div>
          <Label for="c-name" class="font-medium text-[#122b2e]">Contact Name *</Label>
          <Input id="c-name" bind:value={newName} placeholder="e.g. John Doe" class="h-9 text-xs mt-1" />
        </div>

        <div>
          <Label for="c-comp" class="font-medium text-[#122b2e]">Company Name</Label>
          <Input id="c-comp" bind:value={newCompany} placeholder="e.g. Acme Corp" class="h-9 text-xs mt-1" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <Label for="c-email" class="font-medium text-[#122b2e]">Email *</Label>
            <Input id="c-email" type="email" bind:value={newEmail} placeholder="john@acme.com" class="h-9 text-xs mt-1" />
          </div>
          <div>
            <Label for="c-phone" class="font-medium text-[#122b2e]">Phone</Label>
            <Input id="c-phone" bind:value={newPhone} placeholder="+1 (555) 000-0000" class="h-9 text-xs mt-1" />
          </div>
        </div>

        <div>
          <Label for="c-addr" class="font-medium text-[#122b2e]">Billing Address</Label>
          <textarea id="c-addr" bind:value={newAddress} placeholder="Street, City, State..." class="w-full h-16 bg-[#f8fafb] border border-[#e5ecee] rounded-xl p-2.5 mt-1 text-xs resize-none"></textarea>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 mt-4">
        <Button variant="outline" size="xs" onclick={() => (showAddCustomerModal = false)} class="rounded-xl">Cancel</Button>
        <Button size="xs" onclick={handleCreateCustomer} class="bg-[#183f42] text-white rounded-xl">Save Customer</Button>
      </div>
    </div>
  </div>
{/if}

<!-- MODAL: VIEW CUSTOMER PROFILE & LINKED SUBSCRIPTIONS -->
{#if showCustomerDetailModal && selectedCustomer}
  {@const subs = getCustomerSubscriptions(selectedCustomer.id)}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-lg w-full p-5 text-xs animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
        <div>
          <h3 class="font-bold text-[#122b2e] text-sm">{selectedCustomer.name}</h3>
          <p class="text-[11px] text-[#7e9599]">{selectedCustomer.company} • {selectedCustomer.customer_number}</p>
        </div>
        <button onclick={() => (showCustomerDetailModal = false)} class="p-1 rounded text-zinc-400 hover:text-zinc-600">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-4">
        <div class="p-3 bg-[#f8fafb] border border-[#edf2f3] rounded-xl text-[11px] space-y-1">
          <div><span class="text-[#7e9599]">Email:</span> <b class="text-[#122b2e]">{selectedCustomer.email}</b></div>
          <div><span class="text-[#7e9599]">Phone:</span> <b class="text-[#122b2e]">{selectedCustomer.phone || "N/A"}</b></div>
          <div><span class="text-[#7e9599]">Billing Address:</span> <b class="text-[#122b2e]">{selectedCustomer.billing_address || "None"}</b></div>
        </div>

        <div class="space-y-2">
          <span class="text-[10px] font-bold text-[#8c9ba5] uppercase tracking-wider block">
            Linked Active Subscriptions ({subs.length}):
          </span>
          {#if subs.length > 0}
            <div class="space-y-2">
              {#each subs as s}
                <div class="p-3 bg-white border border-[#edf2f3] rounded-xl flex items-center justify-between">
                  <div>
                    <div class="font-bold text-[#122b2e] flex items-center gap-1.5">
                      <Repeat class="w-3.5 h-3.5 text-[#183f42]" />
                      <span>{s.subscription_number}</span>
                    </div>
                    <div class="text-[11px] text-[#586f73] mt-0.5">{s.plan_name} • ${Number(s.total_amount).toFixed(2)}</div>
                  </div>
                  <span class="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]">
                    {s.status}
                  </span>
                </div>
              {/each}
            </div>
          {:else}
            <div class="p-3 bg-[#f8fafb] rounded-xl border border-dashed border-[#e2eaeb] text-center text-[#7e9599]">
              No active subscription records for this customer.
            </div>
          {/if}
        </div>
      </div>

      <div class="flex items-center justify-end pt-3 border-t border-zinc-100 mt-4">
        <Button size="xs" onclick={() => (showCustomerDetailModal = false)} class="bg-[#183f42] text-white rounded-xl">Close</Button>
      </div>
    </div>
  </div>
{/if}
