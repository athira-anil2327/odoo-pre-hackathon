<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Printer, DollarSign, Download, Plus } from "lucide-svelte";

  const invoices = [
    { id: "INV-2026-001", customer: "Nexus Health Systems", date: "Oct 19, 2026", due: "Nov 18, 2026", total: "$3,660.03", paid: "$3,660.03", balance: "$0.00", status: "Paid", badgeClass: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/60" },
    { id: "INV-2026-002", customer: "CloudScale Analytics Inc.", date: "Feb 15, 2026", due: "Mar 02, 2026", total: "$10,642.50", paid: "$10,642.50", balance: "$0.00", status: "Paid", badgeClass: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/60" },
    { id: "INV-2026-003", customer: "Apex Retail Solutions", date: "Oct 01, 2026", due: "Oct 15, 2026", total: "$857.85", paid: "$400.00", balance: "$457.85", status: "Partially Paid", badgeClass: "bg-amber-50 text-amber-700 border-amber-200/60" },
    { id: "INV-2026-004", customer: "FinGuard Global Security", date: "Sep 15, 2026", due: "Oct 15, 2026", total: "$1,540.00", paid: "$0.00", balance: "$1,540.00", status: "Overdue", badgeClass: "bg-rose-50 text-rose-700 border-rose-200/60" },
    { id: "INV-2026-005", customer: "Apex Retail Solutions", date: "Oct 25, 2026", due: "Nov 09, 2026", total: "$482.68", paid: "$0.00", balance: "$482.68", status: "Confirmed", badgeClass: "bg-blue-50 text-blue-700 border-blue-200/60" }
  ];
</script>

<AppShell title="Invoices & Receivables">
  <div class="space-y-6">
    <div class="flex items-center justify-between pb-4 border-b border-zinc-200/70">
      <div>
        <h2 class="text-base font-bold text-zinc-900 tracking-tight">Invoice Management</h2>
        <p class="text-xs text-zinc-500 mt-0.5">Accounts receivable records, automated statements, and settlement status.</p>
      </div>
      <div class="flex items-center gap-2.5">
        <Button variant="outline" size="xs" class="text-xs border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg gap-1.5 shadow-2xs">
          <Download class="w-3.5 h-3.5 text-zinc-500" /> Export CSV
        </Button>
        <Button variant="default" size="xs" class="text-xs gradient-magenta hover:opacity-95 text-white glow-magenta-xs font-semibold rounded-lg gap-1.5 shadow-xs">
          <Plus class="w-3.5 h-3.5" /> Generate Invoice
        </Button>
      </div>
    </div>

    <!-- Clean Borderless Table -->
    <Card.Root class="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
      <Card.Content class="p-3">
        <Table.Root>
          <Table.Header class="text-zinc-400">
            <Table.Row class="hover:bg-transparent">
              <Table.Head class="h-9 text-xs font-semibold px-4">Invoice #</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Customer</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Invoice Date</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4">Due Date</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Total</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Paid</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Balance</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center">Status</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="text-xs">
            {#each invoices as inv}
              <Table.Row class="transition-all hover:bg-fuchsia-50/20">
                <Table.Cell class="py-3 px-4 font-semibold text-zinc-900">{inv.id}</Table.Cell>
                <Table.Cell class="py-3 px-4 font-bold text-zinc-900">{inv.customer}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-zinc-500">{inv.date}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-zinc-500">{inv.due}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-right font-bold text-zinc-900">{inv.total}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-right text-fuchsia-700 font-semibold">{inv.paid}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-right font-bold {inv.balance !== '$0.00' ? 'text-rose-600' : 'text-zinc-400'}">
                  {inv.balance}
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-center">
                  <span class={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${inv.badgeClass}`}>
                    {inv.status}
                  </span>
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <Button variant="ghost" size="xs" class="h-7 w-7 p-0 text-zinc-500 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-lg">
                      <Printer class="w-3.5 h-3.5" />
                    </Button>
                    {#if inv.balance !== "$0.00"}
                      <Button variant="outline" size="xs" class="h-7 text-xs border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-50/50 rounded-lg gap-1 font-medium">
                        <DollarSign class="w-3 h-3 text-fuchsia-600" /> Pay
                      </Button>
                    {/if}
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
