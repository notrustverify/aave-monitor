import React, { useState, useEffect } from 'react';
import './Options.css';
import browserAPI from '../utils/browserAPI';

function Options() {
  const [updateFrequency, setUpdateFrequency] = useState(5);
  const [rpcProvider, setRpcProvider] = useState('https://eth.public-rpc.com');
  const [locale, setLocale] = useState(navigator.language);
  const [contractAddress, setContractAddress] = useState('0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2');
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Load saved settings
    browserAPI.storage.local.get(['updateFrequency', 'rpcProvider', 'locale', 'contractAddress'], (result) => {
      if (result.updateFrequency) {
        setUpdateFrequency(result.updateFrequency);
      }
      if (result.rpcProvider) {
        setRpcProvider(result.rpcProvider);
      }
      if (result.locale) {
        setLocale(result.locale);
      }
      if (result.contractAddress) {
        setContractAddress(result.contractAddress);
      }
    });
  }, []);

  const saveSettings = async () => {
    try {
      await browserAPI.storage.local.set({
        updateFrequency,
        rpcProvider,
        locale,
        contractAddress
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
            onChange={(e) => setRpcProvider(e.target.value)}
            placeholder="Enter RPC URL"
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          Contract Address:
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="Enter Aave Pool Contract Address"
          />
        </label>
        <p className="setting-description">
          The Aave Pool contract address. Default: 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2 (Ethereum Mainnet)
        </p>
        <div className="button-group">
          <button 
            onClick={() => setContractAddress('0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2')}
            className="reset-button"
          >
            Reset to Default
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

      <button onClick={saveSettings}>Save Settings</button>
      
      {status && <div className="status-message">{status}</div>}
    </div>
  );
}

export default Options; 