import { ethers } from "ethers";
import browserAPI from './utils/browserAPI';

const POOL_ABI = [
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)"
];

async function updateHealthFactor() {
  try {
    const { starredAddress, rpcProvider } = await browserAPI.storage.local.get(['starredAddress', 'rpcProvider']);
    if (!starredAddress) return;

    const provider = new ethers.providers.JsonRpcProvider(rpcProvider || 'https://eth.public-rpc.com');
    const poolContract = new ethers.Contract(
      '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
      POOL_ABI,
      provider
    );

    const data = await poolContract.getUserAccountData(starredAddress);
    const healthFactor = ethers.utils.formatUnits(data.healthFactor, 18);
    const totalDebt = ethers.utils.formatUnits(data.totalDebtBase, 8);

    // Check for no debt
    if (parseFloat(totalDebt) === 0) {
      browserAPI.action.setBadgeText({ text: 'ND' });
      browserAPI.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      return;
    }

    console.log("updating badge", new Date(Date.now()).toISOString(), parseFloat(healthFactor).toFixed(2), rpcProvider);
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
    browserAPI.action.setBadgeText({ text: '' });
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
    if (changes.starredAddress) {
      // If starred address was cleared, clear the badge
      if (!changes.starredAddress.newValue) {
        browserAPI.action.setBadgeText({ text: '' });
        return;
      }
      // Update health factor for the new starred address
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