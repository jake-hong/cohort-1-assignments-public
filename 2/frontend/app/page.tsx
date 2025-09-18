'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { WalletInfo } from '@/components/WalletInfo';
import { TokenMinter } from '@/components/TokenMinter';
import { SwapInterface } from '@/components/SwapInterface';
import { LiquidityInterface } from '@/components/LiquidityInterface';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MiniAMM DApp
            </h1>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            MiniAMM DeFi Platform
          </h2>
          <p className="text-gray-600 text-lg">
            Faucet • Swap • Liquidity Pool on Flare Coston2 Testnet
          </p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <WalletInfo />
            <TokenMinter />
          </div>

          {/* Middle Column */}
          <div>
            <SwapInterface />
          </div>

          {/* Right Column */}
          <div>
            <LiquidityInterface />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Built on Flare Coston2 Testnet • MiniAMM DeFi Platform</p>
        </div>
      </main>
    </div>
  );
}