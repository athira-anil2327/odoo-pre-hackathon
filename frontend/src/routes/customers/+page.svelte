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
    <div class="flex items-center justify-between pb-4 border-b border-[#edf2f3]">
      <div>
        <h2 class="text-base font-bold text-[#122b2e] tracking-tight">Customer Directory</h2>
        <p class="text-xs text-[#7e9599] mt-0.5">Corporate subscriber accounts and billing contacts.</p>
      </div>
      <Button size="xs" class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl gap-1.5 shadow-xs">
        <Plus class="w-3.5 h-3.5" /> Add Customer
      </Button>
    </div>

    <!-- Filter & Search Toolbar -->
    <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl">
      <Card.Content class="p-3.5 flex items-center justify-between gap-4">
        <div class="relative w-72">
          <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <Input
            type="text"
            placeholder="Search company or contact..."
            class="h-9 pl-9 text-xs bg-[#f8fafb] border-[#e5ecee] focus:border-[#183f42] focus:ring-1 focus:ring-[#183f42]/20 rounded-xl"
          />
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="xs" class="h-9 text-xs border-[#e2eaeb] text-[#586f73] hover:bg-[#f8fafb] rounded-xl gap-1.5">
            <Filter class="w-3 h-3 text-zinc-400" /> Filter Status
          </Button>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Clean Table -->
    <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl overflow-hidden">
      <Card.Content class="p-3">
        <Table.Root>
          <Table.Header class="text-[#8c9ba5]">
            <Table.Row class="hover:bg-transparent border-[#edf2f3]">
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Customer ID</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Company Name</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Contact Person</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Email</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center text-[#8c9ba5]">Subscriptions</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right text-[#8c9ba5]">Revenue</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center text-[#8c9ba5]">Status</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right text-[#8c9ba5]">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="text-xs">
            {#each customers as c}
              <Table.Row class="transition-all hover:bg-[#f8fafb] border-[#f4f7f8]">
                <Table.Cell class="py-3 px-4 font-semibold text-[#122b2e]">{c.id}</Table.Cell>
                <Table.Cell class="py-3 px-4 font-bold text-[#122b2e]">{c.company}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-[#586f73]">{c.contact}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-[#7e9599]">{c.email}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-center font-bold text-[#122b2e]">{c.subs}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-right font-bold text-[#122b2e]">{c.total}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-center">
                  <span class={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    c.status === 'Active'
                      ? 'bg-[#e6f4f2] text-[#143e42] border-[#bde4df]'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}>
                    {c.status}
                  </span>
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <Button variant="ghost" size="xs" class="h-7 text-xs text-[#586f73] hover:text-[#183f42] hover:bg-[#e6f4f2]/50 rounded-lg gap-1">
                      <Eye class="w-3 h-3" /> View
                    </Button>
                    <Button variant="ghost" size="xs" class="h-7 text-xs text-[#586f73] hover:text-[#183f42] hover:bg-[#e6f4f2]/50 rounded-lg gap-1">
                      <Edit2 class="w-3 h-3" /> Edit
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
