<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Search, Plus, Filter, Eye, Edit2, Users } from "lucide-svelte";
  import { customersStore, subscriptionsStore } from "$lib/stores/coreManagement.js";

  let searchQuery = $state("");

  function formatCurrency(val) {
    const num = parseFloat(val) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(num);
  }

  const customerRows = $derived(
    $customersStore
      .filter(c => {
        const q = searchQuery.toLowerCase();
        return (
          (c.company || "").toLowerCase().includes(q) ||
          (c.name || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.customer_number || "").toLowerCase().includes(q)
        );
      })
      .map(c => {
        const subs = $subscriptionsStore.filter(s => s.customer_id === c.id);
        const activeSubs = subs.filter(s => s.status?.toLowerCase() === "active");
        const totalRev = subs.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);

        return {
          id: c.customer_number || c.id,
          company: c.company || c.name,
          contact: c.name,
          email: c.email,
          subsCount: activeSubs.length,
          total: formatCurrency(c.total_mrr || totalRev),
          status: c.is_active !== false ? "Active" : "Inactive"
        };
      })
  );
</script>

<AppShell title="Customer Management">
  <div class="space-y-6">
    <div class="flex items-center justify-between pb-4 border-b border-zinc-200/70">
      <div>
        <h2 class="text-base font-bold text-zinc-900 tracking-tight">Customer Directory</h2>
        <p class="text-xs text-zinc-500 mt-0.5">Corporate subscriber accounts and billing contacts from PostgreSQL database.</p>
      </div>
      <div class="flex items-center gap-2">
        <a
          href="/customers"
          class="inline-flex items-center text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold px-3 py-1.5 rounded-xl gap-1.5 shadow-xs transition-all"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Add Customer</span>
        </a>
        <a
          href="/staff-members"
          class="inline-flex items-center text-xs border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold px-3 py-1.5 rounded-xl gap-1.5 shadow-xs transition-all"
        >
          <span>Staff Management</span>
        </a>
      </div>
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
        <div class="text-xs text-zinc-500">
          Showing <span class="font-bold text-zinc-900">{customerRows.length}</span> verified accounts
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Borderless Table without unnecessary lines -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
      <Card.Content class="p-3">
        <Table.Root>
          <Table.Header class="text-zinc-400">
            <Table.Row class="hover:bg-transparent">
              <Table.Head class="h-9 text-xs font-semibold px-4">Customer ID</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Company Name</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Contact Person</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Email</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center">Active Subscriptions</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Revenue</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center">Status</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="text-xs">
            {#if customerRows.length === 0}
              <Table.Row>
                <Table.Cell colspan="8" class="text-center py-8 text-zinc-400">
                  No customer records found matching your filter.
                </Table.Cell>
              </Table.Row>
            {:else}
              {#each customerRows as c}
                <Table.Row class="transition-all hover:bg-fuchsia-50/20">
                  <Table.Cell class="py-3 px-4 font-semibold text-zinc-900">{c.id}</Table.Cell>
                  <Table.Cell class="py-3 px-4 font-bold text-zinc-900">{c.company}</Table.Cell>
                  <Table.Cell class="py-3 px-4 text-zinc-700">{c.contact}</Table.Cell>
                  <Table.Cell class="py-3 px-4 text-zinc-500">{c.email}</Table.Cell>
                  <Table.Cell class="py-3 px-4 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700">
                      {c.subsCount}
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
                      <a href="/customers" class="p-1.5 text-zinc-500 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-lg">
                        <Eye class="w-3.5 h-3.5" />
                      </a>
                    </div>
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
