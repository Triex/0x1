/**
 * Token Dashboard Page - Dedicated dashboard with detailed token analytics
 */

import { TokenDashboard } from '../../components/TokenDashboard';
import { WalletInfo } from '../../components/WalletConnect';

export const metadata = {
  title: "Dashboard - 0x1 Crypto Dashboard",
  description: "View your token balances, portfolio analytics, and wallet information.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Your Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Monitor your portfolio, track token balances, and manage your crypto assets.
        </p>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Token Dashboard - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <TokenDashboard />
        </div>

        {/* Wallet Info Sidebar */}
        <div className="space-y-6">
          <WalletInfo />
          
          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Tokens</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Active Networks</span>
                <span className="font-medium">6</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Last Update</span>
                <span className="font-medium text-green-600 dark:text-green-400">Live</span>
              </div>
            </div>
          </div>

          {/* Featured Token Spotlight */}
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="font-bold text-sm">🐕</span>
              </div>
              <div>
                <h3 className="font-bold">DOGE</h3>
                <p className="text-sm text-yellow-100">Dogecoin</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-yellow-100 text-sm">Current Price</span>
                <span className="font-bold">$0.083</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-100 text-sm">24h Change</span>
                <span className="font-bold text-green-200">+2.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-100 text-sm">Market Cap</span>
                <span className="font-bold">$11.8B</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-yellow-300/30">
              <p className="text-xs text-yellow-100">
                🚀 Much wow! DOGE to the moon! Such coin, very crypto!
              </p>
            </div>
          </div>

          {/* Network Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Network Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Ethereum</span>
                </div>
                <span className="text-xs text-green-600 dark:text-green-400">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Polygon</span>
                </div>
                <span className="text-xs text-green-600 dark:text-green-400">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Optimism</span>
                </div>
                <span className="text-xs text-yellow-600 dark:text-yellow-400">Degraded</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
