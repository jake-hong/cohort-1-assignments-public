'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { parseEther, formatEther } from 'viem';
import MockERC20ABI from '@/abis/MockERC20.json';
import MiniAMMABI from '@/abis/MiniAMM.json';

export function SwapInterface() {
  const { address, isConnected } = useAccount();
  const [fromToken, setFromToken] = useState<'A' | 'B'>('A');
  const [toToken, setToToken] = useState<'A' | 'B'>('B');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<'approve' | 'swap' | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // 토큰 주소 결정
  const fromTokenAddress = fromToken === 'A' ? CONTRACT_ADDRESSES.TokenA : CONTRACT_ADDRESSES.TokenB;

  // MiniAMM 컨트랙트의 토큰 잔고 읽기 (유동성 풀)
  const { data: reserveX } = useReadContract({
    address: CONTRACT_ADDRESSES.MiniAMM as `0x${string}`,
    abi: MiniAMMABI,
    functionName: 'xReserve',
  });

  const { data: reserveY } = useReadContract({
    address: CONTRACT_ADDRESSES.MiniAMM as `0x${string}`,
    abi: MiniAMMABI,
    functionName: 'yReserve',
  });

  // 사용자의 토큰 승인 상태 확인
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: fromTokenAddress as `0x${string}`,
    abi: MockERC20ABI,
    functionName: 'allowance',
    args: [address, CONTRACT_ADDRESSES.MiniAMM],
  });

  // 토큰 승인
  const { 
    writeContract: approveToken, 
    data: approveHash,
    isPending: isApprovePending 
  } = useWriteContract();

  // 스왑 실행
  const { 
    writeContract: executeSwap, 
    data: swapHash,
    isPending: isSwapPending 
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess, isError: isApproveError, error: approveError } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isSwapConfirming, isSuccess: isSwapSuccess, isError: isSwapError, error: swapError } = useWaitForTransactionReceipt({ hash: swapHash });
  

  // 트랜잭션 완료 시 잔액 업데이트 이벤트 발생
  React.useEffect(() => {
    if (isApproveSuccess) {
      window.dispatchEvent(new Event('balanceUpdate'));
      refetchAllowance(); // 승인 완료 후 allowance 새로고침
      setShowSuccessMessage('approve');
      // 3초 후 메시지 숨김
      setTimeout(() => setShowSuccessMessage(null), 3000);
    }
  }, [isApproveSuccess, refetchAllowance]);

  React.useEffect(() => {
    if (isSwapSuccess) {
      window.dispatchEvent(new Event('balanceUpdate'));
      setShowSuccessMessage('swap');
      // 3초 후 메시지 숨김
      setTimeout(() => setShowSuccessMessage(null), 3000);
    }
  }, [isSwapSuccess]);

  // 스왑 예상 수량 계산 (x * y = k 공식)
  useEffect(() => {
    if (!fromAmount || !reserveX || !reserveY) {
      setToAmount('');
      return;
    }

    try {
      const inputAmount = parseEther(fromAmount);
      let outputAmount: bigint;

      if (fromToken === 'A') {
        // Token A -> Token B (X -> Y)
        // y_out = (y * x_in * 997) / (x * 1000 + x_in * 997)
        const numerator = (reserveY as bigint) * inputAmount * 997n;
        const denominator = (reserveX as bigint) * 1000n + inputAmount * 997n;
        outputAmount = numerator / denominator;
      } else {
        // Token B -> Token A (Y -> X)
        // x_out = (x * y_in * 997) / (y * 1000 + y_in * 997)
        const numerator = (reserveX as bigint) * inputAmount * 997n;
        const denominator = (reserveY as bigint) * 1000n + inputAmount * 997n;
        outputAmount = numerator / denominator;
      }

      const calculatedAmount = Number(formatEther(outputAmount)).toFixed(6);
      setToAmount(calculatedAmount);
    } catch (error) {
      setToAmount('');
    }
  }, [fromAmount, reserveX, reserveY, fromToken]);

  // 승인 필요 여부 확인
  useEffect(() => {
    if (!fromAmount || !allowance) {
      setNeedsApproval(true);
      return;
    }
    
    try {
      const inputAmount = parseEther(fromAmount);
      const needsApprovalValue = inputAmount > (allowance as bigint);
      setNeedsApproval(needsApprovalValue);
    } catch (error) {
      setNeedsApproval(true);
    }
  }, [fromAmount, allowance]);

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
    setToAmount('');
  };

  const handleApprove = async () => {
    if (!fromAmount) {
      return;
    }

    try {
      const approveAmount = parseEther(fromAmount);
      
      approveToken({
        address: fromTokenAddress as `0x${string}`,
        abi: MockERC20ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.MiniAMM, approveAmount],
      });
    } catch (error) {
      // Error handling can be done through transaction receipts
    }
  };

  const handleSwap = async () => {
    if (!fromAmount || !toAmount) {
      return;
    }

    try {
      const amountIn = parseEther(fromAmount);
      
      // Token A = tokenX, Token B = tokenY로 확정
      const swapArgs: [bigint, bigint] = fromToken === 'A' 
        ? [amountIn, 0n]  // Token A -> Token B (xAmountIn, 0)
        : [0n, amountIn]; // Token B -> Token A (0, yAmountIn)
      
      executeSwap({
        address: CONTRACT_ADDRESSES.MiniAMM as `0x${string}`,
        abi: MiniAMMABI,
        functionName: 'swap',
        args: swapArgs,
      });
    } catch (error) {
      // Error handling can be done through transaction receipts
    }
  };

  const isLoading = isApprovePending || isApproveConfirming || isSwapPending || isSwapConfirming;

  if (!isMounted) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold">⚡</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Token Swap</h2>
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
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold">⚡</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Token Swap</h2>
      </div>
      
      <div className="space-y-4">
        {/* From Token */}
        <div className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-r from-gray-50 to-blue-50 hover:border-blue-300 transition-colors">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-gray-800">From</span>
            <select
              value={fromToken}
              onChange={(e) => {
                const newFromToken = e.target.value as 'A' | 'B';
                setFromToken(newFromToken);
                setToToken(newFromToken === 'A' ? 'B' : 'A');
                setFromAmount('');
                setToAmount('');
              }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="A">Token A (TTA)</option>
              <option value="B">Token B (TTB)</option>
            </select>
          </div>
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0.0"
            className="w-full text-3xl font-bold bg-transparent border-none outline-none text-gray-900 placeholder-gray-600 pr-4"
            style={{
              WebkitAppearance: 'textfield',
              MozAppearance: 'textfield'
            }}
          />
        </div>

        {/* Switch Button */}
        <div className="flex justify-center">
          <button
            onClick={switchTokens}
            className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
            </svg>
          </button>
        </div>

        {/* To Token */}
        <div className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-r from-purple-50 to-pink-50 hover:border-purple-300 transition-colors">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-gray-800">To</span>
            <select
              value={toToken}
              onChange={(e) => {
                const newToToken = e.target.value as 'A' | 'B';
                setToToken(newToToken);
                setFromToken(newToToken === 'A' ? 'B' : 'A');
                setFromAmount('');
                setToAmount('');
              }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="A">Token A (TTA)</option>
              <option value="B">Token B (TTB)</option>
            </select>
          </div>
          <div className="text-3xl font-bold text-gray-800">
            {toAmount || '0.0'}
          </div>
        </div>


        {/* Pool Info */}
        {reserveX && reserveY && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 p-4 rounded-xl">
            <div className="text-sm font-bold text-gray-800 mb-2">💧 Pool Liquidity</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-xs text-gray-700 font-medium mb-1">Token A (TTA)</div>
                <div className="font-bold text-green-600">{Number(formatEther(reserveX as bigint)).toFixed(2)}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-xs text-gray-700 font-medium mb-1">Token B (TTB)</div>
                <div className="font-bold text-purple-600">{Number(formatEther(reserveY as bigint)).toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isConnected ? (
          <div className="text-center py-4 px-6 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-yellow-700 font-bold">Please connect your wallet.</p>
          </div>
        ) : needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={isLoading || !fromAmount}
            className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
              showSuccessMessage === 'approve' 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed'
            } text-white`}
          >
            {showSuccessMessage === 'approve' ? (
              <div className="flex items-center justify-center">
                <span className="mr-2">✅</span>
                Approved Successfully!
              </div>
            ) : isApprovePending || isApproveConfirming ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Approving...
              </div>
            ) : (
              `Approve Token ${fromToken}`
            )}
          </button>
        ) : (
          <button
            onClick={handleSwap}
            disabled={isLoading || !fromAmount || !toAmount}
            className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
              showSuccessMessage === 'swap' 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed'
            } text-white`}
          >
            {showSuccessMessage === 'swap' ? (
              <div className="flex items-center justify-center">
                <span className="mr-2">🎉</span>
                Swap Completed!
              </div>
            ) : isSwapPending || isSwapConfirming ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Swapping...
              </div>
            ) : (
              '⚡ Swap Tokens'
            )}
          </button>
        )}
      </div>
    </div>
  );
}