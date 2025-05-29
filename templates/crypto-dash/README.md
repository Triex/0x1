# 0x1 Crypto Dashboard (pending implementation)

A production-ready crypto dashboard built with the 0x1 Framework, featuring wallet connection, token tracking, and DeFi integrations.

## 🚀 Features

### 🔗 Wallet Integration
- **WalletConnect v2** - Connect with 300+ wallets
- **RainbowKit UI** - Beautiful wallet connection interface
- **Multi-chain Support** - Ethereum, Polygon, Optimism, Arbitrum, Base
- **ENS Integration** - Display ENS names when available

### 💰 Token Management
- **Real-time Balances** - Track ERC-20 token balances
- **Portfolio Overview** - Total portfolio value and 24h changes
- **Price Tracking** - Live token prices (demo with DOGE, USDC, WETH)
- **Transaction History** - Recent wallet activity

### 🎨 Modern UI/UX
- **Dark/Light Themes** - Beautiful theme switching
- **Responsive Design** - Works on desktop and mobile
- **Glass Morphism** - Modern backdrop blur effects
- **Gradient Accents** - Violet/purple color scheme

### ⚡ Performance
- **0x1 Framework** - Lightning-fast with <30KB bundle
- **Bun Runtime** - Ultra-fast development and builds
- **TypeScript** - Full type safety throughout
- **Zero Dependencies** - Minimal external dependencies

## 🛠️ Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0.0 or higher
- A WalletConnect Project ID (optional for demo)

### Installation

1. **Create a new project:**
   ```bash
   0x1 new my-crypto-dashboard --template=crypto-dash
   cd my-crypto-dashboard
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up environment variables (optional):**
   ```bash
   # Create .env.local
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```
   Get your Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)

4. **Start the development server:**
   ```bash
   bun dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### Connecting a Wallet

1. Click the "Connect Wallet" button in the header
2. Choose your preferred wallet from the modal
3. Follow the connection flow in your wallet app
4. Your wallet info and token balances will appear

### Viewing Token Balances

- The dashboard automatically displays balances for supported tokens
- Token prices and 24h changes are shown (demo data)
- Portfolio value is calculated in real-time

### Switching Networks

- Click the network badge in the header
- Select your preferred network from the list
- Your wallet will prompt you to switch networks

## 🔧 Configuration

### Supported Tokens

Edit `lib/config.ts` to add more tokens:

```typescript
export const TOKENS = {
  YOUR_TOKEN: {
    address: '0x...', // Token contract address
    symbol: 'TOKEN',
    name: 'Your Token',
    decimals: 18,
    image: '/tokens/your-token.png',
  },
  // ... more tokens
};
```

### Supported Networks

Add networks in `lib/config.ts`:

```typescript
import { yourChain } from 'wagmi/chains';

const supportedChains: Chain[] = [
  mainnet,
  polygon,
  yourChain, // Add your chain here
  // ... more chains
];
```

### Theme Customization

Modify colors in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#your-color',
          // ... color variations
        }
      }
    }
  }
}
```

## 🏗️ Architecture

### Project Structure

```
crypto-dash/
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout with Web3 providers
│   ├── page.tsx           # Main dashboard page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── CryptoHeader.tsx   # Navigation header
│   ├── WalletConnect.tsx  # Wallet connection components
│   ├── TokenDashboard.tsx # Token balance dashboard
│   └── ThemeToggle.tsx    # Dark/light mode toggle
├── lib/                   # Configuration and utilities
│   ├── config.ts          # Wagmi and chain config
│   └── providers.tsx      # Web3 providers wrapper
└── public/               # Static assets
```

### Key Technologies

- **0x1 Framework** - Ultra-fast TypeScript web framework
- **Wagmi v2** - React hooks for Ethereum
- **RainbowKit** - Beautiful wallet connection UI
- **TanStack Query** - Async state management
- **Tailwind CSS** - Utility-first styling
- **Viem** - TypeScript Ethereum client

## 🔐 Security Notes

- All wallet interactions happen client-side
- Private keys never leave your wallet
- Smart contract calls are read-only by default
- Always verify contract addresses before transactions

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
bun run build
vercel --prod
```

### Other Platforms

```bash
# Build for production
bun run build

# Deploy the dist/ directory to your hosting provider
```

## 🛠️ Development

### Adding New Components

```typescript
// components/MyComponent.tsx
'use client';

import { useAccount } from 'wagmi';

export function MyComponent() {
  const { address, isConnected } = useAccount();
  
  return (
    <div>
      {isConnected ? (
        <p>Connected: {address}</p>
      ) : (
        <p>Please connect wallet</p>
      )}
    </div>
  );
}
```

### Custom Hooks

```typescript
// lib/hooks.ts
import { useBalance } from 'wagmi';

export function useTokenBalance(tokenAddress: string) {
  const { address } = useAccount();
  
  return useBalance({
    address,
    token: tokenAddress,
  });
}
```

## 📚 Resources

- [0x1 Framework Documentation](https://github.com/Triex/0x1)
- [Wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://www.rainbowkit.com)
- [WalletConnect Documentation](https://docs.walletconnect.com)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [0x1 Framework](https://github.com/Triex/0x1)
- Wallet integration powered by [WalletConnect](https://walletconnect.com)
- UI components inspired by [RainbowKit](https://www.rainbowkit.com)
- Icons from [Heroicons](https://heroicons.com)

---

**Ready to build the future of DeFi? Start with 0x1 Crypto Dashboard! 🚀**
