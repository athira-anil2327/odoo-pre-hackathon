<script>
	import '../app.css';
	import { isAuthenticated } from '$lib/stores/auth.js';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let { children } = $props();

	$effect(() => {
		if (browser) {
			const pathname = page.url.pathname;
			const isAuthPage = pathname === '/signin' || pathname === '/signup';

			if (!$isAuthenticated && !isAuthPage) {
				goto('/signin');
			} else if ($isAuthenticated && isAuthPage) {
				goto('/');
			}
		}
	});
</script>

<svelte:head>
	<title>Brightloop Software — Enterprise Subscription Management</title>
</svelte:head>

{@render children()}
