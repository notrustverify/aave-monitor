/// <reference types="chrome"/>
import React, { useState, useEffect } from 'react';
import './Options.css';
import browserAPI from '../utils/browserAPI';
import networks, { NetworkConfig, getAllNetworks } from '../config/networks';

function Options() {
  const [updateFrequency, setUpdateFrequency] = useState(5);
  const [rpcProvider, setRpcProvider] = useState('https://eth.public-rpc.com');
  const [locale, setLocale] = useState(navigator.language);
  const [contractAddress, setContractAddress] = useState('0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('ethereum');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [status, setStatus] = useState('');
  const [customRpc, setCustomRpc] = useState(false);

  useEffect(() => {
    // Load saved settings
    browserAPI.storage.local.get(['updateFrequency', 'rpcProvider', 'locale', 'contractAddress', 'selectedNetwork', 'customRpc', 'theme'], (result) => {
      if (result.updateFrequency) {
        setUpdateFrequency(result.updateFrequency);
      }
      if (result.rpcProvider) {
        setRpcProvider(result.rpcProvider);
      }
      if (result.locale) {
        setLocale(result.locale);
      }
      if (result.selectedNetwork) {
        setSelectedNetwork(result.selectedNetwork);
        // Only update contract address and RPC if no custom values are set
        if (!result.customRpc && networks[result.selectedNetwork]) {
          setRpcProvider(networks[result.selectedNetwork].defaultRpcUrl);
          setContractAddress(networks[result.selectedNetwork].contractAddress);
        }
      }
      if (result.contractAddress) {
        setContractAddress(result.contractAddress);
      }
      if (result.customRpc !== undefined) {
        setCustomRpc(result.customRpc);
      }
      if (result.theme) {
        setTheme(result.theme);
      }
    });
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const networkKey = e.target.value;
    setSelectedNetwork(networkKey);
    
    // Update contract address and RPC URL based on selected network
    if (networks[networkKey]) {
      setContractAddress(networks[networkKey].contractAddress);
      setRpcProvider(networks[networkKey].defaultRpcUrl);
      setCustomRpc(false);
    }
  };

  const handleRpcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRpcProvider(e.target.value);
    setCustomRpc(true);
  };

  const handleContractChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractAddress(e.target.value);
    // If user manually changes contract address, mark as custom
    if (e.target.value !== networks[selectedNetwork]?.contractAddress) {
      setCustomRpc(true);
    }
  };

  const resetToNetworkDefaults = () => {
    if (networks[selectedNetwork]) {
      setContractAddress(networks[selectedNetwork].contractAddress);
      setRpcProvider(networks[selectedNetwork].defaultRpcUrl);
      setCustomRpc(false);
      setStatus('Reset to network defaults');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const resetAllSettings = () => {
    // Reset to default values
    setSelectedNetwork('ethereum');
    setUpdateFrequency(5);
    setRpcProvider(networks.ethereum.defaultRpcUrl);
    setContractAddress(networks.ethereum.contractAddress);
    setLocale(navigator.language);
    setCustomRpc(false);
    setTheme('dark');
    
    // Save the reset settings to storage
    browserAPI.storage.local.set({
      selectedNetwork: 'ethereum',
      updateFrequency: 5,
      rpcProvider: networks.ethereum.defaultRpcUrl,
      contractAddress: networks.ethereum.contractAddress,
      locale: navigator.language,
      customRpc: false,
      theme: 'dark'
    });
    
    // Update the alarm interval
    browserAPI.alarms.clear('healthCheck');
    browserAPI.alarms.create('healthCheck', {
      periodInMinutes: 5
    });
    
    setStatus('All settings reset to defaults');
    setTimeout(() => setStatus(''), 3000);
  };

  const saveSettings = async () => {
    try {
      await browserAPI.storage.local.set({
        updateFrequency,
        rpcProvider,
        locale,
        contractAddress,
        selectedNetwork,
        customRpc,
        theme
      });
      
      // Update the alarm interval
      await browserAPI.alarms.clear('healthCheck');
      await browserAPI.alarms.create('healthCheck', {
        periodInMinutes: updateFrequency
      });
      
      setStatus('Settings saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('Error saving settings');
      console.error('Error saving settings:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    browserAPI.storage.local.set({ theme: newTheme });
  };

  return (
    <div className="options-container">
      <h1>Aave Health Factor Settings</h1>
      
      <div className="theme-section">
        <h2>Appearance</h2>
        <div className="theme-toggle-container">
          <label>Theme:</label>
          <div className="theme-toggle-wrapper">
            <span className="theme-label">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            <button 
              className={`theme-toggle-button ${theme === 'light' ? 'light' : ''}`}
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              <span className="toggle-icon sun-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              </span>
              <span className="toggle-icon moon-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* <div className="settings-section">
        <h2>Network Settings</h2>
        
        <div className="setting-group">
          <label htmlFor="network-select">Default Network:</label>
          <select 
            id="network-select"
            value={selectedNetwork}
            onChange={handleNetworkChange}
            className="network-select"
          >
            {getAllNetworks().map(network => (
              <option 
                key={network.chainId} 
                value={network.name.toLowerCase()}
              >
                {network.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="setting-group">
          <label htmlFor="rpc-provider">Custom RPC Provider URL (optional):</label>
          <input 
            type="text" 
            id="rpc-provider"
            value={rpcProvider} 
            onChange={handleRpcChange}
            placeholder="e.g. https://mainnet.infura.io/v3/your-api-key"
          />
          <p className="help-text">Leave empty to use the default RPC provider for each network.</p>
        </div>
        
        <div className="setting-group">
          <label htmlFor="contract-address">Aave Pool Contract Address:</label>
          <input 
            type="text" 
            id="contract-address"
            value={contractAddress} 
            onChange={handleContractChange}
            placeholder="e.g. 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"
          />
          <p className="help-text">The contract address is automatically set based on the selected network.</p>
        </div>
      </div> */}
      
      <div className="settings-section">
        <h2>Display Settings</h2>
        
        <div className="setting-group">
          <label htmlFor="locale-select">Number Format Locale:</label>
          <select 
            id="locale-select"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="locale-select"
          >
            <option value="en-US">,</option>
            <option value="de-DE">.</option>
            <option value="fr-FR">Space</option>
            <option value="en-CH">'</option>
          </select>
        </div>
      </div>
      
      <div className="button-group">
        <button className="save-button" onClick={saveSettings}>Save Settings</button>
        <button className="reset-button" onClick={resetAllSettings}>Reset All Settings</button>
      </div>
      
      {status && <div className="status-message">{status}</div>}
    </div>
  );
}

export default Options; 