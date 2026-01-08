'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export function useHasPass() {
  const { address, isConnected } = useAccount();
  const [hasPass, setHasPass] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) {
      setHasPass(false);
      setLoading(false);
      return;
    }

    const checkPass = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/verify-pass?wallet=${address}`);
        const data = await res.json();
        setHasPass(data.hasPass);
      } catch (error) {
        console.error('Error checking pass:', error);
        setHasPass(false);
      }
      setLoading(false);
    };

    checkPass();
  }, [address, isConnected]);

  return { hasPass, loading, address, isConnected };
}
