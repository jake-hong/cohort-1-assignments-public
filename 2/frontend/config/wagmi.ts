'use client';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';

export const flareCoston2 = defineChain({
  id: 114,
  name: 'Flare Coston2',
  nativeCurrency: {
    decimals: 18,
    name: 'Coston2 Flare',
    symbol: 'C2FLR',
  },
  rpcUrls: {
    default: {
      http: ['https://flare-testnet-coston2.rpc.thirdweb.com'],
    },
  },
  blockExplorers: {
    default: { name: 'Flare Explorer', url: 'https://coston2-explorer.flare.network' },
  },
  testnet: true,
});

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet],
    },
  ],
  {
    appName: 'MiniAMM DApp',
    projectId: 'dummy', // WalletConnect 없이 사용
  }
);

export const config = createConfig({
  connectors,
  chains: [flareCoston2],
  transports: {
    [flareCoston2.id]: http(),
  },
});