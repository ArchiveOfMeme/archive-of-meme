'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

// Función para fetch de datos del usuario
const fetchMiningUser = async (address) => {
  if (!address) return null;

  const res = await fetch(`/api/mining/user?wallet=${address}`);
  const data = await res.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
};

export function useMining() {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  // Estados locales para acciones
  const [lastResult, setLastResult] = useState(null);

  // Estados para tiempo real (calculados localmente, no necesitan API)
  const [livePoints, setLivePoints] = useState(0);
  const [liveRemainingMs, setLiveRemainingMs] = useState(0);

  // React Query: Fetch user data con cache automático
  const {
    data: user,
    isLoading,
    error: queryError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['mining-user', address?.toLowerCase()],
    queryFn: () => fetchMiningUser(address),
    enabled: isConnected && !!address,
    staleTime: 30 * 1000, // Datos frescos por 30 segundos
    refetchInterval: 30 * 1000, // Polling cada 30 segundos
    // Mantener datos anteriores mientras recarga (evita flash)
    placeholderData: (previousData) => previousData,
  });

  // Solo mostrar loading si no hay datos previos
  const loading = isLoading && !user;

  const error = queryError?.message || null;

  // Función para invalidar el cache y refetch
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['mining-user', address?.toLowerCase()] });
  }, [queryClient, address]);

  // Mutation: Registrar usuario
  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/mining/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      refresh();
    },
  });

  // Mutation: Iniciar sesión de minado
  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/mining/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error);
      return data;
    },
    onSuccess: (data) => {
      setLastResult(data);
      refresh();
    },
    onError: (err) => {
      setLastResult({ success: false, error: err.message });
    },
  });

  // Mutation: Reclamar puntos
  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/mining/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error);
      return data;
    },
    onSuccess: (data) => {
      setLastResult(data);
      setLivePoints(0);
      refresh();
    },
    onError: (err) => {
      setLastResult({ success: false, error: err.message });
    },
  });

  // Actualizar puntos y tiempo en tiempo real (cada segundo)
  useEffect(() => {
    const session = user?.session;
    if (!session?.active) {
      setLivePoints(0);
      setLiveRemainingMs(0);
      return;
    }

    const sessionDurationMs = 4 * 60 * 60 * 1000; // 4 horas

    const updateLiveData = () => {
      const startTime = new Date(session.startedAt).getTime();
      const now = Date.now();
      const elapsedMs = now - startTime;

      const effectiveElapsed = Math.min(elapsedMs, sessionDurationMs);
      const points = (effectiveElapsed / 1000) * (session.earningRate?.perSecond || 0);

      setLivePoints(Math.floor(points * 100) / 100);
      setLiveRemainingMs(Math.max(0, sessionDurationMs - elapsedMs));
    };

    updateLiveData();
    const interval = setInterval(updateLiveData, 1000);
    return () => clearInterval(interval);
  }, [user?.session]);

  // Wrappers para mantener compatibilidad con código existente
  const register = useCallback(async () => {
    try {
      await registerMutation.mutateAsync();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [registerMutation]);

  const startSession = useCallback(async () => {
    if (!address) return { success: false, error: 'Not connected' };
    try {
      const data = await startMutation.mutateAsync();
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [address, startMutation]);

  const claimSession = useCallback(async () => {
    if (!address) return { success: false, error: 'Not connected' };
    try {
      const data = await claimMutation.mutateAsync();
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [address, claimMutation]);

  // Helpers derivados
  const session = user?.session || null;
  const hasActiveSession = !!session?.active;
  const canClaim = session?.canClaim || false;
  const sessionComplete = session?.isComplete || false;

  return {
    // User data
    user: user || null,
    loading,
    error,
    isConnected,
    address,

    // Estados de sesión
    session,
    hasActiveSession,
    canClaim,
    sessionComplete,
    livePoints,
    liveRemainingMs,

    // Acciones
    starting: startMutation.isPending,
    claiming: claimMutation.isPending,
    lastResult,
    startSession,
    claimSession,

    // Existentes
    register,
    refresh,

    // Legacy alias
    mining: startMutation.isPending,
    mine: startSession,
  };
}

// Hook ligero para componentes que solo necesitan leer datos (sin acciones)
export function useMiningData() {
  const { address, isConnected } = useAccount();

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['mining-user', address?.toLowerCase()],
    queryFn: () => fetchMiningUser(address),
    enabled: isConnected && !!address,
    // Mantener datos anteriores mientras recarga (evita flash)
    placeholderData: (previousData) => previousData,
  });

  return {
    user: data || null,
    // Solo mostrar loading si no hay datos previos
    loading: isLoading && !data,
    // isFetching indica si está actualizando en background
    refreshing: isFetching && !isLoading,
    error: error?.message || null,
    isConnected,
    address,
  };
}
