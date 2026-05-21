import { ReactNode, useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { supabase } from '@/lib/supabase';
import { GuardedPageSkeleton } from './Skeletons/GuardedPageSkeleton';

export type Role = 'super_admin' | 'admin' | 'reservation' | 'frontoffice' | 'housekeeper';

const isAdmin = (role: unknown) => role === 'admin' || role === 'super_admin';

const ROLE_VERIFIED_KEY = 'userRoleVerified';

export default function RequireRole({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: Role[];
}) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;


    const getCachedRole = (): string | null => {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('userRole');
    };

    const setCachedRole = (role: string | null) => {
      if (typeof window === 'undefined') return;
      if (role) localStorage.setItem('userRole', role);
      else localStorage.removeItem('userRole');
    };

    const run = async () => {
      try {
        // Optimistic render using cached role (avoids visible checking/loading on every nav).
        const cachedRole = getCachedRole();
        const allowedByCache =
          cachedRole &&
          (isAdmin(cachedRole) || allowedRoles.includes(cachedRole as Role));

        // If we've already verified the cached role in this browser,
        // don't toggle UI again (prevents small flicker on navigation).
        const roleVerified = localStorage.getItem(ROLE_VERIFIED_KEY) === 'true';

        if (allowedByCache && roleVerified) {
          setChecking(false);
        } else if (allowedByCache) {
          setChecking(false);
        } else {
          setChecking(true);
        }


        // Always verify/refresh from Supabase in the background.
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();


        if (authError || !user) {
          setCachedRole(null);
          router.visit('/');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile?.role) {
          setCachedRole(null);
          await supabase.auth.signOut();
          router.visit('/');
          return;
        }

        const nextRole = profile.role as Role;
        setCachedRole(nextRole);

        const allowed = isAdmin(nextRole) || allowedRoles.includes(nextRole);
        if (!allowed) {
          router.visit('/dashboard');
          return;
        }

        if (!alive) return;
        setChecking(false);
      } catch {
        if (!alive) return;
        // Fallback to cache if Supabase fails.
        const cachedRole = getCachedRole();
        const fallbackAllowed =
          (cachedRole && (isAdmin(cachedRole) || allowedRoles.includes(cachedRole as Role))) ||
          false;

        if (fallbackAllowed) {
          setChecking(false);
          return;
        }

        router.visit('/dashboard');
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [allowedRoles]);

  if (checking) {
    // Layout-preserving skeleton to avoid blank-page flicker during role checks.
    // Sidebar is fixed on the left; topbar is fixed at the top.
    return (
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar spacer (matches Sidebar w-64 / w-20 depending on collapsed state)
            Since SidebarContext may not be available here, we default to expanded.
            This still prevents full blank flashes during RequireRole gating. */}
        <div className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-teal-950 to-teal-800" />

        {/* Main content spacer so topbar + skeleton align without jump */}
        <div className="flex-1 ml-64">
          <div className="fixed top-0 right-0 left-64 z-20 h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md" />

          <div className="pt-16">
            <div className="px-6 py-8 max-w-7xl mx-auto">
              <GuardedPageSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

