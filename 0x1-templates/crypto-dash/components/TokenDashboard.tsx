'use client';

import { useEffect, useState } from '0x1';
import { formatUnits } from 'viem';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { TOKENS } from '../lib/config';

// Mock price data - in production, this would come from a real API
const MOCK_PRICES = {
  DOGE: { price: 0.083, change24h: 2.5 },
  USDC: { price: 1.00, change24h: 0.1 },
  WETH: { price: 2380.45, change24h: -1.2 },
  ETH: { price: 2380.45, change24h: -1.2 },
};

// ERC-20 ABI for balance reading
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const;

// Token balance component
function TokenBalance({ token, userAddress }: { token: typeof TOKENS.DOGE; userAddress: string }) {
  const { data: tokenBalance } = useReadContract({
    address: token.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`],
  });

  const balance = tokenBalance ? formatUnits(tokenBalance, token.decimals) : '0';
  const price = MOCK_PRICES[token.symbol as keyof typeof MOCK_PRICES]?.price || 0;
  const change24h = MOCK_PRICES[token.symbol as keyof typeof MOCK_PRICES]?.change24h || 0;
  const value = parseFloat(balance) * price;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">{token.symbol.slice(0, 2)}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{token.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{token.symbol}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">${price.toFixed(token.symbol === 'USDC' ? 2 : 4)}</p>
          <p className={`text-sm ${change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Balance</span>
          <span className="font-medium">{parseFloat(balance).toFixed(4)} {token.symbol}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Value</span>
          <span className="font-medium">${value.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// Portfolio overview component
function PortfolioOverview({ userAddress }: { userAddress: string }) {
  const { data: ethBalance } = useBalance({ address: userAddress as `0x${string}` });
  
  // Calculate total portfolio value (mock calculation)
  const ethValue = ethBalance ? parseFloat(ethBalance.formatted) * (MOCK_PRICES.ETH?.price || 0) : 0;
  const totalValue = ethValue; // In real app, add all token values

  return (
    <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl p-6 text-white shadow-xl">
      <h2 className="text-xl font-bold mb-2">Portfolio Overview</h2>
      <div className="space-y-3">
        <div>
          <p className="text-violet-200 text-sm">Total Portfolio Value</p>
          <p className="text-3xl font-bold">${totalValue.toFixed(2)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-violet-200 text-sm">24h Change</p>
            <p className="text-lg font-semibold text-green-300">+$127.45</p>
          </div>
          <div>
            <p className="text-violet-200 text-sm">24h Change %</p>
            <p className="text-lg font-semibold text-green-300">+2.1%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main dashboard component
export function TokenDashboard() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isConnected || !address) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Connect your wallet to view your token balances, portfolio value, and manage your crypto assets.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <PortfolioOverview userAddress={address} />

      {/* Token Balances Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Token Balances</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(TOKENS).map((token) => (
            <TokenBalance
              key={token.symbol}
              token={token}
              userAddress={address}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Received DOGE</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">2 hours ago</p>
              </div>
            </div>
            <p className="font-semibold">+1,000 DOGE</p>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Swapped ETH for USDC</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">1 day ago</p>
              </div>
            </div>
            <p className="font-semibold">0.5 ETH → 1,190 USDC</p>
          </div>
        </div>
      </div>
    </div>
  );
} 