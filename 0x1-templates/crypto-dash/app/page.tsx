/**
 * 0x1 Crypto Dashboard - Landing Page
 * Welcome page that introduces the dashboard and encourages wallet connection
 */

import Link from '0x1/link';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center py-16 bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 rounded-2xl text-white shadow-xl">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Welcome to <span className="text-yellow-300">0x1</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              Crypto Dashboard
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-violet-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            The fastest, most intuitive crypto portfolio tracker built with cutting-edge Web3 technology. 
            Track your tokens, monitor DeFi positions, and manage your digital assets—all in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link 
              href="/dashboard" 
              className="bg-white text-violet-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🚀 Launch Dashboard
            </Link>
            <a 
              href="https://github.com/Triex/0x1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-violet-600 transition-all duration-200"
            >
              ⭐ Star on GitHub
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl px-6 py-4 hover:bg-white/20 transition-colors">
              <div className="text-3xl font-bold">6+</div>
              <div className="text-sm text-violet-200">Supported Chains</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl px-6 py-4 hover:bg-white/20 transition-colors">
              <div className="text-3xl font-bold">300+</div>
              <div className="text-sm text-violet-200">Wallet Connections</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl px-6 py-4 hover:bg-white/20 transition-colors">
              <div className="text-3xl font-bold">&lt;30KB</div>
              <div className="text-sm text-violet-200">Bundle Size</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Everything you need for crypto
          </h2>
          <p className="text-xl max-w-2xl mx-auto opacity-80">
            Built with the 0x1 Framework for lightning-fast performance and Web3-native features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="card rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Token Swapping</h3>
            <p className="opacity-80">
              Seamlessly swap between different tokens with the best rates across multiple DEXs and bridges.
            </p>
          </div>

          <div className="card rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Portfolio Analytics</h3>
            <p className="opacity-80">
              Advanced portfolio tracking with detailed analytics, performance metrics, and profit/loss insights.
            </p>
          </div>

          <div className="card rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Secure Wallet</h3>
            <p className="opacity-80">
              Connect securely with WalletConnect v2 integration supporting 300+ wallets and hardware devices.
            </p>
          </div>

          <div className="card rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">NFT Collection</h3>
            <p className="opacity-80">
              View and manage your NFT collection with rich metadata, floor prices, and marketplace integration.
            </p>
          </div>

          <div className="card rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">DeFi Protocols</h3>
            <p className="opacity-80">
              Access popular DeFi protocols for lending, borrowing, yield farming, and liquidity provision.
            </p>
          </div>

          <div className="card rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
            <p className="opacity-80">
              Built with 0x1 Framework for maximum performance, sub-second loading, and minimal bundle size.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="card container-gradient rounded-2xl p-12 text-center shadow-xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
          Ready to take control of your crypto?
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto opacity-75">
          Connect your wallet and start tracking your portfolio with the most advanced crypto dashboard.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          🚀 Launch Dashboard
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
