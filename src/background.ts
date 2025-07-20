import { ethers } from "ethers";
import browserAPI from "./utils/browserAPI";
import networks from "./config/networks";
import { POOL_ABI } from "./config/abi";
import { formatLargeNumber, updateBadge } from "./utils/utils";

// Track side panel state
let isSidePanelOpen = false;
let preferSidePanel = true; // Default preference

// Function to update the popup setting based on side panel state
function updatePopupSetting() {
  if (isSidePanelOpen || preferSidePanel) {
    // If side panel is open or user prefers side panel, disable the popup
    browserAPI.action.setPopup({ popup: "" });
  } else {
    // If side panel is closed and user prefers popup, enable the popup
    browserAPI.action.setPopup({ popup: "js/index.html" });
  }
}

// Load user preferences when extension starts
function loadUserPreferences() {
  browserAPI.storage.local.get(["preferSidePanel"], (result) => {
    if (result.preferSidePanel !== undefined) {
      preferSidePanel = result.preferSidePanel;
      updatePopupSetting();
    }
  });
}

// Setup side panel when extension is installed
browserAPI.runtime.onInstalled.addListener(() => {
  // Load user preferences
  loadUserPreferences();

  if (browserAPI.sidePanel) {
    browserAPI.sidePanel.setOptions({
      path: "js/sidepanel.html",
      enabled: true,
    });
  }
});

// Ensure preferences are loaded when browser starts
browserAPI.runtime.onStartup.addListener(() => {
  loadUserPreferences();
});

// Handle extension icon click
browserAPI.action.onClicked.addListener(async (tab) => {
  // If sidePanel API is available and user prefers side panel
  if (browserAPI.sidePanel && preferSidePanel) {
    try {
      if (isSidePanelOpen) {
        // Close the side panel by disabling it
        browserAPI.sidePanel.setOptions({
          enabled: false,
        });

        // Then immediately re-enable for next time
        setTimeout(() => {
          browserAPI.sidePanel.setOptions({
            path: "js/sidepanel.html",
            enabled: true,
          });
        }, 100);

        // Update our internal state
        isSidePanelOpen = false;
        updatePopupSetting();
      } else {
        // Open the side panel
        browserAPI.sidePanel.open({ windowId: tab.windowId });
      }
    } catch (error) {
      console.error("Error handling side panel:", error);
    }
  }
  // No else block needed - if user prefers popup, the action.onClicked won't fire
  // because the popup is set via updatePopupSetting()
});

async function updateHealthFactor() {
  try {
    // Get starred address and its associated network
    const {
      savedAddresses,
      starredAddress,
      warningThreshold = 2,
      dangerThreshold = 1,
      badgeDisplay,
    } = await browserAPI.storage.local.get([
      "savedAddresses",
      "starredAddress",
      "warningThreshold",
      "dangerThreshold",
      "badgeDisplay",
    ]);

    // Use a default value for badgeDisplay if it's not set
    const displayOption = badgeDisplay || "healthFactor";

    console.log("Starting updateHealthFactor with settings:", {
      starredAddress: starredAddress
        ? `${starredAddress.substring(0, 6)}...${starredAddress.substring(38)}`
        : "none",
      badgeDisplay: displayOption,
      warningThreshold,
      dangerThreshold,
    });

    if (!starredAddress) return;

    // Find the network for the starred address
    let networkKey = "ethereum"; // Default to Ethereum
    if (savedAddresses && Array.isArray(savedAddresses)) {
      // Check if using new format (objects with address and network)
      if (savedAddresses.length > 0 && typeof savedAddresses[0] === "object") {
        const addressData = savedAddresses.find(
          (item) => item.address === starredAddress
        );
        if (addressData && addressData.network) {
          networkKey = addressData.network;
        }
      }
    }

    // Get network configuration
    const networkConfig = networks[networkKey];
    if (!networkConfig) {
      console.error(`Network configuration not found for ${networkKey}`);
      browserAPI.action.setBadgeText({ text: "ERR" });
      browserAPI.action.setBadgeBackgroundColor({ color: "#f44336" });
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
    console.error("Error updating health factor:", error);
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
      savedAddresses,
    } = await browserAPI.storage.local.get([
      "updateFrequency",
      "badgeDisplay",
      "warningThreshold",
      "dangerThreshold",
      "starredAddress",
      "savedAddresses",
    ]);

    console.log("Setting up health check with settings:", {
      updateFrequency,
      badgeDisplay,
      warningThreshold,
      dangerThreshold,
      hasStarredAddress: !!starredAddress,
    });

    // Initial update
    updateHealthFactor();

    browserAPI.alarms.clear("healthCheck");
    // Create an alarm that fires periodically (default: 5 minutes)
    browserAPI.alarms.create("healthCheck", {
      periodInMinutes: updateFrequency || 5,
    });
  } catch (error) {
    console.error("Error setting up health check:", error);
  }
}

// Add a new alarm for side panel updates (more frequent)
async function setupSidePanelAlarm(isOpen: boolean) {
  try {
    console.log(
      `Side panel ${isOpen ? "opened" : "closed"}, ${isOpen ? "creating" : "clearing"} alarm`
    );

    // Clear existing side panel alarm if any
    await browserAPI.alarms.clear("sidePanelUpdate");

    if (isOpen) {
      // Create a more frequent alarm when side panel is open (every 30 seconds)
      browserAPI.alarms.create("sidePanelUpdate", {
        periodInMinutes: 0.5, // 30 seconds
      });

      // Immediately update data
      updateHealthFactor();
    }
  } catch (error) {
    console.error("Error setting up side panel alarm:", error);
  }
}

// Listen for messages from the side panel
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "sidePanelOpened") {
    isSidePanelOpen = true;
    updatePopupSetting();
    setupSidePanelAlarm(true);
    sendResponse({ success: true });
  } else if (message.action === "sidePanelClosed") {
    isSidePanelOpen = false;
    updatePopupSetting();
    setupSidePanelAlarm(false);
    sendResponse({ success: true });
  }
  return true; // Required for async response
});

// Listen for alarm events
browserAPI.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "healthCheck") {
    updateHealthFactor();
  } else if (alarm.name === "sidePanelUpdate") {
    updateHealthFactor();
  }
});

// Ensure badge is updated when extension is reloaded
browserAPI.runtime.onStartup.addListener(() => {
  console.log("Extension started, updating badge...");
  // Ensure badge display setting is set
  ensureBadgeDisplaySetting().then(() => {
    // Force a direct update of the badge
    browserAPI.storage.local.get(["badgeDisplay"], (result) => {
      console.log("Loaded badge display on startup:", result.badgeDisplay);
      setupHealthCheck();
    });
  });

  console.log("Extension started, updating popup setting...");
  updatePopupSetting();
});

// Ensure badge is updated when extension is installed/updated
browserAPI.runtime.onInstalled.addListener(() => {
  console.log("Extension installed/updated, updating badge...");
  // Ensure badge display setting is set
  ensureBadgeDisplaySetting().then(() => {
    // Force a direct update of the badge
    browserAPI.storage.local.get(["badgeDisplay"], (result) => {
      console.log("Loaded badge display on install:", result.badgeDisplay);
      setupHealthCheck();
    });
  });
});

// Function to ensure badge display setting is set
async function ensureBadgeDisplaySetting() {
  try {
    const { badgeDisplay } = await browserAPI.storage.local.get([
      "badgeDisplay",
    ]);
    if (!badgeDisplay) {
      console.log(
        "Badge display setting not found, setting default to healthFactor"
      );
      await browserAPI.storage.local.set({ badgeDisplay: "healthFactor" });
    } else {
      console.log("Badge display setting found:", badgeDisplay);
    }
  } catch (error) {
    console.error("Error ensuring badge display setting:", error);
  }
}

// Initial setup when background script loads
console.log("Background script loaded, initializing...");
// Ensure badge display setting is set
ensureBadgeDisplaySetting().then(() => {
  // Force a direct update of the badge
  browserAPI.storage.local.get(["badgeDisplay"], (result) => {
    console.log("Loaded badge display on init:", result.badgeDisplay);
    setupHealthCheck();
  });
});

// Add storage change listener
browserAPI.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    console.log("Storage changes detected:", Object.keys(changes));

    // Specifically handle badge display changes
    if (changes.badgeDisplay) {
      console.log(
        "Badge display changed from",
        changes.badgeDisplay.oldValue,
        "to",
        changes.badgeDisplay.newValue
      );
      // Force an immediate update
      updateHealthFactor();
      return;
    }

    if (
      changes.starredAddress ||
      changes.savedAddresses ||
      changes.warningThreshold ||
      changes.dangerThreshold
    ) {
      // If starred address was cleared, clear the badge
      if (changes.starredAddress && !changes.starredAddress.newValue) {
        browserAPI.action.setBadgeText({ text: "" });
        return;
      }
      // Update health factor for the new starred address or if networks or thresholds changed
      updateHealthFactor();
    }

    // Update alarm when frequency changes
    if (changes.updateFrequency) {
      browserAPI.alarms.clear("healthCheck");
      browserAPI.alarms.create("healthCheck", {
        periodInMinutes: changes.updateFrequency.newValue || 5,
      });
      updateHealthFactor();
    }
  }
});

// Listen for changes to preferences
browserAPI.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.preferSidePanel !== undefined) {
    const previousValue = preferSidePanel;
    preferSidePanel = changes.preferSidePanel.newValue;

    // Close side panel if user changed from preferring side panel to preferring popup
    if (
      previousValue === true &&
      preferSidePanel === false &&
      isSidePanelOpen &&
      browserAPI.sidePanel
    ) {
      // Close the side panel by disabling it
      browserAPI.sidePanel.setOptions({
        enabled: false,
      });

      // Then immediately re-enable for next time
      setTimeout(() => {
        browserAPI.sidePanel.setOptions({
          path: "js/sidepanel.html",
          enabled: true,
        });
      }, 100);

      // Update our internal state
      isSidePanelOpen = false;
    }

    // Always update popup setting after preference change
    updatePopupSetting();

    // Force browser to recognize popup change by simulating a small delay
    if (!preferSidePanel) {
      setTimeout(() => {
        console.log("Ensuring popup is properly set to js/index.html");
        browserAPI.action.setPopup({ popup: "js/index.html" });
      }, 100);
    }
  }
});
