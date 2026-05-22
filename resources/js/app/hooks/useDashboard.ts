import { useEffect, useRef, useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import {
  DashboardData,
  getAuthenticatedUser,
  fetchDashboardData,
} from '@/app/services/dashboard.service';

export type DashboardState =
  | { phase: 'auth' }
  | { phase: 'loading'; user: DashboardData['user'] }
  | { phase: 'ready';   data: DashboardData }
  | { phase: 'error';   message: string };

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({ phase: 'auth' });
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const user = await getAuthenticatedUser();
      if (!mountedRef.current) return;

      setState({ phase: 'loading', user });

      const rest = await fetchDashboardData(user.id);
      if (!mountedRef.current) return;

      setState({ phase: 'ready', data: { user, ...rest } });
    } catch (err: any) {
      if (!mountedRef.current) return;

      if (err?.message === 'unauthenticated' || err?.message === 'profile_missing') {
        router.visit('/');
        return;
      }
      setState({ phase: 'error', message: err?.message ?? 'Failed to load dashboard.' });
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  const refresh = useCallback(() => {
    if (state.phase === 'ready') {
      setState({ phase: 'loading', user: state.data.user });
    }
    load();
  }, [load, state]);

  return { state, refresh };
}