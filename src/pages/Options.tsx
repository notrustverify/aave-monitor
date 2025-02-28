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
  const [status, setStatus] = useState('');
  const [customRpc, setCustomRpc] = useState(false);

  useEffect(() => {
    // Load saved settings
    browserAPI.storage.local.get(['updateFrequency', 'rpcProvider', 'locale', 'contractAddress', 'selectedNetwork', 'customRpc'], (result) => {
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
    });
  }, []);

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
    
    // Save the reset settings to storage
    browserAPI.storage.local.set({
      selectedNetwork: 'ethereum',
      updateFrequency: 5,
      rpcProvider: networks.ethereum.defaultRpcUrl,
      contractAddress: networks.ethereum.contractAddress,
      locale: navigator.language,
      customRpc: false
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
        customRpc
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

  return (
    <div className="options-container">
      <h1>Settings</h1>
      
      <div className="setting-group">
        <label>
          Network:
          <select 
            value={selectedNetwork} 
            onChange={handleNetworkChange}
            className="network-select"
          >
            {getAllNetworks().map(network => (
              <option key={network.chainId} value={network.name.toLowerCase()}>
                {network.name}
              </option>
            ))}
          </select>
        </label>
        <p className="setting-description">
          Select the network to monitor Aave positions on.
        </p>
      </div>

      <div className="setting-group">
        <label>
          Update Frequency (minutes):
          <input
            type="number"
            min="1"
            max="180"
            value={updateFrequency}
            onChange={(e) => setUpdateFrequency(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          RPC Provider URL:
          <input
            type="text"
            value={rpcProvider}
            onChange={handleRpcChange}
            placeholder="Enter RPC URL"
          />
        </label>
        <p className="setting-description">
          {customRpc 
            ? "Using custom RPC URL" 
            : `Using default RPC for ${networks[selectedNetwork]?.name || 'Ethereum'}`}
        </p>
      </div>

      <div className="setting-group">
        <label>
          Contract Address:
          <input
            type="text"
            value={contractAddress}
            onChange={handleContractChange}
            placeholder="Enter Aave Pool Contract Address"
          />
        </label>
        <p className="setting-description">
          {customRpc 
            ? "Using custom contract address" 
            : `Using default Aave V3 Pool contract for ${networks[selectedNetwork]?.name || 'Ethereum'}`}
        </p>
        <div className="button-group">
          <button 
            onClick={resetToNetworkDefaults}
            className="reset-button"
          >
            Reset to Network Defaults
          </button>
        </div>
      </div>

      <div className="setting-group">
        <label>
          Select thousands separator:
          <select value={locale} onChange={(e) => setLocale(e.target.value)} >
            <option value="en-US">,</option>
            <option value="fr-FR">Space</option>
            <option value="de-DE">.</option>
            <option value="de-CH">'</option>
            {/* Add more locales as needed */}
          </select>
        </label>
      </div>

      <div className="actions-container">
        <button onClick={saveSettings} className="save-button">Save Settings</button>
        <button onClick={resetAllSettings} className="reset-all-button">Reset All</button>
      </div>
      
      {status && <div className="status-message">{status}</div>}
    </div>
  );
}

export default Options; 