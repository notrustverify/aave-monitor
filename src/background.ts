import { ethers } from "ethers";
import browserAPI from './utils/browserAPI';
import networks from './config/networks';
import { POOL_ABI } from "./config/abi";
import { formatLargeNumber, updateBadge } from "./utils/utils";

async function updateHealthFactor() {
  try {
    // Get starred address and its associated network
    const { 
      savedAddresses, 
      starredAddress, 
      warningThreshold = 2, 
      dangerThreshold = 1,
      badgeDisplay
    } = await browserAPI.storage.local.get([
      'savedAddresses', 
      'starredAddress',
      'warningThreshold',
      'dangerThreshold',
      'badgeDisplay'
    ]);
    
    // Use a default value for badgeDisplay if it's not set
    const displayOption = badgeDisplay || 'healthFactor';
    
    console.log("Starting updateHealthFactor with settings:", {
      starredAddress: starredAddress ? `${starredAddress.substring(0, 6)}...${starredAddress.substring(38)}` : 'none',
      badgeDisplay: displayOption,
      warningThreshold,
      dangerThreshold
    });
    
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
    updateBadge(data);
   
  } catch (error) {
    console.error('Error updating health factor:', error);
    //browserAPI.action.setBadgeText({ text: 'ERR' });
    //browserAPI.action.setBadgeBackgroundColor({ color: '#f44336' });
  }
}

async function setupHealthCheck() {
  try {
    // Get all necessary settings from storage
    const { 
      updateFrequency,
      badgeDisplay,
      warningThreshold,
      dangerThreshold,
      starredAddress,
      savedAddresses
    } = await browserAPI.storage.local.get([
      'updateFrequency',
      'badgeDisplay',
      'warningThreshold',
      'dangerThreshold',
      'starredAddress',
      'savedAddresses'
    ]);
    
    console.log('Setting up health check with settings:', {
      updateFrequency,
      badgeDisplay,
      warningThreshold,
      dangerThreshold,
      hasStarredAddress: !!starredAddress
    });
    
    // Initial update
    updateHealthFactor();
    
    browserAPI.alarms.clear('healthCheck');
    // Create an alarm that fires periodically (default: 5 minutes)
    browserAPI.alarms.create('healthCheck', {
      periodInMinutes: updateFrequency || 5
    });
  } catch (error) {
    console.error('Error setting up health check:', error);
  }
}

// Listen for alarm events
browserAPI.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'healthCheck') {
    updateHealthFactor();
  }
});

// Ensure badge is updated when extension is reloaded
browserAPI.runtime.onStartup.addListener(() => {
  console.log('Extension started, updating badge...');
  // Ensure badge display setting is set
  ensureBadgeDisplaySetting().then(() => {
    // Force a direct update of the badge
    browserAPI.storage.local.get(['badgeDisplay'], (result) => {
      console.log('Loaded badge display on startup:', result.badgeDisplay);
      setupHealthCheck();
    });
  });
});

// Ensure badge is updated when extension is installed/updated
browserAPI.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated, updating badge...');
  // Ensure badge display setting is set
  ensureBadgeDisplaySetting().then(() => {
    // Force a direct update of the badge
    browserAPI.storage.local.get(['badgeDisplay'], (result) => {
      console.log('Loaded badge display on install:', result.badgeDisplay);
      setupHealthCheck();
    });
  });
});

// Function to ensure badge display setting is set
async function ensureBadgeDisplaySetting() {
  try {
    const { badgeDisplay } = await browserAPI.storage.local.get(['badgeDisplay']);
    if (!badgeDisplay) {
      console.log('Badge display setting not found, setting default to healthFactor');
      await browserAPI.storage.local.set({ badgeDisplay: 'healthFactor' });
    } else {
      console.log('Badge display setting found:', badgeDisplay);
    }
  } catch (error) {
    console.error('Error ensuring badge display setting:', error);
  }
}

// Initial setup when background script loads
console.log('Background script loaded, initializing...');
// Ensure badge display setting is set
ensureBadgeDisplaySetting().then(() => {
  // Force a direct update of the badge
  browserAPI.storage.local.get(['badgeDisplay'], (result) => {
    console.log('Loaded badge display on init:', result.badgeDisplay);
    setupHealthCheck();
  });
});

// Add storage change listener
browserAPI.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    console.log('Storage changes detected:', Object.keys(changes));
    
    // Specifically handle badge display changes
    if (changes.badgeDisplay) {
      console.log('Badge display changed from', changes.badgeDisplay.oldValue, 'to', changes.badgeDisplay.newValue);
      // Force an immediate update
      updateHealthFactor();
      return;
    }
    
    if (changes.starredAddress || changes.savedAddresses || changes.warningThreshold || changes.dangerThreshold) {
      // If starred address was cleared, clear the badge
      if (changes.starredAddress && !changes.starredAddress.newValue) {
        browserAPI.action.setBadgeText({ text: '' });
        return;
      }
      // Update health factor for the new starred address or if networks or thresholds changed
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