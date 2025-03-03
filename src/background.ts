import { ethers } from "ethers";
import browserAPI from './utils/browserAPI';
import networks from './config/networks';
import { POOL_ABI } from "./config/abi";
import { formatLargeNumber } from "./utils/utils";

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
    const healthFactor = ethers.formatUnits(data.healthFactor, 18);
    const totalDebt = ethers.formatUnits(data.totalDebtBase, 8);
    const totalCollateral = ethers.formatUnits(data.totalCollateralBase, 8);
    const availableBorrows = ethers.formatUnits(data.availableBorrowsBase, 8);
    const liquidationThreshold = ethers.formatUnits(data.currentLiquidationThreshold, 4);
    const ltv = ethers.formatUnits(data.ltv, 4);

    console.log("updating badge", new Date(Date.now()).toISOString(), 
      "health factor:", parseFloat(healthFactor).toFixed(2), 
      "network:", networkKey,
      "badge display:", displayOption);
    
    // Determine badge text based on selected display option
    let badgeText = '';
    let color = '#649dfa'; // Blue color for non-health factor metrics
    
    switch (displayOption) {
      case 'totalCollateralBase':
        badgeText = formatLargeNumber(totalCollateral);
        break;
      case 'totalDebtBase':
        if(parseFloat(totalDebt) <= 0) {
          badgeText = 'ND'
          color = '#4CAF50'
        } else {
          badgeText = formatLargeNumber(totalDebt);
        }
        break;
      case 'availableBorrowsBase':
        badgeText = formatLargeNumber(availableBorrows);
        break;
      case 'currentLiquidationThreshold':
        // Format as percentage
        badgeText = (parseFloat(liquidationThreshold) * 100).toFixed(0) + '%';
        break;
      case 'ltv':
        // Format as percentage
        badgeText = (parseFloat(ltv) * 100).toFixed(0) + '%';
        break;
      case 'healthFactor':
      default:
        // Check for no debt
        console.log("totalDebt", totalDebt)
        if (parseFloat(totalDebt) <= 0 ) {
          badgeText ='ND'
          color = '#4CAF50'
          break;
        }
        
        badgeText = parseFloat(healthFactor).toFixed(2);
        // Set color based on health factor thresholds
        if (parseFloat(healthFactor) <= dangerThreshold) {
          color = '#f44336';
        } else if (parseFloat(healthFactor) <= warningThreshold) {
          color = '#FFA726';
        }
        break;
    }
    
    // Ensure badge text is not too long for the badge
    // For values with K/M suffix, we want to keep the suffix
    if (badgeText.endsWith('K') || badgeText.endsWith('M') || badgeText.endsWith('B')) {
      // Allow more characters for values with suffix
      if (badgeText.length > 5) {
        badgeText = badgeText.substring(0, 4) + badgeText.slice(-1);
      }
    } else if (badgeText.endsWith('%')) {
      // For percentages, allow up to 4 chars including the %
      if (badgeText.length > 4) {
        badgeText = badgeText.substring(0, 3) + '%';
      }
    } else {
      // For other values, allow up to 5 chars
      if (badgeText.length > 5) {
        badgeText = badgeText.substring(0, 5);
      }
    }
    
    // Update badge
    browserAPI.action.setBadgeText({ text: badgeText });
    browserAPI.action.setBadgeBackgroundColor({ color });
  } catch (error) {
    console.error('Error updating health factor:', error);
    browserAPI.action.setBadgeText({ text: 'ERR' });
    browserAPI.action.setBadgeBackgroundColor({ color: '#f44336' });
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