'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { parseEther, formatEther } from 'viem';
import MockERC20ABI from '@/abis/MockERC20.json';
import MiniAMMABI from '@/abis/MiniAMM.json';

export function LiquidityInterface() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');
  
  // Add liquidity
  const [tokenAAmount, setTokenAAmount] = useState('');
  const [tokenBAmount, setTokenBAmount] = useState('');
  
  // Remove liquidity
  const [lpTokenAmount, setLpTokenAmount] = useState('');
  const [isMounted, setIsMounted] = React.useState(false);
  
  // Approval states
  const [currentApproveStep, setCurrentApproveStep] = useState<'tokenA' | 'tokenB' | 'ready'>('ready');
  const [showSuccessMessage, setShowSuccessMessage] = useState<'approve' | 'liquidity' | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // LP token balance
  const { data: lpBalance } = useBalance({
    address,
    token: CONTRACT_ADDRESSES.MiniAMM,
  });

  // Token A allowance
  const { data: tokenAAllowance, refetch: refetchTokenAAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.TokenA as `0x${string}`,
    abi: MockERC20ABI,
    functionName: 'allowance',
    args: [address, CONTRACT_ADDRESSES.MiniAMM],
  });

  // Token B allowance  
  const { data: tokenBAllowance, refetch: refetchTokenBAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.TokenB as `0x${string}`,
    abi: MockERC20ABI,
    functionName: 'allowance',
    args: [address, CONTRACT_ADDRESSES.MiniAMM],
  });

  // Contract function calls
  const { 
    writeContract, 
    data: hash,
    isPending: isWritePending 
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // 트랜잭션 완료 시 잔액 업데이트 이벤트 발생
  React.useEffect(() => {
    if (isSuccess) {
      window.dispatchEvent(new Event('balanceUpdate'));
      refetchTokenAAllowance();
      refetchTokenBAllowance();
      
      // If we just approved a token, move to next step
      if (currentApproveStep === 'tokenA') {
        setShowSuccessMessage('approve');
        setTimeout(() => setShowSuccessMessage(null), 2000);
        
        // Check if we need to approve Token B next
        if (tokenBAmount && tokenBAllowance !== undefined && tokenBAllowance !== null) {
          try {
            const amountB = parseEther(tokenBAmount);
            const needsB = amountB > (tokenBAllowance as bigint);
            if (needsB) {
              setCurrentApproveStep('tokenB');
            } else {
              setCurrentApproveStep('ready');
            }
          } catch {
            setCurrentApproveStep('tokenB');
          }
        } else {
          setCurrentApproveStep('ready');
        }
      } else if (currentApproveStep === 'tokenB') {
        setShowSuccessMessage('approve');
        setTimeout(() => setShowSuccessMessage(null), 2000);
        setCurrentApproveStep('ready');
      } else {
        // This was a liquidity transaction
        setShowSuccessMessage('liquidity');
        setTimeout(() => setShowSuccessMessage(null), 3000);
      }
    }
  }, [isSuccess, currentApproveStep, tokenBAmount, tokenBAllowance, refetchTokenAAllowance, refetchTokenBAllowance]);

  // Check allowances
  useEffect(() => {
    if (!tokenAAmount || !tokenBAmount) {
      setCurrentApproveStep('ready');
      return;
    }

    // Check if allowances exist and are sufficient
    const tokenAAllowanceExists = tokenAAllowance !== undefined && tokenAAllowance !== null;
    const tokenBAllowanceExists = tokenBAllowance !== undefined && tokenBAllowance !== null;

    try {
      const amountA = parseEther(tokenAAmount);
      const amountB = parseEther(tokenBAmount);
      
      // Check if approvals are needed
      const needsA = !tokenAAllowanceExists || amountA > (tokenAAllowance as bigint);
      const needsB = !tokenBAllowanceExists || amountB > (tokenBAllowance as bigint);
      
      // Set current step
      if (needsA) {
        setCurrentApproveStep('tokenA');
      } else if (needsB) {
        setCurrentApproveStep('tokenB');
      } else {
        setCurrentApproveStep('ready');
      }
    } catch (error) {
      setCurrentApproveStep('tokenA');
    }
  }, [tokenAAmount, tokenBAmount, tokenAAllowance, tokenBAllowance]);

  // Smart approve/add liquidity handler
  const handleSmartLiquidity = async () => {
    if (!tokenAAmount || !tokenBAmount) {
      return;
    }

    try {
      if (currentApproveStep === 'tokenA') {
        // Approve Token A
        writeContract({
          address: CONTRACT_ADDRESSES.TokenA as `0x${string}`,
          abi: MockERC20ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.MiniAMM, parseEther(tokenAAmount)],
        });
      } else if (currentApproveStep === 'tokenB') {
        // Approve Token B
        writeContract({
          address: CONTRACT_ADDRESSES.TokenB as `0x${string}`,
          abi: MockERC20ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.MiniAMM, parseEther(tokenBAmount)],
        });
      } else {
        // Add liquidity
        writeContract({
          address: CONTRACT_ADDRESSES.MiniAMM as `0x${string}`,
          abi: MiniAMMABI,
          functionName: 'addLiquidity',
          args: [parseEther(tokenAAmount), parseEther(tokenBAmount)],
        });
      }
    } catch (error) {
      // Error handling can be done through transaction receipts
    }
  };


  // Remove liquidity
  const handleRemoveLiquidity = async () => {
    if (!lpTokenAmount) {
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.MiniAMM as `0x${string}`,
        abi: MiniAMMABI,
        functionName: 'removeLiquidity',
        args: [parseEther(lpTokenAmount)],
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
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold">💧</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Liquidity Pool</h2>
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
        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold">💧</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Liquidity Pool</h2>
      </div>

      <div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'add'
              ? 'bg-white text-indigo-600 shadow-md'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          ➕ Add Liquidity
        </button>
        <button
          onClick={() => setActiveTab('remove')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'remove'
              ? 'bg-white text-indigo-600 shadow-md'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          ➖ Remove Liquidity
        </button>
      </div>

      {activeTab === 'add' ? (
        <div className="space-y-6">
          {/* Token A Input */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">
              Token A (TTA) Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={tokenAAmount}
                onChange={(e) => setTokenAAmount(e.target.value)}
                className="w-full px-4 py-4 pr-16 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg bg-green-50 text-gray-900 placeholder-gray-600"
                style={{
                  WebkitAppearance: 'textfield',
                  MozAppearance: 'textfield'
                }}
                placeholder="0.0"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-700 font-bold">
                TTA
              </div>
            </div>
          </div>

          {/* Token B Input */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">
              Token B (TTB) Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={tokenBAmount}
                onChange={(e) => setTokenBAmount(e.target.value)}
                className="w-full px-4 py-4 pr-16 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg bg-purple-50 text-gray-900 placeholder-gray-600"
                style={{
                  WebkitAppearance: 'textfield',
                  MozAppearance: 'textfield'
                }}
                placeholder="0.0"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-700 font-bold">
                TTB
              </div>
            </div>
          </div>

          {/* Smart Liquidity Button */}
          <button
            onClick={handleSmartLiquidity}
            disabled={!isConnected || isLoading || !tokenAAmount || !tokenBAmount}
            className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-white ${
              showSuccessMessage === 'approve' || showSuccessMessage === 'liquidity' 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed'
            }`}
          >
            {showSuccessMessage === 'approve' ? (
              <div className="flex items-center justify-center">
                <span className="mr-2">✅</span>
                Approved Successfully!
              </div>
            ) : showSuccessMessage === 'liquidity' ? (
              <div className="flex items-center justify-center">
                <span className="mr-2">🎉</span>
                Liquidity Added Successfully!
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing...
              </div>
            ) : currentApproveStep === 'tokenA' ? (
              '🟢 Approve Token A'
            ) : currentApproveStep === 'tokenB' ? (
              '🟣 Approve Token B'
            ) : (
              '💧 Add Liquidity'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* LP Token Balance */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4 rounded-xl">
            <div className="text-sm font-bold text-gray-800 mb-2">💎 Your LP Tokens</div>
            <div className="text-2xl font-bold text-indigo-600">
              {lpBalance ? Number(formatEther(lpBalance.value)).toFixed(6) : '0.000000'}
            </div>
            <div className="text-xs text-gray-700 font-medium mt-1">Liquidity Provider Tokens</div>
          </div>

          {/* LP Token Amount Input */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">
              LP Tokens to Remove
            </label>
            <div className="relative">
              <input
                type="number"
                value={lpTokenAmount}
                onChange={(e) => setLpTokenAmount(e.target.value)}
                className="w-full px-4 py-4 pr-16 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg bg-red-50 text-gray-900 placeholder-gray-600"
                style={{
                  WebkitAppearance: 'textfield',
                  MozAppearance: 'textfield'
                }}
                placeholder="0.0"
                max={lpBalance ? formatEther(lpBalance.value) : '0'}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-700 font-bold">
                LP
              </div>
            </div>
          </div>

          {/* Max Button */}
          <button
            onClick={() => {
              if (lpBalance) {
                setLpTokenAmount(formatEther(lpBalance.value));
              }
            }}
            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
          >
            🔄 Set Max
          </button>

          {/* Remove Liquidity Button */}
          <button
            onClick={handleRemoveLiquidity}
            disabled={!isConnected || isLoading || !lpTokenAmount}
            className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-white ${
              showSuccessMessage === 'liquidity' 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed'
            }`}
          >
            {showSuccessMessage === 'liquidity' ? (
              <div className="flex items-center justify-center">
                <span className="mr-2">🎉</span>
                Liquidity Removed Successfully!
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing...
              </div>
            ) : (
              '🔥 Remove Liquidity'
            )}
          </button>
        </div>
      )}

      {!isConnected && (
        <div className="text-center py-4 px-6 bg-yellow-50 border border-yellow-200 rounded-xl mt-6">
          <p className="text-yellow-700 font-bold">
            Please connect your wallet.
          </p>
        </div>
      )}
    </div>
  );
}