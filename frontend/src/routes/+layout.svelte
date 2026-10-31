<script>
	import '../app.css';
	import { isAuthenticated, currentUser } from '$lib/stores/auth.js';
	import { syncWithBackend } from '$lib/stores/coreManagement.js';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let { children } = $props();

	$effect(() => {
		if (browser) {
			const pathname = page.url.pathname;
			const isAuthPage = pathname === '/signin' || pathname === '/signup' || pathname === '/reset-password';

			// 1. Not authenticated -> Redirect to signin
			if (!$isAuthenticated && !isAuthPage) {
				goto('/signin');
				return;
			}

			// 2. Authenticated user handling
			if ($isAuthenticated) {
				const role = $currentUser?.role || "";
				const isAdmin = role === "Administrator" || role === "admin";
				const isStaff = role === "Staff Operations" || role === "staff";
				const isCustomer = !isAdmin && !isStaff;

				// If already logged in and visiting an auth page, send to their home path
				if (isAuthPage) {
					if (isAdmin) goto('/admin');
					else if (isStaff) goto('/staff');
					else goto('/portal');
					return;
				}

				// 3. Separate path enforcement for each role:
				// Customer path isolation
				if (isCustomer) {
					const isAllowed = pathname.startsWith('/portal') || pathname === '/profile';
					if (!isAllowed) {
						goto('/portal');
						return;
					}
				}

				// Staff path isolation
				if (isStaff) {
					const isAllowed = pathname.startsWith('/staff') || pathname === '/profile' || pathname === '/subscriptions';
					if (!isAllowed) {
						goto('/staff');
						return;
					}
				}

				// Admin path isolation
				if (isAdmin) {
					// Disallow portal or staff paths for admin; redirect root to /admin
					if (pathname === '/') {
						goto('/admin');
						return;
					}
					if (pathname.startsWith('/portal') || pathname.startsWith('/staff')) {
						goto('/admin');
						return;
					}
				}

				syncWithBackend();
			}
		}
	});
</script>

<svelte:head>
	<title>Brightloop Software — Enterprise Subscription Management</title>
</svelte:head>

{@render children()}
