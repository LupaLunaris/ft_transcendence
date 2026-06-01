/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* useApi.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jpaulis <jpaulis@student.42belgium.be        +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jpaulis         #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jpaulis        ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiError } from '@ft/shared';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(fn: () => Promise<T>): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep fn stable across renders without forcing callers to memoize
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fnRef
      .current()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            err && typeof err === 'object' && 'error' in err
              ? (err as ApiError).error
              : 'An unexpected error occurred';
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return { data, loading, error, refetch };
}
