import { ethers } from "ethers";
import browserAPI from './utils/browserAPI';
import networks from './config/networks';

const POOL_ABI = [
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)"
];

async function updateHealthFactor() {
  try {
    // Get starred address and its associated network
    const { savedAddresses, starredAddress } = await browserAPI.storage.local.get(['savedAddresses', 'starredAddress']);
    if (!starredAddress) return;

    // Find the network for the starred address
    let networkKey = 'ethereum'; // Default to Ethereum
    if (savedAddresses && Array.isArray(savedAddresses)) {
      // Check if using new format (objects with address and network)
      if (savedAddresses.length > 0 && typeof savedAddresses[0] === 'object') {
        const addressData = savedAddresses.find(item => item.address === starredAddress);
        if (addressData && addressData.network) {
          networkKey = addressData.network;
        }
      }
    }

    // Get network configuration
    const networkConfig = networks[networkKey];
    if (!networkConfig) {
      console.error(`Network configuration not found for ${networkKey}`);
      browserAPI.action.setBadgeText({ text: 'ERR' });
      browserAPI.action.setBadgeBackgroundColor({ color: '#f44336' });
      return;
    }

    // Use network-specific RPC provider and contract address
    const provider = new ethers.JsonRpcProvider(networkConfig.defaultRpcUrl);
    const poolContract = new ethers.Contract(
      networkConfig.contractAddress,
      POOL_ABI,
      provider
    );

    const data = await poolContract.getUserAccountData(starredAddress);
    const healthFactor = ethers.formatUnits(data.healthFactor, 18);
    const totalDebt = ethers.formatUnits(data.totalDebtBase, 8);

    // Check for no debt
    if (parseFloat(totalDebt) === 0) {
      browserAPI.action.setBadgeText({ text: 'ND' });
      browserAPI.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      return;
    }

    console.log("updating badge", new Date(Date.now()).toISOString(), parseFloat(healthFactor).toFixed(2), networkConfig.defaultRpcUrl, networkKey);
    // Update badge
    let color = '#4CAF50';
    if (parseFloat(healthFactor) < 1) {
      color = '#f44336';
    } else if (parseFloat(healthFactor) < 2) {
      color = '#FFA726';
    }
    browserAPI.action.setBadgeText({ text: parseFloat(healthFactor).toFixed(2) });
    browserAPI.action.setBadgeBackgroundColor({ color });
  } catch (error) {
    console.error('Error updating health factor:', error);
    browserAPI.action.setBadgeText({ text: 'ERR' });
    browserAPI.action.setBadgeBackgroundColor({ color: '#f44336' });
  }
}

async function setupHealthCheck() {
  // Initial update
  updateHealthFactor();
  
  // Get update frequency from storage
  const { updateFrequency } = await browserAPI.storage.local.get(['updateFrequency']);
  
  browserAPI.alarms.clear('healthCheck');
  // Create an alarm that fires periodically (default: 5 minutes)
  browserAPI.alarms.create('healthCheck', {
    periodInMinutes: updateFrequency || 5
  });
}

// Listen for alarm events
browserAPI.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'healthCheck') {
    updateHealthFactor();
  }
});

// Start monitoring when the browser starts
browserAPI.runtime.onStartup.addListener(setupHealthCheck);

// Start monitoring when the extension is installed/updated
browserAPI.runtime.onInstalled.addListener(setupHealthCheck);

// Initial setup
setupHealthCheck();

// Add storage change listener
browserAPI.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.starredAddress || changes.savedAddresses) {
      // If starred address was cleared, clear the badge
      if (changes.starredAddress && !changes.starredAddress.newValue) {
        browserAPI.action.setBadgeText({ text: '' });
        return;
      }
      // Update health factor for the new starred address or if networks changed
      updateHealthFactor();
    }
    
    // Update alarm when frequency changes
    if (changes.updateFrequency) {
      browserAPI.alarms.clear('healthCheck');
      browserAPI.alarms.create('healthCheck', {
        periodInMinutes: changes.updateFrequency.newValue || 5
      });
      updateHealthFactor();
    }
  }
}); 