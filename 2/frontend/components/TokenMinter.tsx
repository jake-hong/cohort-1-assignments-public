'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { parseEther } from 'viem';
import MockERC20ABI from '@/abis/MockERC20.json';

export function TokenMinter() {
  const { address, isConnected } = useAccount();
  const [mintAmount, setMintAmount] = useState('1000');
  const [selectedToken, setSelectedToken] = useState<'A' | 'B'>('A');
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const { 
    writeContract, 
    data: hash,
    isPending: isWritePending 
  } = useWriteContract();

  const { 
    isLoading: isConfirming,
    isSuccess 
  } = useWaitForTransactionReceipt({ 
    hash 
  });

  // 트랜잭션 완료 시 잔액 업데이트 이벤트 발생
  React.useEffect(() => {
    if (isSuccess) {
      window.dispatchEvent(new Event('balanceUpdate'));
    }
  }, [isSuccess]);

  const mintTokens = async () => {
    if (!isConnected || !address) {
      return;
    }

    const tokenAddress = selectedToken === 'A' ? CONTRACT_ADDRESSES.TokenA : CONTRACT_ADDRESSES.TokenB;
    
    try {
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: MockERC20ABI,
        functionName: 'freeMintTo',
        args: [parseEther(mintAmount), address],
      });
    } catch (error) {
      // Error handling can be done through transaction receipts
    }
  };

  const isLoading = isWritePending || isConfirming;

  if (!isMounted) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold">🚰</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Token Faucet</h2>
        </div>
        <div className="text-center py-4 px-6 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-gray-700 font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold">🚰</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Token Faucet</h2>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-3">
            Select Token
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
              selectedToken === 'A' 
                ? 'border-green-500 bg-green-50 text-green-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                value="A"
                checked={selectedToken === 'A'}
                onChange={(e) => setSelectedToken(e.target.value as 'A' | 'B')}
                className="mr-2 text-green-500"
              />
              <span className="font-medium">Token A (TTA)</span>
            </label>
            <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
              selectedToken === 'B' 
                ? 'border-purple-500 bg-purple-50 text-purple-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                value="B"
                checked={selectedToken === 'B'}
                onChange={(e) => setSelectedToken(e.target.value as 'A' | 'B')}
                className="mr-2 text-purple-500"
              />
              <span className="font-medium">Token B (TTB)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-800 mb-3">
            Amount to Mint
          </label>
          <div className="relative">
            <input
              type="number"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900 placeholder-gray-600"
              placeholder="1000"
              style={{
                WebkitAppearance: 'textfield',
                MozAppearance: 'textfield'
              }}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">
              {selectedToken === 'A' ? 'TTA' : 'TTB'}
            </div>
          </div>
        </div>

        <button
          onClick={mintTokens}
          disabled={!isConnected || isLoading || !mintAmount}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            selectedToken === 'A'
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
              : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
          } text-white disabled:bg-gray-400 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            `Mint Token ${selectedToken}`
          )}
        </button>

        {!isConnected && (
          <div className="text-center py-3 px-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-600">
              Please connect your wallet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}