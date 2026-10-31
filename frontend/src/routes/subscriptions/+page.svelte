<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Plus, Eye, Pause, RotateCw } from "lucide-svelte";

  const subscriptions = [
    { id: "SUB-8001", customer: "Nexus Health Systems", plan: "Growth Cloud Monthly", frequency: "Monthly", nextBilling: "Nov 19, 2026", amount: "$3,660.03", status: "Active" },
    { id: "SUB-8002", customer: "CloudScale Analytics Inc.", plan: "Enterprise Annual", frequency: "Yearly", nextBilling: "Feb 15, 2027", amount: "$9,900.00", status: "Active" },
    { id: "SUB-8003", customer: "Apex Retail Solutions", plan: "Growth Cloud Monthly", frequency: "Monthly", nextBilling: "Nov 01, 2026", amount: "$798.00", status: "Active" },
    { id: "SUB-8004", customer: "FinGuard Global Security", plan: "Engineering Support Weekly", frequency: "Weekly", nextBilling: "Nov 03, 2026", amount: "$700.00", status: "Active" }
  ];
</script>

<AppShell title="Subscription Contracts">
  <div class="space-y-6">
    <div class="flex items-center justify-between pb-4 border-b border-[#edf2f3]">
      <div>
        <h2 class="text-base font-bold text-[#122b2e] tracking-tight">Active Subscriptions</h2>
        <p class="text-xs text-[#7e9599] mt-0.5">Recurring enterprise contracts, terms, and automated renewal cycles.</p>
      </div>
      <Button size="xs" class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl gap-1.5 shadow-xs">
        <Plus class="w-3.5 h-3.5" /> New Subscription
      </Button>
    </div>

    <!-- Clean Table -->
    <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl overflow-hidden">
      <Card.Content class="p-3">
        <Table.Root>
          <Table.Header class="text-[#8c9ba5]">
            <Table.Row class="hover:bg-transparent border-[#edf2f3]">
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Subscription ID</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Customer</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Plan</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Frequency</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Next Billing</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right text-[#8c9ba5]">Recurring Fee</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center text-[#8c9ba5]">Status</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right text-[#8c9ba5]">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="text-xs">
            {#each subscriptions as sub}
              <Table.Row class="transition-all hover:bg-[#f8fafb] border-[#f4f7f8]">
                <Table.Cell class="py-3 px-4 font-semibold text-[#122b2e]">{sub.id}</Table.Cell>
                <Table.Cell class="py-3 px-4 font-bold text-[#122b2e]">{sub.customer}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-[#122b2e]">{sub.plan}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-[#586f73] font-medium">{sub.frequency}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-[#7e9599] font-medium">{sub.nextBilling}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-right font-bold text-[#122b2e]">{sub.amount}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-center">
                  <span class="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#e6f4f2] text-[#143e42] border border-[#bde4df]">
                    {sub.status}
                  </span>
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="xs" class="h-7 w-7 p-0 text-[#7e9599] hover:text-[#183f42] hover:bg-[#e6f4f2]/50 rounded-lg">
                      <Eye class="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="xs" class="h-7 w-7 p-0 text-[#7e9599] hover:text-[#183f42] hover:bg-[#e6f4f2]/50 rounded-lg">
                      <Pause class="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="xs" class="h-7 w-7 p-0 text-[#7e9599] hover:text-[#183f42] hover:bg-[#e6f4f2]/50 rounded-lg">
                      <RotateCw class="w-3.5 h-3.5" />
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
