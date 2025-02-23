import React, { useState, useEffect } from 'react';
import './Options.css';
import browserAPI from '../utils/browserAPI';

function Options() {
  const [updateFrequency, setUpdateFrequency] = useState(5);
  const [rpcProvider, setRpcProvider] = useState('https://eth.public-rpc.com');
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Load saved settings
    browserAPI.storage.local.get(['updateFrequency', 'rpcProvider'], (result) => {
      if (result.updateFrequency) {
        setUpdateFrequency(result.updateFrequency);
      }
      if (result.rpcProvider) {
        setRpcProvider(result.rpcProvider);
      }
    });
  }, []);

  const saveSettings = async () => {
    try {
      await browserAPI.storage.local.set({
        updateFrequency,
        rpcProvider
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

      <button onClick={saveSettings}>Save Settings</button>
      
      {status && <div className="status-message">{status}</div>}
    </div>
  );
}

export default Options; 