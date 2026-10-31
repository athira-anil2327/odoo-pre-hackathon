<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import {
    Search,
    Users,
    Phone,
    Mail,
    FileText,
    ExternalLink,
    Filter,
    Plus
  } from "lucide-svelte";
  import { customersStore, subscriptionsStore, plansStore } from "$lib/stores/coreManagement.js";
  import { invoicesStore } from "$lib/stores/invoices.js";

  let searchQuery = $state("");
  let selectedHealth = $state("All");

  function formatCurrency(val) {
    const num = parseFloat(val) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(num);
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const assignedCustomers = $derived(
    $customersStore.map(c => {
      const subs = $subscriptionsStore.filter(s => s.customer_id === c.id);
      const activeSub = subs.find(s => s.status?.toLowerCase() === "active") || subs[0];
      const planObj = activeSub ? $plansStore.find(p => p.id === activeSub.plan_id) : null;
      const planName = planObj ? planObj.name : (activeSub ? "Enterprise Plan" : "Custom Contract");

      const custInvoices = $invoicesStore.filter(i => i.customer_id === c.id);
      const hasOverdue = custInvoices.some(i => Number(i.outstanding_amount) > 0 && i.due_date && i.due_date < todayStr && i.status !== "cancelled");
      const isRenewalDue = activeSub?.next_billing_date && (new Date(activeSub.next_billing_date) - new Date() < 14 * 24 * 3600 * 1000);

      let health = "Healthy";
      let healthColor = "bg-emerald-50 text-emerald-700 border-emerald-200";

      if (hasOverdue) {
        health = "Overdue Inv";
        healthColor = "bg-rose-50 text-rose-700 border-rose-200";
      } else if (isRenewalDue) {
        health = "Renewal Due";
        healthColor = "bg-amber-50 text-amber-700 border-amber-200";
      }

      const totalMRR = subs
        .filter(s => s.status?.toLowerCase() === "active")
        .reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0);

      return {
        id: c.customer_number || c.id,
        name: c.company || c.name,
        contact: c.name,
        email: c.email,
        phone: c.phone || "N/A",
        plan: planName,
        mrr: `${formatCurrency(totalMRR)}/mo`,
        status: c.is_active !== false ? "Active" : "Inactive",
        health,
        healthColor
      };
    })
  );

  const filteredCustomers = $derived(
    assignedCustomers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesHealth = selectedHealth === "All" || c.health === selectedHealth;
      return matchesSearch && matchesHealth;
    })
  );
</script>

<AppShell title="Assigned Customers">
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-zinc-900 tracking-tight">Assigned Customer Accounts</h2>
        <p class="text-xs text-zinc-500 mt-1">
          Direct client portfolio and active accounts managed across the Brightloop subscription database.
        </p>
      </div>

      <a href="/staff/quotations">
        <Button size="sm" class="bg-[#183f42] text-white shadow-xs text-xs h-8">
          <FileText class="w-3.5 h-3.5 mr-1" /> Draft New Quote
        </Button>
      </a>
    </div>

    <!-- Search & Filter Controls -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-zinc-200/80 rounded-xl shadow-xs">
      <div class="relative w-full sm:w-80">
        <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
        <Input
          type="text"
          placeholder="Search assigned accounts..."
          bind:value={searchQuery}
          class="h-8 pl-9 text-xs bg-zinc-50/70 border-zinc-200 rounded-lg"
        />
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <span class="text-xs text-zinc-400">Health:</span>
        <select
          bind:value={selectedHealth}
          class="h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 focus:outline-none focus:ring-1 focus:ring-[#183f42]/20"
        >
          <option value="All">All Health States</option>
          <option value="Healthy">Healthy</option>
          <option value="Renewal Due">Renewal Due</option>
          <option value="Overdue Inv">Overdue Inv</option>
        </select>
      </div>
    </div>

    <!-- Customers Table -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left">
          <thead class="bg-zinc-50/80 text-zinc-500 font-semibold border-b border-zinc-200/80">
            <tr>
              <th class="py-3 px-4">Account & Primary Contact</th>
              <th class="py-3 px-4">Direct Communication</th>
              <th class="py-3 px-4">Active Plan</th>
              <th class="py-3 px-4 text-right">Account MRR</th>
              <th class="py-3 px-4">Health Status</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            {#if filteredCustomers.length === 0}
              <tr>
                <td colspan="6" class="py-8 text-center text-zinc-400">
                  No accounts found matching search or filter criteria.
                </td>
              </tr>
            {:else}
              {#each filteredCustomers as customer}
                <tr class="hover:bg-zinc-50/70 transition-colors">
                  <td class="py-3 px-4">
                    <div class="font-semibold text-zinc-900">{customer.name}</div>
                    <div class="text-[11px] text-zinc-500 mt-0.5">{customer.contact} • {customer.id}</div>
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-1.5 text-zinc-600">
                      <Mail class="w-3 h-3 text-zinc-400" />
                      <span>{customer.email}</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-zinc-400 text-[11px] mt-0.5">
                      <Phone class="w-3 h-3 text-zinc-400" />
                      <span>{customer.phone}</span>
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <span class="font-medium text-zinc-800">{customer.plan}</span>
                  </td>
                  <td class="py-3 px-4 text-right font-semibold text-zinc-900">
                    {customer.mrr}
                  </td>
                  <td class="py-3 px-4">
                    <span class={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${customer.healthColor}`}>
                      {customer.health}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <a href="/staff/quotations">
                        <Button size="xs" variant="outline" class="h-7 text-[11px] border-zinc-200 text-zinc-700 hover:bg-zinc-50">
                          Quote
                        </Button>
                      </a>
                      <a href="/staff/invoices">
                        <Button size="xs" variant="outline" class="h-7 text-[11px] border-zinc-200 text-zinc-700 hover:bg-zinc-50">
                          Invoices
                        </Button>
                      </a>
                    </div>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </Card.Root>
  </div>
</AppShell>
