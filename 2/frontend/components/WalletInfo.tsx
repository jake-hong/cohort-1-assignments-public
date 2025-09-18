'use client';

import React from 'react';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { formatEther } from 'viem';
import MockERC20ABI from '@/abis/MockERC20.json';
import MiniAMMABI from '@/abis/MiniAMM.json';

export function WalletInfo() {
  const { address, isConnected } = useAccount();
  
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address,
  });

  const { data: tokenABalance, refetch: refetchTokenABalance } = useBalance({
    address,
    token: CONTRACT_ADDRESSES.TokenA,
  });

  const { data: tokenBBalance, refetch: refetchTokenBBalance } = useBalance({
    address,
    token: CONTRACT_ADDRESSES.TokenB,
  });

  // MiniAMM 컨트랙트의 토큰 잔액
  const { data: miniAMMTokenABalance, refetch: refetchMiniAMMTokenABalance } = useReadContract({
    address: CONTRACT_ADDRESSES.TokenA as `0x${string}`,
    abi: MockERC20ABI,
    functionName: 'balanceOf',
    args: [CONTRACT_ADDRESSES.MiniAMM],
  });

  const { data: miniAMMTokenBBalance, refetch: refetchMiniAMMTokenBBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.TokenB as `0x${string}`,
    abi: MockERC20ABI,
    functionName: 'balanceOf',
    args: [CONTRACT_ADDRESSES.MiniAMM],
  });

  // LP token balance
  const { data: lpBalance, refetch: refetchLPBalance } = useBalance({
    address,
    token: CONTRACT_ADDRESSES.MiniAMM,
  });

  // Pool reserves
  const { data: reserveX, refetch: refetchReserveX } = useReadContract({
    address: CONTRACT_ADDRESSES.MiniAMM as `0x${string}`,
    abi: MiniAMMABI,
    functionName: 'xReserve',
  });

  const { data: reserveY, refetch: refetchReserveY } = useReadContract({
    address: CONTRACT_ADDRESSES.MiniAMM as `0x${string}`,
    abi: MiniAMMABI,
    functionName: 'yReserve',
  });

  // 전체 잔액을 새로고침하는 함수
  const refetchAllBalances = () => {
    refetchEthBalance();
    refetchTokenABalance();
    refetchTokenBBalance();
    refetchMiniAMMTokenABalance();
    refetchMiniAMMTokenBBalance();
    refetchLPBalance();
    refetchReserveX();
    refetchReserveY();
  };

  // 글로벌 이벤트 리스너 추가 (다른 컴포넌트에서 트랜잭션 완료 시 호출)
  React.useEffect(() => {
    const handleBalanceUpdate = () => {
      refetchAllBalances();
    };

    window.addEventListener('balanceUpdate', handleBalanceUpdate);
    return () => window.removeEventListener('balanceUpdate', handleBalanceUpdate);
  }, []);

  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold">💼</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Wallet Info</h2>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold">💼</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Wallet Info</h2>
        </div>
        <p className="text-gray-500">Please connect your wallet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold">💼</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Wallet Info</h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600 font-medium">Address:</span>
          <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <span className="text-gray-600 font-medium">C2FLR:</span>
          <span className="font-bold text-blue-600">
            {ethBalance ? Number(formatEther(ethBalance.value)).toFixed(4) : '0.0000'}
          </span>
        </div>

        {/* Wallet Token Balances */}
        <div className="border-t pt-2">
          <div className="text-sm font-bold text-gray-800 mb-2">💳 Wallet Tokens:</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
              <span className="text-gray-800 text-sm font-medium">Token A (TTA):</span>
              <span className="font-bold text-green-600">
                {tokenABalance ? Number(formatEther(tokenABalance.value)).toFixed(2) : '0.00'}
              </span>
            </div>

            <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
              <span className="text-gray-800 text-sm font-medium">Token B (TTB):</span>
              <span className="font-bold text-purple-600">
                {tokenBBalance ? Number(formatEther(tokenBBalance.value)).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* LP Token Balance */}
        <div className="border-t pt-2">
          <div className="text-sm font-bold text-gray-800 mb-2">💎 Your LP Tokens:</div>
          <div className="flex justify-between items-center p-3 bg-indigo-100 rounded-lg">
            <span className="text-gray-800 font-medium">LP Tokens:</span>
            <span className="font-bold text-indigo-700">
              {lpBalance ? Number(formatEther(lpBalance.value)).toFixed(6) : '0.000000'}
            </span>
          </div>
        </div>

        {/* Pool Reserves */}
        <div className="border-t pt-2">
          <div className="text-sm font-bold text-gray-800 mb-2">🏦 Pool Reserves:</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-green-100 rounded-lg">
              <span className="text-gray-800 text-sm font-medium">Token A (TTA):</span>
              <span className="font-bold text-green-700">
                {reserveX ? Number(formatEther(reserveX as bigint)).toFixed(2) : '0.00'}
              </span>
            </div>

            <div className="flex justify-between items-center p-2 bg-purple-100 rounded-lg">
              <span className="text-gray-800 text-sm font-medium">Token B (TTB):</span>
              <span className="font-bold text-purple-700">
                {reserveY ? Number(formatEther(reserveY as bigint)).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}