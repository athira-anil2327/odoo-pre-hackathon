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
	class={cn("hover:bg-fuchsia-50/30 data-[state=selected]:bg-slate-100 transition-colors", className)}
	{...restProps}
>
	{@render children?.()}
</tr>
