'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // Datos frescos por 30 segundos
      gcTime: 5 * 60 * 1000, // Cache por 5 minutos
      refetchOnWindowFocus: false, // No refetch al volver a la ventana
      retry: 1, // Solo 1 reintento en error
    },
  },
});

// Inner component that uses the theme
function RainbowKitWrapper({ children }) {
  const { theme } = useTheme();

  const rainbowTheme = theme === 'dark'
    ? darkTheme({
        accentColor: '#a5b4fc',
        accentColorForeground: 'black',
        borderRadius: 'large',
        fontStack: 'system',
      })
    : lightTheme({
        accentColor: '#6366f1',
        accentColorForeground: 'white',
        borderRadius: 'large',
        fontStack: 'system',
      });

  return (
    <RainbowKitProvider theme={rainbowTheme}>
      {children}
    </RainbowKitProvider>
  );
}

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitWrapper>
            {children}
          </RainbowKitWrapper>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
