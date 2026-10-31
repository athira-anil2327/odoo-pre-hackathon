<script>
	import { cn } from "$lib/utils.js";
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	} = $props();
</script>

<tr
	bind:this={ref}
	data-slot="table-row"
	class={cn("border-b border-[#E5E7EB] hover:bg-[#F8F9FC] transition-colors", className)}
	{...restProps}
>
	{@render children?.()}
</tr>
