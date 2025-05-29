'use client';

import { JSXNode } from '0x1';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { State, WagmiProvider } from 'wagmi';
import { config } from './config';

// Import RainbowKit styles
import '@rainbow-me/rainbowkit/styles.css';

// Create a stable query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

export function Web3Provider({
  children,
  initialState,
}: {
  children: JSXNode;
  initialState?: State;
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={{
            lightMode: lightTheme({
              accentColor: "#7c3aed",
              accentColorForeground: "white",
              borderRadius: "medium",
              fontStack: "system",
            }),
            darkMode: darkTheme({
              accentColor: "#a78bfa",
              accentColorForeground: "white",
              borderRadius: "medium",
              fontStack: "system",
            }),
          }}
          showRecentTransactions={true}
          appInfo={{
            appName: "0x1 Crypto Dashboard",
            learnMoreUrl: "https://github.com/Triex/0x1",
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 