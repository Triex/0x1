'use client';

import { Chain, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { cookieStorage, createStorage, http } from 'wagmi';
import { arbitrum, base, mainnet, optimism, polygon, sepolia } from 'wagmi/chains';

// WalletConnect Project ID - In production, this should be from environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// Define supported chains for the crypto dashboard
const supportedChains: Chain[] = [
  mainnet,     // Ethereum mainnet for DOGE and other ERC-20 tokens
  polygon,     // Polygon for cheaper transactions
  optimism,    // Optimism L2
  arbitrum,    // Arbitrum L2
  base,        // Base L2
  sepolia,     // Testnet for development
];

// Wagmi configuration with RainbowKit integration
export const config = getDefaultConfig({
  appName: '0x1 Crypto Dashboard',
  projectId,
  chains: supportedChains as any,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: supportedChains.reduce(
    (obj, chain) => ({ ...obj, [chain.id]: http() }), 
    {}
  ),
});

// Token configurations for the dashboard
export const TOKENS = {
  DOGE: {
    address: '0x4206931337dc273a630d328dA6441786BfaD668f' as `0x${string}`, // DOGE on Ethereum
    symbol: 'DOGE',
    name: 'Dogecoin',
    decimals: 8,
    image: '/tokens/doge.png',
  },
  USDC: {
    address: '0xA0b86a33E6441d2E619fd063e5b01C1e49B2ed31' as `0x${string}`, // USDC on Ethereum
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    image: '/tokens/usdc.png',
  },
  WETH: {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`, // WETH on Ethereum
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    decimals: 18,
    image: '/tokens/weth.png',
  },
} as const;

// Chain configurations
export const CHAIN_INFO = {
  [mainnet.id]: {
    name: 'Ethereum',
    shortName: 'ETH',
    color: '#627eea',
    icon: '/chains/ethereum.svg',
  },
  [polygon.id]: {
    name: 'Polygon',
    shortName: 'MATIC',
    color: '#8247e5',
    icon: '/chains/polygon.svg',
  },
  [optimism.id]: {
    name: 'Optimism',
    shortName: 'OP',
    color: '#ff0420',
    icon: '/chains/optimism.svg',
  },
  [arbitrum.id]: {
    name: 'Arbitrum',
    shortName: 'ARB',
    color: '#28a0f0',
    icon: '/chains/arbitrum.svg',
  },
  [base.id]: {
    name: 'Base',
    shortName: 'BASE',
    color: '#0052ff',
    icon: '/chains/base.svg',
  },
  [sepolia.id]: {
    name: 'Sepolia',
    shortName: 'SEP',
    color: '#ffc107',
    icon: '/chains/ethereum.svg',
  },
} as const; 