/// <reference types="chrome"/>
import 'reflect-metadata';
import './App.css';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import browserAPI from './utils/browserAPI';
import networks, { NetworkConfig, getAllNetworks } from './config/networks';

// Aave Pool ABI - only the function we need
const POOL_ABI = [
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)"
];

// Interface for address data including network
interface AddressData {
  address: string;
  network: string;
}

function App() {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [userData, setUserData] = useState<{[key: string]: any}>({});
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [globalError, setGlobalError] = useState<string>('');
  const [starredAddress, setStarredAddress] = useState<string>('');
  const [newAddress, setNewAddress] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('ethereum');
  const [rpcProvider, setRpcProvider] = useState('https://eth.public-rpc.com');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [locale, setLocale] = useState(navigator.language);
  const [contractAddress, setContractAddress] = useState('0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2');
  const [showContractInput, setShowContractInput] = useState(false);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load initial addresses, starred address, rpcProvider, and locale from chrome storage
  useEffect(() => {
    browserAPI.storage.local.get(['savedAddresses', 'starredAddress', 'rpcProvider', 'locale', 'contractAddress', 'selectedNetwork', 'theme']).then(result => {
      if (result.savedAddresses) {
        // Convert old format to new format if needed
        if (Array.isArray(result.savedAddresses) && result.savedAddresses.length > 0 && typeof result.savedAddresses[0] === 'string') {
          const defaultNetwork = result.selectedNetwork || 'ethereum';
          const convertedAddresses = result.savedAddresses.map((addr: string) => ({
            address: addr,
            network: defaultNetwork
          }));
          setAddresses(convertedAddresses);
          // Save the converted format back to storage
          browserAPI.storage.local.set({ savedAddresses: convertedAddresses });
        } else {
          setAddresses(result.savedAddresses);
        }
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
      if (result.selectedNetwork) {
        setSelectedNetwork(result.selectedNetwork);
      }
      if (result.contractAddress) {
        setContractAddress(result.contractAddress);
      }
      if (result.theme) {
        setTheme(result.theme);
      }
      
      // If addresses exist, fetch data for them
      if (result.savedAddresses && result.savedAddresses.length > 0) {
        // Handle both old and new address format
        if (typeof result.savedAddresses[0] === 'string') {
          // Old format
          const defaultNetwork = result.selectedNetwork || 'ethereum';
          result.savedAddresses.forEach((addr: string) => {
            getUserData(addr, defaultNetwork);
          });
        } else {
          // New format with network
          result.savedAddresses.forEach((addrData: AddressData) => {
            getUserData(addrData.address, addrData.network);
          });
        }
      }
    });
    
    console.log('Contract address:', contractAddress);
    // Add listener for visibility changes to detect when popup is opened
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  // Handle visibility change (popup opened)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('Popup opened, refreshing data');
      refreshData();
    }
  };

  useEffect(() => {
    // Load privacy mode state from storage
    browserAPI.storage.local.get('privacyMode', (result) => {
      if (result.privacyMode !== undefined) {
        setPrivacyMode(result.privacyMode);
      }
    });

    // Listen for changes to storage
    const handleStorageChange = (changes: {[key: string]: any}, areaName: string) => {
      if (areaName !== 'local') return;
      
      if (changes.rpcProvider) {
        setRpcProvider(changes.rpcProvider.newValue);
      }
      if (changes.locale) {
        setLocale(changes.locale.newValue);
      }
      if (changes.contractAddress) {
        setContractAddress(changes.contractAddress.newValue);
      }
      if (changes.selectedNetwork) {
        setSelectedNetwork(changes.selectedNetwork.newValue);
      }
      if (changes.theme) {
        setTheme(changes.theme.newValue);
      }
    };

    browserAPI.storage.onChanged.addListener(handleStorageChange);
    
    // Cleanup listener on unmount
    return () => {
      browserAPI.storage.onChanged.removeListener(handleStorageChange);
    };
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
    if (!newAddress || addresses.some(a => a.address === newAddress)) return;
    
    const newAddressData = {
      address: newAddress,
      network: selectedNetwork
    };
    
    const updatedAddresses = [...addresses, newAddressData];
    setAddresses(updatedAddresses);
    await browserAPI.storage.local.set({ savedAddresses: updatedAddresses });
    getUserData(newAddress, selectedNetwork);
    setNewAddress('');
  };

  const removeAddress = async (addressToRemove: string) => {
    const updatedAddresses = addresses.filter(a => a.address !== addressToRemove);
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

  const updateAddressNetwork = async (address: string, newNetwork: string) => {
    const updatedAddresses = addresses.map(a => 
      a.address === address ? { ...a, network: newNetwork } : a
    );
    
    setAddresses(updatedAddresses);
    await browserAPI.storage.local.set({ savedAddresses: updatedAddresses });
    
    // Refresh data for this address with the new network
    getUserData(address, newNetwork);
  };

  const getUserData = async (userAddress: string, networkKey: string = 'ethereum') => {
    if (!userAddress) return;
    
    setIsLoading(prev => ({ ...prev, [userAddress]: true }));
    // Clear any previous errors for this address
    setErrors(prev => ({ ...prev, [userAddress]: '' }));
    setGlobalError('');
    
    try {
      // Get network configuration
      const networkConfig = networks[networkKey];
      if (!networkConfig) {
        throw new Error(`Network configuration not found for ${networkKey}`);
      }
      
      const provider = new ethers.JsonRpcProvider(networkConfig.defaultRpcUrl);
      
      const poolContract = new ethers.Contract(
        networkConfig.contractAddress,
        POOL_ABI,
        provider
      );

      const data = await poolContract.getUserAccountData(userAddress);
      const formatted = {
        totalCollateral: ethers.formatUnits(data.totalCollateralBase, 8),
        totalDebt: ethers.formatUnits(data.totalDebtBase, 8),
        availableBorrows: ethers.formatUnits(data.availableBorrowsBase, 8),
        liquidationThreshold: ethers.formatUnits(data.currentLiquidationThreshold, 2),
        ltv: ethers.formatUnits(data.ltv, 2),
        healthFactor: ethers.formatUnits(data.healthFactor, 18),
        network: networkKey
      };
      
      setUserData(prev => ({ ...prev, [userAddress]: formatted }));
      
      // Only update badge if this is the starred address
      if (userAddress === starredAddress) {
        updateBadge(formatted.healthFactor);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      // Set specific error for this address
      let errorMessage = 'Failed to load data';
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('call revert exception')) {
          errorMessage = 'Contract call failed. Invalid contract address or network issue.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('Network configuration not found')) {
          errorMessage = `Network configuration not found for ${networkKey}`;
        } else {
          errorMessage = error.message;
        }
      }
      
      setErrors(prev => ({ ...prev, [userAddress]: errorMessage }));
      
      if (userAddress === starredAddress) {
        browserAPI.action.setBadgeText({ text: 'ERR' });
        browserAPI.action.setBadgeBackgroundColor({ color: '#f44336' });
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
    // Clear global error when refreshing
    setGlobalError('');
    addresses.forEach((addressData) => {
      getUserData(addressData.address, addressData.network);
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

  // Get network for an address
  const getAddressNetwork = (address: string): string => {
    const addressData = addresses.find(a => a.address === address);
    return addressData ? addressData.network : 'ethereum';
  };

  // Get network symbol
  const getNetworkSymbol = (networkKey: string): string => {
    return networks[networkKey]?.nativeCurrency.symbol || 'ETH';
  };

  // Truncate address for display
  const truncateAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    browserAPI.storage.local.set({ theme: newTheme });
  };

  return (
    <div className="App">
      {globalError && (
        <div className="global-error">
          <div className="error-message">
            {globalError}
            <button 
              className="close-error"
              onClick={() => setGlobalError('')}
            >
              ×
            </button>
          </div>
        </div>
      )}
      
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
          <div className="network-selector-small">
            <select 
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
              className="network-select-small"
              title={networks[selectedNetwork]?.name || 'Ethereum'}
            >
              {getAllNetworks().map(network => (
                <option 
                  key={network.chainId} 
                  value={network.name.toLowerCase()}
                  title={network.name}
                >
                  {network.nativeCurrency.symbol}
                </option>
              ))}
            </select>
          </div>
          <button 
            className="add-button"
            onClick={addAddress}
          >
            Add
          </button>
        </div>
        <div className="action-icons">
          <img 
            src="../public/assets/refresh.svg" 
            alt="Refresh" 
            className="action-icon"
            onClick={refreshData}
            title="Refresh data"
          />
          <img 
            src="../public/assets/eye.svg" 
            alt="Toggle Privacy Mode" 
            className="action-icon"
            onClick={togglePrivacyMode}
            title="Toggle privacy mode"
          />
          <img 
            src="../public/assets/settings.svg" 
            alt="Options" 
            className="action-icon"
            onClick={() => browserAPI.runtime.openOptionsPage()}
            title="Settings"
          />
        </div>
      </div>

      <div className="addresses-container">
        {addresses.map(addressData => {
          const address = addressData.address;
          const network = addressData.network;
          
          return (
            <div key={address} className="address-data">
              {isLoading[address] ? (
                <div className="loading">Loading...</div>
              ) : errors[address] ? (
                <div className="error-container">
                  <div className="address-header">
                    <div className="address-info">
                      <span className="address-value truncated-address" title={address}>
                        {truncateAddress(address)}
                      </span>
                      <div className="network-badge">
                        <select
                          value={network}
                          onChange={(e) => updateAddressNetwork(address, e.target.value)}
                          className="network-select-badge"
                          title={networks[network]?.name || 'Ethereum'}
                        >
                          {getAllNetworks().map(net => (
                            <option 
                              key={net.chainId} 
                              value={net.name.toLowerCase()}
                              title={net.name}
                            >
                              {net.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
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
                  <div className="error-message">{errors[address]}</div>
                  <button 
                    className="retry-button"
                    onClick={() => getUserData(address, network)}
                  >
                    Retry
                  </button>
                </div>
              ) : userData[address] && (
                <div className="container">
                  <div className="address-header">
                    <div className="address-info">
                      <span className="address-value truncated-address" title={address}>
                        {truncateAddress(address)}
                      </span>
                      <div className="network-badge">
                        <select
                          value={userData[address].network || network}
                          onChange={(e) => updateAddressNetwork(address, e.target.value)}
                          className="network-select-badge"
                          title={networks[userData[address].network || network]?.name || 'Ethereum'}
                        >
                          {getAllNetworks().map(net => (
                            <option 
                              key={net.chainId} 
                              value={net.name.toLowerCase()}
                              title={net.name}
                            >
                              {net.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
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
          );
        })}
      </div>
    </div>
  );
}

export default App;