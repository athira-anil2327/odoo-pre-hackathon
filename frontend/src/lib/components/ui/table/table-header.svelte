<script>
	import { cn } from "$lib/utils.js";
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	} = $props();
</script>

<thead
	bind:this={ref}
	data-slot="table-header"
	class={cn("[&_tr]:border-b [&_tr]:border-[#E5E7EB]", className)}
	{...restProps}
>
	{@render children?.()}
</thead>
