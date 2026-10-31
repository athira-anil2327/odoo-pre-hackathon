<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Search, Plus, Filter, Eye, Edit2, Users } from "lucide-svelte";

  const customers = [
    { id: "CUST-1001", company: "Nexus Health Systems", contact: "Dr. Eleanor Vance", email: "eleanor.vance@nexushealth.org", subs: 2, total: "$3,660.03", status: "Active" },
    { id: "CUST-1002", company: "CloudScale Analytics Inc.", contact: "Marcus Brody", email: "mbrody@cloudscale.io", subs: 1, total: "$10,642.50", status: "Active" },
    { id: "CUST-1003", company: "Apex Retail Solutions", contact: "Sarah Jenkins", email: "s.jenkins@apexretail.com", subs: 1, total: "$857.85", status: "Active" },
    { id: "CUST-1004", company: "FinGuard Global Security", contact: "Derrick Vance", email: "dvance@finguard.com", subs: 1, total: "$1,540.00", status: "Active" },
    { id: "CUST-1005", company: "Beacon Logistics Hub", contact: "Tariq Al-Mansoor", email: "tariq@beaconlogistics.net", subs: 0, total: "$499.00", status: "Inactive" }
  ];
</script>

<AppShell title="Customer Management">
  <div class="space-y-6">
    <div class="flex items-center justify-between pb-4 border-b border-zinc-200/70">
      <div>
        <h2 class="text-base font-bold text-zinc-900 tracking-tight">Customer Directory</h2>
        <p class="text-xs text-zinc-500 mt-0.5">Corporate subscriber accounts and billing contacts.</p>
      </div>
      <a
        href="/staff-members"
        class="inline-flex items-center text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold px-3 py-1.5 rounded-xl gap-1.5 shadow-xs transition-all"
      >
        <span>Staff Management</span>
      </a>
    </div>

    <!-- Filter & Search Toolbar -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl">
      <Card.Content class="p-3.5 flex items-center justify-between gap-4">
        <div class="relative w-72">
          <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <Input
            type="text"
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
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center">Subscriptions</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Revenue</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center">Status</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="text-xs">
            {#each customers as c}
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
