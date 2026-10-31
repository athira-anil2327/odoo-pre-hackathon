<script>
	import '../app.css';
	import { isAuthenticated, currentUser, getUserRole } from '$lib/stores/auth.js';
	import { syncWithBackend } from '$lib/stores/coreManagement.js';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let { children } = $props();

	$effect(() => {
		if (browser) {
			const pathname = page.url.pathname;
			const isAuthPage = pathname === '/signin' || pathname === '/signup' || pathname === '/reset-password';

			// 1. Unauthenticated Route Guard
			if (!$isAuthenticated) {
				if (!isAuthPage) {
					goto('/signin');
				}
				return;
			}

			// 2. Authenticated: Determine User Role
			const role = getUserRole($currentUser);

			// If authenticated user visits signin/signup/reset-password, redirect to their home
			if (isAuthPage) {
				if (role === 'admin') {
					goto('/');
				} else if (role === 'staff') {
					goto('/staff');
				} else {
					goto('/portal');
				}
				return;
			}

			// 3. Strict Role-Based Access Control (RBAC) Protection
			if (role === 'customer') {
				// Customer can ONLY access /portal, /portal/*, /profile
				const allowed = pathname.startsWith('/portal') || pathname === '/profile';
				if (!allowed) {
					console.warn(`[RBAC] Access denied for customer account to '${pathname}'. Redirecting to /portal.`);
					goto('/portal');
					return;
				}
			} else if (role === 'staff') {
				// Staff can ONLY access /staff, /staff/*, /subscriptions, /profile
				const allowed = pathname.startsWith('/staff') || pathname === '/subscriptions' || pathname === '/profile';
				if (!allowed) {
					console.warn(`[RBAC] Access denied for staff account to '${pathname}'. Redirecting to /staff.`);
					goto('/staff');
					return;
				}
			} else if (role === 'admin') {
				// Admin has exclusive access to admin pages (/ , /admin, /staff-members, /customers, /products, /quotations, /subscriptions, /invoices, /profile)
				// If admin visits /staff (staff workspace) or /portal, redirect to admin dashboard
				if (pathname === '/staff' || pathname.startsWith('/staff/') || pathname.startsWith('/portal')) {
					console.warn(`[RBAC] Redirecting admin from '${pathname}' to admin dashboard.`);
					goto('/');
					return;
				}
			}

			// 4. Two-way database synchronization
			syncWithBackend();
		}
	});
</script>

<svelte:head>
	<title>Brightloop Software — Enterprise Subscription Management</title>
</svelte:head>

{@render children()}
