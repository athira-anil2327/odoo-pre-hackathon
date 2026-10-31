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

  let searchQuery = $state("");
  let selectedHealth = $state("All");

  const customers = [
    {
      id: "CUST-1001",
      name: "Apex Global Technologies",
      contact: "Sarah Jenkins",
      email: "sarah.j@apextech.io",
      phone: "+1 (555) 432-8921",
      plan: "Enterprise Suite",
      mrr: "₹4,200/mo",
      status: "Active",
      health: "Healthy",
      healthColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    {
      id: "CUST-1002",
      name: "CloudSphere AI",
      contact: "Liam Foster",
      email: "liam@cloudsphere.ai",
      phone: "+1 (555) 871-2390",
      plan: "Growth Cloud",
      mrr: "₹2,800/mo",
      status: "Active",
      health: "Renewal Due",
      healthColor: "bg-amber-50 text-amber-700 border-amber-200"
    },
    {
      id: "CUST-1003",
      name: "BioSynth Labs",
      contact: "Dr. Evelyn Ward",
      email: "evelyn@biosynth.org",
      phone: "+1 (555) 654-1188",
      plan: "Research Plus",
      mrr: "₹3,400/mo",
      status: "Active",
      health: "Overdue Inv",
      healthColor: "bg-rose-50 text-rose-700 border-rose-200"
    },
    {
      id: "CUST-1004",
      name: "Starlight Media Group",
      contact: "Alex Chen",
      email: "alex@starlightmedia.com",
      phone: "+1 (555) 321-7764",
      plan: "Starter Cloud",
      mrr: "₹950/mo",
      status: "Active",
      health: "Healthy",
      healthColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    {
      id: "CUST-1005",
      name: "Vanguard Dynamics",
      contact: "Maya Rodriguez",
      email: "maya.r@vanguard.com",
      phone: "+1 (555) 902-3341",
      plan: "Enterprise Suite",
      mrr: "₹5,600/mo",
      status: "Active",
      health: "Healthy",
      healthColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
    }
  ];

  const filteredCustomers = $derived(
    customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.contact.toLowerCase().includes(searchQuery.toLowerCase());
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
          Direct client portfolio assigned to Marcus Brody for sales support and account management.
        </p>
      </div>

      <a href="/staff/quotations">
        <Button size="sm" class="gradient-magenta text-white glow-magenta-xs text-xs h-8">
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
          class="h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
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
          </tbody>
        </table>
      </div>
    </Card.Root>
  </div>
</AppShell>