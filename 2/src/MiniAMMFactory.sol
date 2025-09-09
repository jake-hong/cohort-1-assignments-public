// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {IMiniAMMFactory} from "./IMiniAMMFactory.sol";
import {MiniAMM} from "./MiniAMM.sol";

// Add as many variables or functions as you would like
// for the implementation. The goal is to pass `forge test`.
contract MiniAMMFactory is IMiniAMMFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;
    
    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 pairNumber);
    
    constructor() {}
    
    // implement
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }
    
    // implement
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "Identical addresses");
        require(tokenA != address(0) && tokenB != address(0), "Zero address");
        
        // Order tokens
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        
        // Check if pair already exists
        require(getPair[token0][token1] == address(0), "Pair exists");
        
        // Deploy new MiniAMM pair
        MiniAMM newPair = new MiniAMM(token0, token1);
        pair = address(newPair);
        
        // Store pair mappings (both directions)
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        
        // Add to pairs array
        allPairs.push(pair);
        
        // Emit event
        emit PairCreated(token0, token1, pair, allPairs.length);
    }
}
