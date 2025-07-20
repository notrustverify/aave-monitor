/// <reference types="chrome"/>
import React, { useState, useEffect } from "react";
import "./Options.css";
import browserAPI from "../utils/browserAPI";
import networks, { NetworkConfig, getAllNetworks } from "../config/networks";

function Options() {
  const [updateFrequency, setUpdateFrequency] = useState(5);
  const [rpcProvider, setRpcProvider] = useState("https://eth.public-rpc.com");
  const [locale, setLocale] = useState(navigator.language);
  const [contractAddress, setContractAddress] = useState(
    "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"
  );
  const [selectedNetwork, setSelectedNetwork] = useState<string>("ethereum");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [status, setStatus] = useState("");
  const [customRpc, setCustomRpc] = useState(false);
  const [warningThreshold, setWarningThreshold] = useState(2);
  const [dangerThreshold, setDangerThreshold] = useState(1);
  const [badgeDisplay, setBadgeDisplay] = useState<string>("healthFactor");
  const [preferSidePanel, setPreferSidePanel] = useState<boolean>(true);

  useEffect(() => {
    // Load saved settings
    browserAPI.storage.local.get(
      [
        "updateFrequency",
        "rpcProvider",
        "locale",
        "contractAddress",
        "selectedNetwork",
        "customRpc",
        "theme",
        "warningThreshold",
        "dangerThreshold",
        "badgeDisplay",
        "preferSidePanel",
      ],
      (result) => {
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
            setContractAddress(
              networks[result.selectedNetwork].contractAddress
            );
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
        if (result.warningThreshold !== undefined) {
          setWarningThreshold(result.warningThreshold);
        }
        if (result.dangerThreshold !== undefined) {
          setDangerThreshold(result.dangerThreshold);
        }
        if (result.badgeDisplay) {
          setBadgeDisplay(result.badgeDisplay);
        }
        if (result.preferSidePanel !== undefined) {
          setPreferSidePanel(result.preferSidePanel);
        }
      }
    );
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // Set body and html to full height
    document.body.style.height = "100%";
    document.documentElement.style.height = "100%";
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
      setStatus("Reset to network defaults");
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const resetAllSettings = () => {
    // Reset to default values
    setSelectedNetwork("ethereum");
    setUpdateFrequency(5);
    setRpcProvider(networks.ethereum.defaultRpcUrl);
    setContractAddress(networks.ethereum.contractAddress);
    setLocale(navigator.language);
    setCustomRpc(false);
    setTheme("dark");
    setWarningThreshold(2);
    setDangerThreshold(1);
    setBadgeDisplay("healthFactor");

    // Save the reset settings to storage
    browserAPI.storage.local.set({
      selectedNetwork: "ethereum",
      updateFrequency: 5,
      rpcProvider: networks.ethereum.defaultRpcUrl,
      contractAddress: networks.ethereum.contractAddress,
      locale: navigator.language,
      customRpc: false,
      theme: "dark",
      warningThreshold: 2,
      dangerThreshold: 1,
      badgeDisplay: "healthFactor",
    });

    // Update the alarm interval
    browserAPI.alarms.clear("healthCheck");
    browserAPI.alarms.create("healthCheck", {
      periodInMinutes: 5,
    });

    setStatus("All settings reset to defaults");
    setTimeout(() => setStatus(""), 3000);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    browserAPI.storage.local.set({ theme: newTheme });
  };

  const handleBadgeDisplayChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newBadgeDisplay = e.target.value;
    setBadgeDisplay(newBadgeDisplay);

    // Save the badge display setting immediately to ensure it persists
    console.log("Changing badge display to:", newBadgeDisplay);
    browserAPI.storage.local.set({ badgeDisplay: newBadgeDisplay });

    setStatus("Badge display updated");
    setTimeout(() => setStatus(""), 3000);
  };

  const saveSettings = async () => {
    try {
      console.log("Saving settings with badge display:", badgeDisplay);
      await browserAPI.storage.local.set({
        updateFrequency,
        rpcProvider,
        locale,
        contractAddress,
        selectedNetwork,
        customRpc,
        theme,
        warningThreshold,
        dangerThreshold,
        badgeDisplay,
        preferSidePanel,
      });

      // Update the alarm interval
      await browserAPI.alarms.clear("healthCheck");
      await browserAPI.alarms.create("healthCheck", {
        periodInMinutes: updateFrequency,
      });

      setStatus("Settings saved successfully!");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus("Error saving settings");
      console.error("Error saving settings:", error);
    }
  };

  return (
    <div className="options-container">
      <h1>Aave Monitor Settings</h1>

      <div className="theme-section">
        <h2>Appearance</h2>
        <div className="theme-toggle-container">
          <label>Theme:</label>
          <div className="theme-toggle-wrapper">
            <span className="theme-label">
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
            <button
              className={`theme-toggle-button ${theme === "light" ? "light" : ""}`}
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              <span className="toggle-icon sun-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
        <h2>Health Factor Thresholds</h2>

        <div className="setting-group">
          <label htmlFor="warning-threshold">Warning Threshold:</label>
          <div className="threshold-input-container">
            <input
              type="number"
              id="warning-threshold"
              value={warningThreshold}
              onChange={(e) => setWarningThreshold(parseFloat(e.target.value))}
              min="0.1"
              max="10"
              step="0.1"
            />
            <div className="threshold-preview warning"></div>
          </div>
          <p className="help-text">
            Health factor below this value will show as orange (default: 2.0)
          </p>
        </div>

        <div className="setting-group">
          <label htmlFor="danger-threshold">Danger Threshold:</label>
          <div className="threshold-input-container">
            <input
              type="number"
              id="danger-threshold"
              value={dangerThreshold}
              onChange={(e) => setDangerThreshold(parseFloat(e.target.value))}
              min="0.1"
              max="10"
              step="0.1"
            />
            <div className="threshold-preview danger"></div>
          </div>
          <p className="help-text">
            Health factor below this value will show as red (default: 1.0)
          </p>
        </div>
      </div>

      <div className="settings-section">
        <h2>Display Settings</h2>

        <div className="setting-group">
          <label htmlFor="badge-display">Badge Display:</label>
          <div className="badge-display-container">
            <select
              id="badge-display"
              value={badgeDisplay}
              onChange={handleBadgeDisplayChange}
              className="badge-display-select"
            >
              <option value="healthFactor">Health Factor</option>
              <option value="totalCollateralBase">Total Collateral</option>
              <option value="totalDebtBase">Total Debt</option>
              <option value="availableBorrowsBase">Available to borrow</option>
              <option value="netWorth">Net Worth</option>
              <option value="currentLiquidationThreshold">
                Liquidation Threshold
              </option>
              <option value="ltv">Loan to Value</option>
            </select>
          </div>
          <p className="help-text">
            Choose what information to display in the extension badge
          </p>
        </div>

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

        <div className="setting-group">
          <label htmlFor="prefer-side-panel">
            Extension Icon Click Behavior:
          </label>
          <div className="side-panel-preference-container">
            <select
              id="prefer-side-panel"
              value={preferSidePanel ? "sidepanel" : "popup"}
              onChange={(e) =>
                setPreferSidePanel(e.target.value === "sidepanel")
              }
              className="side-panel-preference-select"
            >
              <option value="sidepanel">Open Side Panel</option>
              <option value="popup">Open Popup</option>
            </select>
          </div>
          <p className="help-text">
            Choose what happens when you click the extension icon
          </p>
        </div>
      </div>

      <div className="button-group">
        <button className="save-button" onClick={saveSettings}>
          Save Settings
        </button>
        <button className="reset-button" onClick={resetAllSettings}>
          Reset All Settings
        </button>
      </div>

      {status && <div className="status-message">{status}</div>}

      <div className="footer">
        <hr className="footer-divider" />
        <div className="footer-content">
          Made with{" "}
          <svg
            className="heart-icon"
            viewBox="0 0 24 24"
            width="14"
            height="14"
          >
            <path
              fill="#ff5252"
              d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"
            />
          </svg>{" "}
          by{" "}
          <a
            href="https://notrustverify.ch"
            target="_blank"
            rel="noopener noreferrer"
          >
            No Trust Verify
          </a>
        </div>
      </div>
    </div>
  );
}

export default Options;
