import { ethers } from "ethers";

const POOL_ABI = [
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)"
];

async function updateHealthFactor() {
  const result = await chrome.storage.local.get(['lastAddress']);
  const address = result.lastAddress;
  if (!address) return;

  console.log(result);


  const provider = new ethers.providers.JsonRpcProvider('https://eth.public-rpc.com');
  const poolContract = new ethers.Contract(
    '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    POOL_ABI,
    provider
  );

  try {
    const data = await poolContract.getUserAccountData(address);
    const healthFactor = ethers.utils.formatUnits(data.healthFactor, 18);
    console.log("updating badge", parseFloat(healthFactor).toFixed(2));
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

// Clear the interval if it exists (to prevent multiple intervals)
let healthCheckInterval: NodeJS.Timeout;

function startHealthCheck() {
  // Clear any existing interval
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  // Initial update
  updateHealthFactor();
  // Update every minute
  healthCheckInterval = setInterval(updateHealthFactor, 1 * 60 * 1000);
}

// Start monitoring when the browser starts
chrome.runtime.onStartup.addListener(startHealthCheck);

// Start monitoring when the extension is installed/updated
chrome.runtime.onInstalled.addListener(startHealthCheck);

// Replace the existing interval and initial update with startHealthCheck()
startHealthCheck(); 