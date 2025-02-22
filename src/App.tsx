/// <reference types="chrome"/>
import 'reflect-metadata';
import './App.css';
import { formatUnits } from '@ethersproject/units';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Aave Pool ABI - only the function we need
const POOL_ABI = [
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)"
];

function App() {
  const [userData, setUserData] = useState<any>(null);
  const [address, setAddress] = useState<string>('');

  // Load initial address from chrome storage
  useEffect(() => {
    chrome.storage.local.get(['lastAddress']).then(result => {
      if (result.lastAddress) {
        setAddress(result.lastAddress);
      }
    });
  }, []);

  // Function to fetch data
  const getUserData = async (userAddress: string) => {
    if (!userAddress) return;
    
    // Store address in chrome storage instead of localStorage
    await chrome.storage.local.set({ lastAddress: userAddress });
    setAddress(userAddress);

    const provider = new ethers.providers.JsonRpcProvider('https://eth.public-rpc.com');
    
    const poolContract = new ethers.Contract(
      '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
      POOL_ABI,
      provider
    );

    try {
      const data = await poolContract.getUserAccountData(userAddress);
      const formatted = {
        totalCollateral: formatUnits(data.totalCollateralBase, 8),
        totalDebt: formatUnits(data.totalDebtBase, 8),
        availableBorrows: formatUnits(data.availableBorrowsBase, 8),
        liquidationThreshold: formatUnits(data.currentLiquidationThreshold, 2),
        ltv: formatUnits(data.ltv, 2),
        healthFactor: formatUnits(data.healthFactor, 18)
      };
      
      setUserData(formatted);
      updateBadge(formatted.healthFactor);
    } catch (error) {
      console.error('Error fetching user data:', error);
      chrome.action.setBadgeText({ text: '' });
    }
  };

  // Load data on mount and set up refresh interval
  useEffect(() => {
    if (address) {
      getUserData(address);

      // Refresh every 10 minutes
      const interval = setInterval(() => {
        getUserData(address);
      }, 10 * 60 * 1000); // 10 minutes in milliseconds

      // Cleanup interval on unmount
      return () => clearInterval(interval);
    }
  }, [address]); // Re-run effect if address changes

  const updateBadge = (healthFactor: string) => {
    // Convert health factor to a simpler number for display
    const hf = parseFloat(healthFactor).toFixed(2);
    
    // Set badge color based on health factor
    let color = '#4CAF50'; // Green for healthy (> 2)
    if (parseFloat(hf) < 1) {
      color = '#f44336'; // Red for danger
    } else if (parseFloat(hf) < 2) {
      color = '#FFA726'; // Orange for warning
    }

    // Update extension badge
    chrome.action.setBadgeText({ text: hf });
    chrome.action.setBadgeBackgroundColor({ color: color });
  };

  return (
    <div className="App">
      <div className="input-container">
        <input 
          type="text" 
          placeholder="Enter wallet address"
          value={address}
          onChange={(e) => getUserData(e.target.value)}
        />
      </div>
      {userData && (
        <div className="container">
          <div className="data-row">
            <span className="label">Address</span>
            <span className="value">{address}</span>
          </div>
          <div className="data-row">
            <span className="label">Total Collateral</span>
            <span className="value">$ {parseFloat(userData.totalCollateral).toFixed(4)}</span>
          </div>
          <div className="data-row">
            <span className="label">Total Debt</span>
            <span className="value">$ {parseFloat(userData.totalDebt).toFixed(4)}</span>
          </div>
          <div className="data-row">
            <span className="label">Available to Borrow</span>
            <span className="value">$ {parseFloat(userData.availableBorrows).toFixed(4)}</span>
          </div>
          <div className="data-row">
            <span className="label">Liquidation Threshold</span>
            <span className="value">{userData.liquidationThreshold}%</span>
          </div>
          <div className="data-row">
            <span className="label">LTV</span>
            <span className="value">{userData.ltv}%</span>
          </div>
          <div className={`health-factor ${
            parseFloat(userData.healthFactor) > 2 ? 'safe' : 
            parseFloat(userData.healthFactor) > 1 ? 'warning' : 'danger'
          }`}>
            Health Factor: {parseFloat(userData.healthFactor).toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;