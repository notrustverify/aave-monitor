// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: magic;

// AAVE Monitor - Scriptable Widget - Home Screen One Account Full data

// ==================== CONFIGURATION ====================
// =============== You can edit this part ================

const USER_CONFIG = {
  addresses: [
    {
      address: "0xe9dC0C1508619557bE43c79Ec867cb1d6b25aeFa", // Replace with your address
      network: "ethereum",
      label: "Demo Core", // Optional label for identification
    },
  ],

  primaryAddressIndex: 0,

  // Health factor thresholds for color coding
  warningThreshold: 2.999, // Orange warning below this value
  dangerThreshold: 1.499, // Red danger below this value

  // Widget appearance
  darkMode: true,

  // Logo settings
  showLogo: true, // Show network logo
  logoSize: 28, // Logo size in pixels
  cacheLogo: true, // Cache logos for offline use

  // Display mode configuration
  displayMode: "full", // Options: 'healthfactor', 'full'

  // Custom display settings (only applies when displayMode is 'full')
  fullModeSettings: {
    showCollateral: true, // Show total collateral
    showDebt: true, // Show total debt
    showAvailableBorrows: true, // Show available borrowing capacity
    showLTV: false, // Show Loan-to-Value ratio
    showLiquidationThreshold: true, // Show liquidation threshold
    showNetworkName: true, // Show network name (full name, not ticker)
    showAddressLabel: true, // Show address label
  },

  // Data caching settings
  cacheData: true, // Cache data for offline viewing
  cacheMaxAge: 10, // Maximum age in minutes before data is considered stale

  // Smart refresh settings
  refreshSettings: {
    healthyRefreshInterval: 60,
    warningRefreshInterval: 20,
    dangerRefreshInterval: 5,
    networkMultipliers: {
      ethereum: 1.0,
      polygon: 0.8,
      avalanche: 0.8,
      arbitrum: 0.9,
      optimism: 0.9,
      base: 0.8,
      fantom: 0.8,
      bsc: 0.8,
      gnosis: 0.8,
    },
  },
};

// ==================== END CONFIGURATION ====================

// =============== DON'T Edit anything below, unless you know what you're doing ;) ================

// ==================== NETWORK CONFIGURATION ====================
// Network definitions with RPC endpoints and contract addresses

const NETWORKS = {
  ethereum: {
    name: "Ethereum",
    contractAddress: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", // AAVE V3 Pool
    rpcUrl: "https://eth.llamarpc.com",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
    chainId: 1,
  },
  polygon: {
    name: "Polygon",
    contractAddress: "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // AAVE V3 Pool
    rpcUrl: "https://rpc.ankr.com/polygon",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
    chainId: 137,
  },
  avalanche: {
    name: "Avalanche",
    contractAddress: "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // AAVE V3 Pool
    rpcUrl: "https://rpc.ankr.com/avalanche",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
    chainId: 43114,
  },
  arbitrum: {
    name: "Arbitrum",
    contractAddress: "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // AAVE V3 Pool
    rpcUrl: "https://rpc.ankr.com/arbitrum",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
    chainId: 42161,
  },
  optimism: {
    name: "Optimism",
    contractAddress: "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // AAVE V3 Pool
    rpcUrl: "https://rpc.ankr.com/optimism",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
    chainId: 10,
  },
  base: {
    name: "Base",
    contractAddress: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5", // AAVE V3 Pool
    rpcUrl: "https://mainnet.base.org",
    logoUrl:
      "https://github.com/base-org/brand-kit/raw/main/logo/in-product/Base_Network_Logo.png",
    chainId: 8453,
  },
  gnosis: {
    name: "Gnosis",
    contractAddress: "0xb50201558B00496A145fE76f7424749556E326D8", // AAVE V3 Pool
    rpcUrl: "https://rpc.gnosischain.com",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/xdai/info/logo.png",
    chainId: 100,
  },
  bsc: {
    name: "Binance Chain",
    contractAddress: "0x6807dc923806fE8Fd134338EABCA509979a7e0cB", // AAVE V3 Pool
    rpcUrl: "https://bsc-dataseed.binance.org",
    logoUrl:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BUSD-BD1/logo.png",
    chainId: 56,
  },
};

// ==================== MAIN APPLICATION ====================

class AAVEHealthMonitor {
  constructor() {
    this.widget = new ListWidget();
    this.isDarkMode = USER_CONFIG.darkMode || Device.isUsingDarkAppearance();
    this.setupColors();
  }

  setupColors() {
    if (this.isDarkMode) {
      this.backgroundColor = new Color("#101010");
      this.textColor = Color.white();
      this.grayColor = new Color("#8E8E93");
      this.cardColor = new Color("#2C2C2E");
    } else {
      this.backgroundColor = Color.white();
      this.textColor = Color.black();
      this.grayColor = new Color("#6D6D70");
      this.cardColor = new Color("#F2F2F7");
    }
  }

  async run() {
    try {
      // Get primary address configuration
      const primaryAddress =
        USER_CONFIG.addresses[USER_CONFIG.primaryAddressIndex];
      if (!primaryAddress) {
        throw new Error("No primary address configured");
      }

      // Fetch AAVE data
      const aaveData = await this.fetchAAVEData(primaryAddress);

      // Create widget
      await this.createWidget(aaveData, primaryAddress);

      // Set smart refresh interval
      this.setSmartRefreshInterval(
        aaveData.healthFactor,
        primaryAddress.network
      );
    } catch (error) {
      console.error("Error in AAVEHealthMonitor:", error);
      this.createErrorWidget(error.message);
    }

    return this.widget;
  }

  setSmartRefreshInterval(healthFactor, network) {
    const settings = USER_CONFIG.refreshSettings;
    const networkMultiplier = settings.networkMultipliers[network] || 1.0;

    let baseInterval;

    // Determine base interval based on health factor
    if (
      healthFactor === "∞" ||
      healthFactor === Infinity ||
      healthFactor > USER_CONFIG.warningThreshold
    ) {
      baseInterval = settings.healthyRefreshInterval;
    } else if (healthFactor > USER_CONFIG.dangerThreshold) {
      baseInterval = settings.warningRefreshInterval;
    } else {
      baseInterval = settings.dangerRefreshInterval;
    }

    // Apply network multiplier
    const finalInterval = Math.max(
      1,
      Math.round(baseInterval * networkMultiplier)
    );

    // Set refresh date
    const refreshDate = new Date();
    refreshDate.setMinutes(refreshDate.getMinutes() + finalInterval);
    this.widget.refreshAfterDate = refreshDate;

    console.log(
      `Smart refresh: ${finalInterval} minutes (base: ${baseInterval}, network: ${network}, multiplier: ${networkMultiplier})`
    );
  }

  async createWidget(data, addressConfig) {
    this.widget.backgroundColor = this.backgroundColor;
    this.widget.setPadding(16, 16, 16, 16);

    if (USER_CONFIG.displayMode === "full") {
      await this.createFullWidget(data, addressConfig);
    } else {
      await this.createHealthFactorWidget(data, addressConfig);
    }
  }

  async createHealthFactorWidget(data, addressConfig) {
    const network = NETWORKS[addressConfig.network];

    // Main container
    const mainStack = this.widget.addStack();
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();

    // Health factor section
    const healthStack = mainStack.addStack();
    healthStack.layoutVertically();
    healthStack.centerAlignContent();

    // Title
    const titleText = healthStack.addText("Health Factor");
    titleText.font = Font.mediumSystemFont(14);
    titleText.textColor = this.grayColor;
    titleText.centerAlignText();

    healthStack.addSpacer(8);

    // Health factor value with logo
    const valueStack = healthStack.addStack();
    valueStack.layoutHorizontally();
    valueStack.centerAlignContent();

    // Network logo
    if (USER_CONFIG.showLogo && network.logoUrl) {
      try {
        const logo = await this.getNetworkLogo(network);
        if (logo) {
          const logoImage = valueStack.addImage(logo);
          logoImage.imageSize = new Size(
            USER_CONFIG.logoSize,
            USER_CONFIG.logoSize
          );
        }
      } catch (error) {
        console.error("Error loading logo:", error);
      }
    }

    valueStack.addSpacer(12);

    // Health factor value
    const healthText = valueStack.addText(
      data.healthFactor.toFixed(2).toString()
    );
    healthText.font = Font.boldSystemFont(32);
    healthText.textColor = this.getHealthFactorColor(data.healthFactor);

    healthStack.addSpacer(8);
    // Address label (if configured)
    if (USER_CONFIG.fullModeSettings.showAddressLabel && addressConfig.label) {
      const labelText = healthStack.addText(addressConfig.label);
      labelText.font = Font.systemFont(10);
      labelText.textColor = this.grayColor;
      labelText.centerAlignText();
    }

    // Last updated
    const updateText = this.widget.addText(
      `Updated: ${new Date().toLocaleTimeString()}`
    );
    updateText.font = Font.systemFont(8);
    updateText.textColor = this.grayColor;
  }

  async createFullWidget(data, addressConfig) {
    const network = NETWORKS[addressConfig.network];
    const settings = USER_CONFIG.fullModeSettings;

    // Header with network info
    const headerStack = this.widget.addStack();
    headerStack.layoutHorizontally();
    headerStack.centerAlignContent();

    // Network name and address label
    const infoStack = headerStack.addStack();
    infoStack.layoutVertically();

    // Health Factor (prominent)
    const healthStack = this.widget.addStack();
    healthStack.layoutHorizontally();
    healthStack.centerAlignContent();

    // Network logo
    if (USER_CONFIG.showLogo && network.logoUrl) {
      try {
        const logo = await this.getNetworkLogo(network);
        if (logo) {
          const logoImage = healthStack.addImage(logo);
          logoImage.imageSize = new Size(22, 22);
        }
      } catch (error) {
        console.error("Error loading logo:", error);
      }
      healthStack.addSpacer(8);
    }

    const healthValue = healthStack.addText(
      data.healthFactor.toFixed(2).toString()
    );
    healthValue.font = Font.boldSystemFont(24);
    healthValue.textColor = this.getHealthFactorColor(data.healthFactor);

    this.widget.addSpacer(8);

    // Financial metrics
    if (settings.showCollateral) {
      this.addMetricRow(
        "Collateral",
        `${this.formatNumber(data.totalCollateralUSD)}`
      );
    }

    if (settings.showDebt) {
      this.addMetricRow("Debt", `${this.formatNumber(data.totalDebtUSD)}`);
    }

    if (settings.showAvailableBorrows) {
      this.addMetricRow(
        "Available",
        `${this.formatNumber(data.availableBorrowsUSD)}`
      );
    }

    if (settings.showLTV) {
      this.addMetricRow("LTV", `${(data.ltv * 100).toFixed(1)}%`);
    }

    if (settings.showLiquidationThreshold) {
      this.addMetricRow(
        "Liq. Threshold",
        `${(data.liquidationThreshold * 100).toFixed(1)}%`
      );
    }

    this.widget.addSpacer(4);
    if (settings.showAddressLabel && addressConfig.label) {
      const labelText = this.widget.addText(
        (addressConfig.label += ` - ${new Date().toLocaleTimeString()}`)
      );
      labelText.font = Font.systemFont(9);
      labelText.textColor = this.grayColor;
    }
  }

  addMetricRow(label, value) {
    const stack = this.widget.addStack();
    stack.layoutHorizontally();

    const labelText = stack.addText(label);
    labelText.font = Font.systemFont(12);
    labelText.textColor = this.grayColor;

    stack.addSpacer();

    const valueText = stack.addText(value);
    valueText.font = Font.mediumSystemFont(12);
    valueText.textColor = this.textColor;

    this.widget.addSpacer(4);
  }

  createErrorWidget(errorMessage) {
    this.widget.backgroundColor = this.backgroundColor;
    this.widget.setPadding(16, 16, 16, 16);

    const errorText = this.widget.addText("⚠️ Error");
    errorText.font = Font.boldSystemFont(16);
    errorText.textColor = new Color("#FF3B30");

    this.widget.addSpacer(8);

    const messageText = this.widget.addText(errorMessage);
    messageText.font = Font.systemFont(12);
    messageText.textColor = this.textColor;

    // Set retry refresh interval (5 minutes)
    const refreshDate = new Date();
    refreshDate.setMinutes(refreshDate.getMinutes() + 5);
    this.widget.refreshAfterDate = refreshDate;
  }

  formatNumber(value) {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + "M";
    } else if (value >= 1000) {
      return (value / 1000).toFixed(2) + "K";
    }
    return value.toFixed(2);
  }

  getHealthFactorColor(healthFactor) {
    if (
      healthFactor === "∞" ||
      healthFactor === Infinity ||
      healthFactor > 10
    ) {
      return new Color("#34C759"); // Green
    } else if (healthFactor >= USER_CONFIG.warningThreshold) {
      return new Color("#34C759"); // Green
    } else if (healthFactor >= USER_CONFIG.dangerThreshold) {
      return new Color("#FF9500"); // Orange
    } else {
      return new Color("#FF3B30"); // Red
    }
  }

  async fetchAAVEData(addressConfig) {
    const network = NETWORKS[addressConfig.network];
    if (!network) {
      throw new Error(`Unsupported network: ${addressConfig.network}`);
    }

    // Check cache first
    const cacheKey = `aave_${addressConfig.address}_${addressConfig.network}`;
    const cachedData = await this.getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Fetch fresh data
    const data = await this.fetchFreshData(addressConfig, network);

    // Cache the data
    await this.cacheData(cacheKey, data);

    return data;
  }

  async fetchFreshData(addressConfig, network) {
    const rpcData = {
      id: 1,
      jsonrpc: "2.0",
      method: "eth_call",
      params: [
        {
          to: network.contractAddress,
          data: this.buildCallData(addressConfig.address),
        },
        "latest",
      ],
    };

    const request = new Request(network.rpcUrl);
    request.method = "POST";
    request.headers = {
      "Content-Type": "application/json",
    };
    request.body = JSON.stringify(rpcData);
    request.timeoutInterval = 30;

    const response = await request.loadJSON();

    if (response.error) {
      throw new Error(`RPC Error: ${response.error.message}`);
    }

    return this.parseResponse(response.result, addressConfig, network);
  }

  buildCallData(address) {
    // Function signature for getUserAccountData(address)
    const funcSig = "0xbf92857c";

    // Remove 0x prefix and pad to 32 bytes
    const cleanAddress = address.toLowerCase().replace("0x", "");
    const paddedAddress = cleanAddress.padStart(64, "0");

    return funcSig + paddedAddress;
  }

  parseResponse(result, addressConfig, network) {
    // Remove 0x prefix and decode hex response
    const cleanResult = result.replace("0x", "");

    // Each return value is 32 bytes (64 hex characters)
    const totalCollateralBase = BigInt("0x" + cleanResult.substr(0, 64));
    const totalDebtBase = BigInt("0x" + cleanResult.substr(64, 64));
    const availableBorrowsBase = BigInt("0x" + cleanResult.substr(128, 64));
    const currentLiquidationThreshold = BigInt(
      "0x" + cleanResult.substr(192, 64)
    );
    const ltv = BigInt("0x" + cleanResult.substr(256, 64));
    const healthFactor = BigInt("0x" + cleanResult.substr(320, 64));

    // Convert to proper decimal values
    const totalCollateralUSD = Number(totalCollateralBase) / 1e8;
    const totalDebtUSD = Number(totalDebtBase) / 1e8;
    const availableBorrowsUSD = Number(availableBorrowsBase) / 1e8;
    const liquidationThreshold = Number(currentLiquidationThreshold) / 10000; // BPS to decimal
    const ltvRatio = Number(ltv) / 10000; // BPS to decimal

    // Calculate health factor
    let healthFactorValue;
    if (
      healthFactor ===
      BigInt(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ) {
      healthFactorValue = "∞"; // Max uint256 represents infinity
    } else {
      healthFactorValue = Number(healthFactor) / 1e18;
      if (healthFactorValue > 100) {
        healthFactorValue = "∞";
      } else {
        healthFactorValue = Math.round(healthFactorValue * 100) / 100;
      }
    }

    return {
      totalCollateralUSD,
      totalDebtUSD,
      availableBorrowsUSD,
      liquidationThreshold,
      ltv: ltvRatio,
      healthFactor: healthFactorValue,
      network: network.name,
      address: addressConfig.address,
      label: addressConfig.label,
    };
  }

  async getCachedData(key) {
    if (!USER_CONFIG.cacheData) return null;

    try {
      const fm = FileManager.local();
      const cacheDir = fm.joinPath(fm.documentsDirectory(), "aave-cache");

      if (!fm.fileExists(cacheDir)) {
        return null;
      }

      const cacheFile = fm.joinPath(cacheDir, key + ".json");

      if (!fm.fileExists(cacheFile)) {
        return null;
      }

      const cacheContent = fm.readString(cacheFile);
      const cacheData = JSON.parse(cacheContent);

      // Check if cache is still valid
      const cacheAge = (Date.now() - cacheData.timestamp) / 1000 / 60; // minutes
      if (cacheAge > USER_CONFIG.cacheMaxAge) {
        return null;
      }

      console.log(`Using cached data (${cacheAge.toFixed(1)} minutes old)`);
      return cacheData.data;
    } catch (error) {
      console.error("Error reading cache:", error);
      return null;
    }
  }

  async cacheData(key, data) {
    if (!USER_CONFIG.cacheData) return;

    try {
      const fm = FileManager.local();
      const cacheDir = fm.joinPath(fm.documentsDirectory(), "aave-cache");

      if (!fm.fileExists(cacheDir)) {
        fm.createDirectory(cacheDir);
      }

      const cacheFile = fm.joinPath(cacheDir, key + ".json");
      const cacheContent = {
        timestamp: Date.now(),
        data: data,
      };

      fm.writeString(cacheFile, JSON.stringify(cacheContent));
    } catch (error) {
      console.error("Error writing cache:", error);
    }
  }

  async getNetworkLogo(network) {
    if (!USER_CONFIG.cacheLogo) {
      // Load directly without caching
      const request = new Request(network.logoUrl);
      return await request.loadImage();
    }

    try {
      const fm = FileManager.local();
      const cacheDir = fm.joinPath(fm.documentsDirectory(), "aave-logos");

      if (!fm.fileExists(cacheDir)) {
        fm.createDirectory(cacheDir);
      }

      const logoFile = fm.joinPath(
        cacheDir,
        network.name.toLowerCase() + ".png"
      );

      if (fm.fileExists(logoFile)) {
        return fm.readImage(logoFile);
      }

      // Download and cache logo
      const request = new Request(network.logoUrl);
      request.timeoutInterval = 10;
      const image = await request.loadImage();

      if (image) {
        fm.writeImage(logoFile, image);
      }

      return image;
    } catch (error) {
      console.error("Error loading network logo:", error);
      return null;
    }
  }
}

// ==================== WIDGET EXECUTION ====================

// Create and run the widget
const monitor = new AAVEHealthMonitor();
const widget = await monitor.run();

// Present the widget
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentSmall();
}

Script.complete();
