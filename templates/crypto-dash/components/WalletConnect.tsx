'use client';

import { useEffect, useState } from '0x1';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useEnsName } from 'wagmi';

// Utility function to shorten wallet addresses
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// RESTORED: Proper ConnectButton.Custom implementation for wallet functionality
export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
    );
  }

  // CRITICAL: Use ConnectButton.Custom render prop pattern - this is how RainbowKit works
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted: rainbowMounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && rainbowMounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 20,
                          height: 20,
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 20, height: 20, maxHeight: "20px" }}
                          />
                        )}
                      </div>
                    )}
                    <span className="text-sm font-medium">{chain.name}</span>
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <span className="text-sm font-medium">
                      {shortenAddress(account.address)}
                    </span>
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

// Enhanced wallet info component
export function WalletInfo() {
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({
    address,
  });
  const { data: ensName } = useEnsName({ address });
  // const { data: balance, isLoading: balanceLoading } = useBalance({ address });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isConnected || !address) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Wallet Information
      </h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Address
          </label>
          <p className="font-mono text-sm font-medium">
            {ensName || shortenAddress(address)}
          </p>
        </div>

        {balance && (
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Balance
            </label>
            <p className="font-medium">
              {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
            </p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Network
          </label>
          <div className="flex items-center gap-2">
            {/* {chain?.iconUrl && (
              <img
                src={chain.iconUrl}
                alt={chain.name}
                className="w-5 h-5 rounded-full"
              />
            )} */}
            <p className="font-medium">{chain?.name}</p>
          </div>
        </div>
        {/* <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Balance
          </label>
          {balanceLoading ? (
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-5 w-24 rounded"></div>
          ) : (
            <p className="font-medium">
              {balance?.formatted
                ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
                : "0.0000 ETH"}
            </p>
          )}
        </div> */}
      </div>
    </div>
  );
} 