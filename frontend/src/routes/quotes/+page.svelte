<script>
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  onMount(() => {
    goto("/quotations", { replaceState: true });
  });
</script>

<div class="p-8 text-center text-xs text-[#7e9599]">
  Redirecting to Quotations &amp; Proposals...
</div>
