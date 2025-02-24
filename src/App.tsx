/// <reference types="chrome"/>
import 'reflect-metadata';
import './App.css';
import { formatUnits } from '@ethersproject/units';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import browserAPI from './utils/browserAPI';

// Aave Pool ABI - only the function we need
const POOL_ABI = [
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)"
];

function App() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [userData, setUserData] = useState<{[key: string]: any}>({});
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});
  const [starredAddress, setStarredAddress] = useState<string>('');
  const [newAddress, setNewAddress] = useState<string>('');
  const [rpcProvider, setRpcProvider] = useState('https://eth.public-rpc.com');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [locale, setLocale] = useState(navigator.language);

  // Load initial addresses, starred address, rpcProvider, and locale from chrome storage
  useEffect(() => {
    browserAPI.storage.local.get(['savedAddresses', 'starredAddress', 'rpcProvider', 'locale']).then(result => {
      if (result.savedAddresses) {
        setAddresses(result.savedAddresses);
        result.savedAddresses.forEach((addr: string) => {
          getUserData(addr);
        });
      }
      if (result.starredAddress) {
        setStarredAddress(result.starredAddress);
      }
      if (result.rpcProvider) {
        setRpcProvider(result.rpcProvider);
      }
      if (result.locale) {
        setLocale(result.locale);
      }
    });
  }, []);

  useEffect(() => {
    // Load privacy mode state from storage
    browserAPI.storage.local.get('privacyMode', (result) => {
      if (result.privacyMode !== undefined) {
        setPrivacyMode(result.privacyMode);
      }
    });
  }, []);

  const formatNumber = (value: string | number) => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currency: 'USD',
      currencyDisplay: 'code',
      useGrouping: true
    }).format(Number(value));
  };

  const toggleStar = async (address: string) => {
    const newStarred = starredAddress === address ? '' : address;
    setStarredAddress(newStarred);
    await browserAPI.storage.local.set({ starredAddress: newStarred });
    
    // Update badge with starred address data if exists
    if (newStarred && userData[newStarred]) {
      updateBadge(userData[newStarred].healthFactor);
    } else {
      browserAPI.action.setBadgeText({ text: '' });
    }
  };

  const addAddress = async () => {
    if (!newAddress || addresses.includes(newAddress)) return;
    
    const updatedAddresses = [...addresses, newAddress];
    setAddresses(updatedAddresses);
    await browserAPI.storage.local.set({ savedAddresses: updatedAddresses });
    getUserData(newAddress);
  };

  const removeAddress = async (addressToRemove: string) => {
    const updatedAddresses = addresses.filter(addr => addr !== addressToRemove);
    setAddresses(updatedAddresses);
    await browserAPI.storage.local.set({ savedAddresses: updatedAddresses });
    
    // Remove data for this address
    const updatedUserData = { ...userData };
    delete updatedUserData[addressToRemove];
    setUserData(updatedUserData);

    // Clear starred address if removed
    if (addressToRemove === starredAddress) {
      setStarredAddress('');
      await browserAPI.storage.local.set({ starredAddress: '' });
      browserAPI.action.setBadgeText({ text: '' });
    }
  };

  const getUserData = async (userAddress: string) => {
    if (!userAddress) return;
    
    setIsLoading(prev => ({ ...prev, [userAddress]: true }));
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpcProvider);
      
      const poolContract = new ethers.Contract(
        '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
        POOL_ABI,
        provider
      );

      const data = await poolContract.getUserAccountData(userAddress);
      const formatted = {
        totalCollateral: formatUnits(data.totalCollateralBase, 8),
        totalDebt: formatUnits(data.totalDebtBase, 8),
        availableBorrows: formatUnits(data.availableBorrowsBase, 8),
        liquidationThreshold: formatUnits(data.currentLiquidationThreshold, 2),
        ltv: formatUnits(data.ltv, 2),
        healthFactor: formatUnits(data.healthFactor, 18)
      };
      
      setUserData(prev => ({ ...prev, [userAddress]: formatted }));
      
      // Only update badge if this is the starred address
      if (userAddress === starredAddress) {
        updateBadge(formatted.healthFactor);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (userAddress === starredAddress) {
        browserAPI.action.setBadgeText({ text: '' });
      }
    } finally {
      setIsLoading(prev => ({ ...prev, [userAddress]: false }));
    }
  };

  const updateBadge = (healthFactor: string) => {
    // Check if there's any debt in the starred address
    if (starredAddress && userData[starredAddress] && parseFloat(userData[starredAddress].totalDebt) === 0) {
      browserAPI.action.setBadgeText({ text: 'ND' }); // ND for "No Debt" since badge space is limited
      browserAPI.action.setBadgeBackgroundColor({ color: '#4CAF50' }); // Green for no debt
      return;
    }

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
    browserAPI.action.setBadgeText({ text: hf });
    browserAPI.action.setBadgeBackgroundColor({ color: color });
  };

  const refreshData = () => {
    addresses.forEach((address) => {
      getUserData(address);
    });
  };

  const togglePrivacyMode = () => {
    const newPrivacyMode = !privacyMode;
    setPrivacyMode(newPrivacyMode);
    // Save privacy mode state to storage
    browserAPI.storage.local.set({ privacyMode: newPrivacyMode });
  };

  const formatAmount = (amount: string) => {
    return privacyMode ? '****' : formatNumber(amount);
  };

  return (
    <div className="App">
      <div className="input-container">
        <div className="input-with-button">
          <input
            type="text"
            placeholder="Enter address"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addAddress();
              }
            }}
          />
          <button 
            className="add-button"
            onClick={addAddress}
          >
            Add
          </button>
        </div>
        <button 
          className="refresh-button icon-button"
          onClick={refreshData}
        >
          <img src="../public/assets/refresh.svg" alt="Refresh" />
        </button>
        <img 
          src="../public/assets/eye.svg" 
          alt="Toggle Privacy Mode" 
          className="eye-icon"
          onClick={togglePrivacyMode}
          style={{ cursor: 'pointer', width: '24px', height: '24px' }}
        />
        <button 
          className="options-button"
          onClick={() => browserAPI.runtime.openOptionsPage()}
        >
          Options
        </button>
      </div>

      <div className="addresses-container">
        {addresses.map(address => (
          <div key={address} className="address-data">
            {isLoading[address] ? (
              <div className="loading">Loading...</div>
            ) : userData[address] && (
              <div className="container">
                <div className="address-header">
                  <span className="address-value">{address}</span>
                  <div className="address-actions">
                    <button 
                      className={`star-button ${starredAddress === address ? 'starred' : ''}`}
                      onClick={() => toggleStar(address)}
                    >
                      {starredAddress === address ? '★' : '☆'}
                    </button>
                    <button 
                      className="remove-button"
                      onClick={() => removeAddress(address)}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="data-row">
                  <span className="label">Total Collateral</span>
                  <span className="value">$ {formatAmount(userData[address].totalCollateral)}</span>
                </div>
                <div className="data-row">
                  <span className="label">Total Debt</span>
                  <span className="value">$ {formatAmount(userData[address].totalDebt)}</span>
                </div>
                <div className="data-row">
                  <span className="label">Available to Borrow</span>
                  <span className="value">$ {formatAmount(userData[address].availableBorrows)}</span>
                </div>
                <div className="data-row">
                  <span className="label">Liquidation Threshold</span>
                  <span className="value">{userData[address].liquidationThreshold}%</span>
                </div>
                <div className="data-row">
                  <span className="label">LTV</span>
                  <span className="value">{userData[address].ltv}%</span>
                </div>
                <div className={`health-factor ${
                  parseFloat(userData[address].healthFactor) > 2 ? 'safe' : 
                  parseFloat(userData[address].healthFactor) > 1 ? 'warning' : 'danger'
                }`}>
                  Health Factor: {
                    parseFloat(userData[address].totalDebt) === 0 
                      ? "No debt"
                      : formatNumber(userData[address].healthFactor)
                  }
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;