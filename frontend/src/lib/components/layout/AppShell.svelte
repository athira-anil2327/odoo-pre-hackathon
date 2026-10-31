<script>
  import Sidebar from "./Sidebar.svelte";
  import Header from "./Header.svelte";

  let { title = "Dashboard", children } = $props();
</script>

<div class="min-h-screen bg-[#f8fafb] flex flex-col md:flex-row font-sans antialiased text-[#122b2e]">
  <!-- Left Sidebar -->
  <Sidebar />

  <!-- Main Right Content Area -->
  <div class="flex-1 flex flex-col min-w-0 bg-[#f8fafb]">
    <Header {title} />
    <main class="flex-1 p-5 sm:p-7 overflow-y-auto">
      {@render children?.()}
    </main>
  </div>
</div>
