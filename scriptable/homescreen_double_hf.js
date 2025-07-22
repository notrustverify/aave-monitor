// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: magic;

// AAVE Monitor - Scriptable Widget - Home Screen Two Accounts Health Factor

// ==================== CONFIGURATION ====================
// =============== You can edit this part ================

const USER_CONFIG = {
  addresses: [
    {
      // #0 address
      address: "0xe9dC0C1508619557bE43c79Ec867cb1d6b25aeFa", // Replace with your address
      network: "ethereum",
      label: "Demo Core Market", // Optional label for identification
    },
    {
      // #1 address
      address: "0xFe13988736d95D052C2E45e5b4E1Ef2e2750b7F4", // Replace with your address
      network: "gnosis",
      label: "Demo Gnosis Market", // Optional label for identification
    },
  ],

  // Addresses shown in the widget (here #0 and #1)
  primaryAddressIndices: [0, 1],

  // Health factor thresholds for color coding
  warningThreshold: 2.999, // Orange warning below this value
  dangerThreshold: 1.499, // Red danger below this value

  // Widget appearance
  darkMode: true,

  // Logo settings
  showLogo: true, // Show network logo
  logoSize: 28, // Logo size in pixels
  cacheLogo: true, // Cache logos for offline use

  // Data caching settings
  cacheData: true, // Cache data for offline viewing
  cacheMaxAge: 10, // Maximum age in minutes before data is considered stale

  // Smart refresh settings
  refreshSettings: {
    healthyRefreshInterval: 60,
    warningRefreshInterval: 30,
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
      // Address indices to fetch data
      const indices = USER_CONFIG.primaryAddressIndices || [0];
      const addresses = indices
        .map((idx) => USER_CONFIG.addresses[idx])
        .filter(Boolean);
      if (addresses.length === 0) throw new Error("No address selected");

      // Parallel fetch data for all addresses
      const dataList = await Promise.all(
        addresses.map((addr) => this.fetchAAVEData(addr))
      );

      // Shows both addresses in the widget
      await this.createMultiWidget(dataList, addresses);

      // Refresh based on HF
      const minHealth = Math.min(
        ...dataList.map((d) =>
          typeof d.healthFactor === "number" ? d.healthFactor : 100
        )
      );
      this.setSmartRefreshInterval(minHealth, addresses[0].network);
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
    const finalInterval = Math.max(
      1,
      Math.round(baseInterval * networkMultiplier)
    );
    const refreshDate = new Date();
    refreshDate.setMinutes(refreshDate.getMinutes() + finalInterval);
    this.widget.refreshAfterDate = refreshDate;
    console.log(
      `Smart refresh: ${finalInterval} minutes (base: ${baseInterval}, network: ${network}, multiplier: ${networkMultiplier})`
    );
  }

  async createMultiWidget(dataList, addressConfigs) {
    this.widget.backgroundColor = this.backgroundColor;
    this.widget.setPadding(8, 30, 12, 12);
    const mainStack = this.widget.addStack();
    mainStack.layoutVertically();
    mainStack.centerAlignContent();
    for (let i = 0; i < dataList.length; i++) {
      const subStack = mainStack.addStack();
      subStack.layoutVertically();
      subStack.centerAlignContent();
      subStack.addSpacer(8);
      await this.renderSingleAddress(subStack, dataList[i], addressConfigs[i]);
      if (i < dataList.length - 1) mainStack.addSpacer(1);
    }
    const updateText = this.widget.addText(
      `${new Date().toLocaleTimeString()}`
    );
    updateText.font = Font.systemFont(8);
    updateText.textColor = this.grayColor;
  }

  // Compact display per address
  async renderSingleAddress(stack, data, addressConfig) {
    const network = NETWORKS[addressConfig.network];

    // Horizontal line for Logo and HF
    const horizontalStack = stack.addStack();
    horizontalStack.layoutHorizontally();
    horizontalStack.centerAlignContent();

    // Network Logo
    if (USER_CONFIG.showLogo && network.logoUrl) {
      try {
        const logo = await this.getNetworkLogo(network);
        if (logo) {
          const logoImage = horizontalStack.addImage(logo);
          logoImage.imageSize = new Size(
            USER_CONFIG.logoSize,
            USER_CONFIG.logoSize
          );
          logoImage.centerAlignImage();
        }
      } catch (error) {
        console.error("Error loading logo:", error);
      }
      horizontalStack.addSpacer(12);
    }

    // Health factor
    const healthText = horizontalStack.addText(
      typeof data.healthFactor === "number"
        ? data.healthFactor.toFixed(2)
        : data.healthFactor.toString()
    );
    healthText.font = Font.boldSystemFont(28);
    healthText.textColor = this.getHealthFactorColor(data.healthFactor);
    healthText.centerAlignText();

    stack.addSpacer(6);

    // Label
    if (addressConfig.label) {
      const labelText = stack.addText(addressConfig.label);
      labelText.font = Font.systemFont(10);
      labelText.textColor = this.grayColor;
      labelText.centerAlignText();
    }
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

  getHealthFactorColor(healthFactor) {
    if (
      healthFactor === "∞" ||
      healthFactor === Infinity ||
      healthFactor > 10
    ) {
      return new Color("#4CAF50"); // Green
    } else if (healthFactor >= USER_CONFIG.warningThreshold) {
      return new Color("#4CAF50"); // Green
    } else if (healthFactor >= USER_CONFIG.dangerThreshold) {
      return new Color("#FF9500"); // Orange
    } else {
      return new Color("#FF3B30"); // Red
    }
  }

  async fetchAAVEData(addressConfig) {
    const network = NETWORKS[addressConfig.network];
    if (!network)
      throw new Error(`Unsupported network: ${addressConfig.network}`);
    const cacheKey = `aave_${addressConfig.address}_${addressConfig.network}`;
    const cachedData = await this.getCachedData(cacheKey);
    if (cachedData) return cachedData;
    const data = await this.fetchFreshData(addressConfig, network);
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
    request.headers = { "Content-Type": "application/json" };
    request.body = JSON.stringify(rpcData);
    request.timeoutInterval = 30;
    const response = await request.loadJSON();
    if (response.error) throw new Error(`RPC Error: ${response.error.message}`);
    return this.parseResponse(response.result, addressConfig, network);
  }

  buildCallData(address) {
    // Function signature for getUserAccountData(address)
    const funcSig = "0xbf92857c";
    const cleanAddress = address.toLowerCase().replace("0x", "");
    const paddedAddress = cleanAddress.padStart(64, "0");
    return funcSig + paddedAddress;
  }

  parseResponse(result, addressConfig, network) {
    const cleanResult = result.replace("0x", "");
    const totalCollateralBase = BigInt("0x" + cleanResult.substr(0, 64));
    const totalDebtBase = BigInt("0x" + cleanResult.substr(64, 64));
    const availableBorrowsBase = BigInt("0x" + cleanResult.substr(128, 64));
    const currentLiquidationThreshold = BigInt(
      "0x" + cleanResult.substr(192, 64)
    );
    const ltv = BigInt("0x" + cleanResult.substr(256, 64));
    const healthFactor = BigInt("0x" + cleanResult.substr(320, 64));
    const totalCollateralUSD = Number(totalCollateralBase) / 1e8;
    const totalDebtUSD = Number(totalDebtBase) / 1e8;
    const availableBorrowsUSD = Number(availableBorrowsBase) / 1e8;
    const liquidationThreshold = Number(currentLiquidationThreshold) / 10000;
    const ltvRatio = Number(ltv) / 10000;
    let healthFactorValue;
    if (
      healthFactor ===
      BigInt(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ) {
      healthFactorValue = "∞";
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
      if (!fm.fileExists(cacheDir)) return null;
      const cacheFile = fm.joinPath(cacheDir, key + ".json");
      if (!fm.fileExists(cacheFile)) return null;
      const cacheContent = fm.readString(cacheFile);
      const cacheData = JSON.parse(cacheContent);
      const cacheAge = (Date.now() - cacheData.timestamp) / 1000 / 60;
      if (cacheAge > USER_CONFIG.cacheMaxAge) return null;
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
      if (!fm.fileExists(cacheDir)) fm.createDirectory(cacheDir);
      const cacheFile = fm.joinPath(cacheDir, key + ".json");
      const cacheContent = { timestamp: Date.now(), data: data };
      fm.writeString(cacheFile, JSON.stringify(cacheContent));
    } catch (error) {
      console.error("Error writing cache:", error);
    }
  }

  async getNetworkLogo(network) {
    if (!USER_CONFIG.cacheLogo) {
      const request = new Request(network.logoUrl);
      return await request.loadImage();
    }
    try {
      const fm = FileManager.local();
      const cacheDir = fm.joinPath(fm.documentsDirectory(), "aave-logos");
      if (!fm.fileExists(cacheDir)) fm.createDirectory(cacheDir);
      const logoFile = fm.joinPath(
        cacheDir,
        network.name.toLowerCase() + ".png"
      );
      if (fm.fileExists(logoFile)) return fm.readImage(logoFile);
      const request = new Request(network.logoUrl);
      request.timeoutInterval = 10;
      const image = await request.loadImage();
      if (image) fm.writeImage(logoFile, image);
      return image;
    } catch (error) {
      console.error("Error loading network logo:", error);
      return null;
    }
  }
}

// ==================== WIDGET EXECUTION ====================

const monitor = new AAVEHealthMonitor();
const widget = await monitor.run();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentSmall();
}
Script.complete();
