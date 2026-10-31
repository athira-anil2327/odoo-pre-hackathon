<script>
  import Sidebar from "./Sidebar.svelte";
  import Header from "./Header.svelte";

  let { title = "Dashboard", children } = $props();
</script>

<div class="min-h-screen bg-[#fafafc] flex text-zinc-900 font-sans antialiased">
  <Sidebar />
  <div class="flex-1 flex flex-col min-w-0">
    <Header {title} />
    <main class="flex-1 p-7 max-w-7xl w-full mx-auto">
      {@render children?.()}
    </main>
  </div>
</div>
