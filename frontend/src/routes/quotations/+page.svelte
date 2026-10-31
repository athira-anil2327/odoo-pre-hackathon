<script>
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Plus, Eye, Send, Repeat } from "lucide-svelte";

  const quotes = [
    { id: "QUO-2026-081", customer: "Nexus Health Systems", date: "Oct 15, 2026", valid: "Nov 15, 2026", amount: "$3,660.03", status: "Accepted", converted: "SUB-8001" },
    { id: "QUO-2026-082", customer: "CloudScale Analytics Inc.", date: "Oct 22, 2026", valid: "Nov 22, 2026", amount: "$1,235.18", status: "Sent", converted: "—" },
    { id: "QUO-2026-083", customer: "Orbit Dynamics Corp", date: "Oct 28, 2026", valid: "Nov 28, 2026", amount: "$8,910.00", status: "Draft", converted: "—" }
  ];
</script>

<AppShell title="Quotations Queue">
  <div class="space-y-6">
    <div class="flex items-center justify-between pb-4 border-b border-[#edf2f3]">
      <div>
        <h2 class="text-base font-bold text-[#122b2e] tracking-tight">Quotation Management</h2>
        <p class="text-xs text-[#7e9599] mt-0.5">Commercial client proposals and contract conversions.</p>
      </div>
      <Button size="xs" class="text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-xl gap-1.5 shadow-xs">
        <Plus class="w-3.5 h-3.5" /> New Quotation
      </Button>
    </div>

    <!-- Clean Quotation Table -->
    <Card.Root class="bg-white border-[#edf2f3] shadow-xs rounded-2xl overflow-hidden">
      <Card.Content class="p-3">
        <Table.Root>
          <Table.Header class="text-[#8c9ba5]">
            <Table.Row class="hover:bg-transparent border-[#edf2f3]">
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Quote #</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Customer</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Created Date</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-[#8c9ba5]">Valid Until</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right text-[#8c9ba5]">Total Amount</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center text-[#8c9ba5]">Status</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-center text-[#8c9ba5]">Converted Sub</Table.Head>
              <Table.Head class="h-9 text-xs font-semibold px-4 text-right text-[#8c9ba5]">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="text-xs">
            {#each quotes as q}
              <Table.Row class="transition-all hover:bg-[#f8fafb] border-[#f4f7f8]">
                <Table.Cell class="py-3 px-4 font-semibold text-[#122b2e]">{q.id}</Table.Cell>
                <Table.Cell class="py-3 px-4 font-bold text-[#122b2e]">{q.customer}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-[#7e9599]">{q.date}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-[#7e9599]">{q.valid}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-right font-bold text-[#122b2e]">{q.amount}</Table.Cell>
                <Table.Cell class="py-3 px-4 text-center">
                  <span class={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    q.status === 'Accepted'
                      ? 'bg-[#e6f4f2] text-[#143e42] border-[#bde4df]'
                      : q.status === 'Sent'
                      ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}>
                    {q.status}
                  </span>
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-center text-[#586f73] font-medium">
                  {#if q.converted !== '—'}
                    <span class="inline-flex items-center gap-1 text-[11px] font-bold text-[#143e42] bg-[#e6f4f2] px-2 py-0.5 rounded border border-[#bde4df]">
                      <Repeat class="w-3 h-3" /> {q.converted}
                    </span>
                  {:else}
                    <span class="text-zinc-400">—</span>
                  {/if}
                </Table.Cell>
                <Table.Cell class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <Button variant="ghost" size="xs" class="h-7 text-xs text-[#586f73] hover:text-[#183f42] hover:bg-[#e6f4f2]/50 rounded-lg gap-1">
                      <Eye class="w-3 h-3" /> View
                    </Button>
                    {#if q.status === "Accepted" && q.converted === "—"}
                      <Button size="xs" class="h-7 text-xs bg-[#183f42] hover:bg-[#123033] text-white font-semibold rounded-lg gap-1">
                        <Repeat class="w-3 h-3" /> Convert
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
