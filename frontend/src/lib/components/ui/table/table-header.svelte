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
	class={cn("[&_tr]:border-none text-slate-400 font-semibold tracking-wider text-[11px]", className)}
	{...restProps}
>
	{@render children?.()}
</thead>
