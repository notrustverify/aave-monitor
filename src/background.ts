import { ethers } from "ethers";

const POOL_ABI = [
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)"
];

async function updateHealthFactor() {
  const result = await chrome.storage.local.get(['starredAddress']);
  const address = result.starredAddress;
  if (!address) return;


  const provider = new ethers.providers.JsonRpcProvider('https://eth.public-rpc.com');
  const poolContract = new ethers.Contract(
    '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    POOL_ABI,
    provider
  );

  try {
    const data = await poolContract.getUserAccountData(address);
    const healthFactor = ethers.utils.formatUnits(data.healthFactor, 18);
    const totalDebt = ethers.utils.formatUnits(data.totalDebtBase, 8);

    // Check for no debt
    if (parseFloat(totalDebt) === 0) {
      chrome.action.setBadgeText({ text: 'ND' });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      return;
    }

    console.log("updating badge", new Date(Date.now()).toISOString(), parseFloat(healthFactor).toFixed(2));
    // Update badge
    let color = '#4CAF50';
    if (parseFloat(healthFactor) < 1) {
      color = '#f44336';
    } else if (parseFloat(healthFactor) < 2) {
      color = '#FFA726';
    }
    chrome.action.setBadgeText({ text: parseFloat(healthFactor).toFixed(2) });
    chrome.action.setBadgeBackgroundColor({ color });
  } catch (error) {
    console.error('Error:', error);
    chrome.action.setBadgeText({ text: '' });
  }
}

function setupHealthCheck() {
  // Initial update
  updateHealthFactor();
  
  // Create an alarm that fires every 5 minutes
  chrome.alarms.create('healthCheck', {
    periodInMinutes: 1
  });
}

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'healthCheck') {
    updateHealthFactor();
  }
});

// Start monitoring when the browser starts
chrome.runtime.onStartup.addListener(setupHealthCheck);

// Start monitoring when the extension is installed/updated
chrome.runtime.onInstalled.addListener(setupHealthCheck);

// Initial setup
setupHealthCheck();

// Add storage change listener
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.starredAddress) {
    // If starred address was cleared, clear the badge
    if (!changes.starredAddress.newValue) {
      chrome.action.setBadgeText({ text: '' });
      return;
    }
    // Update health factor for the new starred address
    updateHealthFactor();
  }
}); 