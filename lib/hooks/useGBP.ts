/**
 * useGBP — React hook for fetching real GBP data
 *
 * Usage in components:
 *
 *   const { client, loading, error, isConnected, connectGoogle, refresh } = useGBP(accountId, locationId);
 *
 *   // client is already in Zenith format — pass directly to calcScores(), etc.
 *   const scores = calcScores(client);
 */

'use client';

import { useState, useCallback } from 'react';

interface UseGBPReturn {
  // Data
  accounts: any[] | null;
  locations: any[] | null;
  client: any | null;

  // State
  loading: boolean;
  error: string | null;
  isConnected: boolean;

  // Actions
  connectGoogle: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchLocations: (accountId: string) => Promise<void>;
  fetchProfile: (accountId: string, locationId: string) => Promise<any>;
  refresh: () => Promise<void>;
}

async function gbpApi(action: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams({ action, ...params });
  const res = await fetch(`/api/gbp?${query.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    throw { status: res.status, code: data.code, message: data.error };
  }

  return data;
}

export function useGBP(): UseGBPReturn {
  const [accounts, setAccounts] = useState<any[] | null>(null);
  const [locations, setLocations] = useState<any[] | null>(null);
  const [client, setClient] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true); // assume connected until proven otherwise

  const [lastAccount, setLastAccount] = useState<string>('');
  const [lastLocation, setLastLocation] = useState<string>('');

  const connectGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/gbp/connect', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gbpApi('accounts');
      setAccounts(data.accounts);
      setIsConnected(true);
    } catch (e: any) {
      if (e.code === 'NO_GOOGLE_AUTH') {
        setIsConnected(false);
      }
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLocations = useCallback(async (accountId: string) => {
    try {
      setLoading(true);
      setError(null);
      setLastAccount(accountId);
      const data = await gbpApi('locations', { accountId });
      setLocations(data.locations);
    } catch (e: any) {
      if (e.code === 'NO_GOOGLE_AUTH') setIsConnected(false);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async (accountId: string, locationId: string) => {
    try {
      setLoading(true);
      setError(null);
      setLastAccount(accountId);
      setLastLocation(locationId);
      const data = await gbpApi('profile', { accountId, locationId });
      setClient(data.client);
      return data.client;
    } catch (e: any) {
      if (e.code === 'NO_GOOGLE_AUTH') setIsConnected(false);
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (lastAccount && lastLocation) {
      await fetchProfile(lastAccount, lastLocation);
    }
  }, [lastAccount, lastLocation, fetchProfile]);

  return {
    accounts,
    locations,
    client,
    loading,
    error,
    isConnected,
    connectGoogle,
    fetchAccounts,
    fetchLocations,
    fetchProfile,
    refresh,
  };
}
