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
    <div class="flex items-center justify-between pb-4 border-b border-zinc-200/70">
      <div>
        <h2 class="text-base font-bold text-zinc-900 tracking-tight">Active Subscriptions</h2>
        <p class="text-xs text-zinc-500 mt-0.5">Recurring enterprise contracts, terms, and automated renewal cycles.</p>
      </div>
      <Button variant="default" size="xs" class="text-xs gradient-magenta hover:opacity-95 text-white glow-magenta-xs font-semibold rounded-lg gap-1.5 shadow-xs">
        <Plus class="w-3.5 h-3.5" /> New Subscription
      </Button>
    </div>

    <!-- Clean Borderless Table -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
      <Card.Content class="p-3">
        <Table.Root>
          <Table.Header class="text-zinc-400">
            <Table.Row class="hover:bg-transparent">
              <Table.Head class="h-9 text-xs font-semibold px-4">Subscription ID</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Customer</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Plan</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Frequency</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Next Billing</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Recurring Fee</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center">Status</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="text-xs">
            {#each subscriptions as sub}
              <Table.Row class="transition-all hover:bg-fuchsia-50/20">
                <Table.Cell class="py-3 px-4 font-semibold text-zinc-900">{sub.id}</Table.Cell>
                <Table.Cell class="py-3 px-4 font-bold text-zinc-900">{sub.customer}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-zinc-800">{sub.plan}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-zinc-500 font-medium">{sub.frequency}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-zinc-600 font-medium">{sub.nextBilling}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-right font-bold text-zinc-900">{sub.amount}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-center">
                  <span class="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/60">
                    {sub.status}
                  </span>
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="xs" class="h-7 w-7 p-0 text-zinc-500 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-lg">
                      <Eye class="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="xs" class="h-7 w-7 p-0 text-zinc-500 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-lg">
                      <Pause class="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="xs" class="h-7 w-7 p-0 text-zinc-500 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-lg">
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
