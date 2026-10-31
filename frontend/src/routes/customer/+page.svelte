<script>
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  onMount(() => {
    goto("/portal");
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-[#fafafc] text-xs text-zinc-500">
  Redirecting to Customer Portal...
</div>