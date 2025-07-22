/// <reference types="chrome"/>
import "reflect-metadata";
import "./App.css";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import browserAPI from "./utils/browserAPI";
import networks, { NetworkConfig, getAllNetworks } from "./config/networks";
import { POOL_ABI } from "./config/abi";
import { formatLargeNumber, updateBadge } from "./utils/utils";

// Interface for address data including network
interface AddressData {
  address: string;
  network: string;
}

function App() {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [userData, setUserData] = useState<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState<string>("");
  const [starredAddress, setStarredAddress] = useState<string>("");
  const [newAddress, setNewAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("ethereum");
  const [rpcProvider, setRpcProvider] = useState("https://eth.public-rpc.com");
  const [privacyMode, setPrivacyMode] = useState(false);
  const [locale, setLocale] = useState(navigator.language);
  const [contractAddress, setContractAddress] = useState(
    "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"
  );
  const [showContractInput, setShowContractInput] = useState(false);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [warningThreshold, setWarningThreshold] = useState(2);
  const [dangerThreshold, setDangerThreshold] = useState(1);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });
  const [isSidePanel, setIsSidePanel] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Function to open the sidepanel
  const openSidePanel = () => {
    if (browserAPI.sidePanel) {
      try {
        // We need to get the current tab first
        if (browserAPI.tabs && browserAPI.tabs.query) {
          browserAPI.tabs.query(
            { active: true, currentWindow: true },
            (tabs: chrome.tabs.Tab[]) => {
              if (tabs && tabs.length > 0) {
                const currentTab = tabs[0];
                // Now we can open the side panel with the correct parameters
                if (currentTab.windowId) {
                  browserAPI.sidePanel.open({ windowId: currentTab.windowId });
                  // Close the popup after opening the side panel
                  setTimeout(() => window.close(), 100);
                } else {
                  console.error("Tab has no windowId");
                  setGlobalError(
                    "Failed to open side panel: Tab has no windowId"
                  );
                }
              } else {
                console.error("No active tab found");
                setGlobalError(
                  "Failed to open side panel: No active tab found"
                );
              }
            }
          );
        } else {
          // Fallback if tabs API is not available
          console.error("Tabs API not available");
          setGlobalError("Failed to open side panel: Tabs API not available");
        }
      } catch (error: unknown) {
        console.error("Error opening side panel:", error);
        setGlobalError("Failed to open side panel");
      }
    } else {
      setGlobalError("Side panel is not supported in this browser");
    }
  };

  // Load initial addresses, starred address, rpcProvider, and locale from chrome storage
  useEffect(() => {
    browserAPI.storage.local
      .get([
        "savedAddresses",
        "starredAddress",
        "rpcProvider",
        "locale",
        "contractAddress",
        "selectedNetwork",
        "theme",
        "warningThreshold",
        "dangerThreshold",
      ])
      .then((result) => {
        if (result.savedAddresses) {
          // Convert old format to new format if needed
          if (
            Array.isArray(result.savedAddresses) &&
            result.savedAddresses.length > 0 &&
            typeof result.savedAddresses[0] === "string"
          ) {
            const defaultNetwork = result.selectedNetwork || "ethereum";
            const convertedAddresses = result.savedAddresses.map(
              (addr: string) => ({
                address: addr,
                network: defaultNetwork,
              })
            );
            setAddresses(convertedAddresses);
            // Save the converted format back to storage
            browserAPI.storage.local.set({
              savedAddresses: convertedAddresses,
            });
          } else {
            setAddresses(result.savedAddresses);
          }
        }
        if (result.starredAddress) {
          setStarredAddress(result.starredAddress);
        }
        if (result.rpcProvider) {
          setRpcProvider(result.rpcProvider);
        }
        if (result.locale) {
          setLocale(result.locale);
        }
        if (result.selectedNetwork) {
          setSelectedNetwork(result.selectedNetwork);
        }
        if (result.contractAddress) {
          setContractAddress(result.contractAddress);
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

        // If addresses exist, fetch data for them
        if (result.savedAddresses && result.savedAddresses.length > 0) {
          // Handle both old and new address format
          if (typeof result.savedAddresses[0] === "string") {
            // Old format
            const defaultNetwork = result.selectedNetwork || "ethereum";
            result.savedAddresses.forEach((addr: string) => {
              getUserData(addr, defaultNetwork);
            });
          } else {
            // New format with network
            result.savedAddresses.forEach((addrData: AddressData) => {
              getUserData(addrData.address, addrData.network);
            });
          }
        }
      });

    console.log("Contract address:", contractAddress);
    // Add listener for visibility changes to detect when popup is opened
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Handle visibility change (popup opened)
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      console.log("Popup opened, refreshing data");
      refreshData();
    }
  };

  useEffect(() => {
    // Load privacy mode state from storage
    browserAPI.storage.local.get("privacyMode", (result) => {
      if (result.privacyMode !== undefined) {
        setPrivacyMode(result.privacyMode);
      }
    });

    // Listen for changes to storage
    const handleStorageChange = (
      changes: { [key: string]: any },
      areaName: string
    ) => {
      if (areaName !== "local") return;

      if (changes.rpcProvider) {
        setRpcProvider(changes.rpcProvider.newValue);
      }
      if (changes.locale) {
        setLocale(changes.locale.newValue);
      }
      if (changes.contractAddress) {
        setContractAddress(changes.contractAddress.newValue);
      }
      if (changes.selectedNetwork) {
        setSelectedNetwork(changes.selectedNetwork.newValue);
      }
      if (changes.theme) {
        setTheme(changes.theme.newValue);
      }
      if (changes.warningThreshold) {
        setWarningThreshold(changes.warningThreshold.newValue);
      }
      if (changes.dangerThreshold) {
        setDangerThreshold(changes.dangerThreshold.newValue);
      }
    };

    browserAPI.storage.onChanged.addListener(handleStorageChange);

    // Cleanup listener on unmount
    return () => {
      browserAPI.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Detect if running in side panel
  useEffect(() => {
    const isSidePanelContainer =
      document.querySelector(".sidepanel-container") !== null;
    setIsSidePanel(isSidePanelContainer);
  }, []);

  // Update last refresh time when data is refreshed
  useEffect(() => {
    if (
      Object.keys(isLoading).length > 0 &&
      !Object.values(isLoading).some((loading) => loading)
    ) {
      setLastRefreshTime(new Date());
    }
  }, [isLoading]);

  const formatNumber = (value: string | number) => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currency: "USD",
      currencyDisplay: "code",
      useGrouping: true,
    }).format(Number(value));
  };

  const toggleStar = async (address: string) => {
    const newStarred = starredAddress === address ? "" : address;
    setStarredAddress(newStarred);
    await browserAPI.storage.local.set({ starredAddress: newStarred });

    // Update badge with starred address data if exists
    if (newStarred && userData[newStarred]) {
      updateBadge(userData[newStarred]);
    } else {
      browserAPI.action.setBadgeText({ text: "" });
    }
  };

  const addAddress = async () => {
    if (!newAddress || addresses.some((a) => a.address === newAddress)) return;

    const newAddressData = {
      address: newAddress,
      network: selectedNetwork,
    };

    const updatedAddresses = [...addresses, newAddressData];
    setAddresses(updatedAddresses);
    await browserAPI.storage.local.set({ savedAddresses: updatedAddresses });
    getUserData(newAddress, selectedNetwork);
    setNewAddress("");
  };

  const removeAddress = async (addressToRemove: string) => {
    const updatedAddresses = addresses.filter(
      (a) => a.address !== addressToRemove
    );
    setAddresses(updatedAddresses);
    await browserAPI.storage.local.set({ savedAddresses: updatedAddresses });

    // Remove data for this address
    const updatedUserData = { ...userData };
    delete updatedUserData[addressToRemove];
    setUserData(updatedUserData);

    // Clear starred address if removed
    if (addressToRemove === starredAddress) {
      setStarredAddress("");
      await browserAPI.storage.local.set({ starredAddress: "" });
      browserAPI.action.setBadgeText({ text: "" });
    }
  };

  const updateAddressNetwork = async (address: string, newNetwork: string) => {
    const updatedAddresses = addresses.map((a) =>
      a.address === address ? { ...a, network: newNetwork } : a
    );

    setAddresses(updatedAddresses);
    await browserAPI.storage.local.set({ savedAddresses: updatedAddresses });

    // Refresh data for this address with the new network
    getUserData(address, newNetwork);
  };

  const getUserData = async (
    userAddress: string,
    networkKey: string = "ethereum"
  ) => {
    if (!userAddress) return;

    setIsLoading((prev) => ({ ...prev, [userAddress]: true }));
    // Clear any previous errors for this address
    setErrors((prev) => ({ ...prev, [userAddress]: "" }));
    setGlobalError("");

    try {
      // Get network configuration
      const networkConfig = networks[networkKey];
      console.log(networkKey);
      if (!networkConfig) {
        throw new Error(`Network configuration not found for ${networkKey}`);
      }

      const provider = new ethers.JsonRpcProvider(networkConfig.defaultRpcUrl);

      const poolContract = new ethers.Contract(
        networkConfig.contractAddress,
        POOL_ABI,
        provider
      );

      const data = await poolContract.getUserAccountData(userAddress);
      const formatted = {
        totalCollateral: ethers.formatUnits(data.totalCollateralBase, 8),
        totalDebt: ethers.formatUnits(data.totalDebtBase, 8),
        availableBorrows: ethers.formatUnits(data.availableBorrowsBase, 8),
        liquidationThreshold: ethers.formatUnits(
          data.currentLiquidationThreshold,
          2
        ),
        netWorth: ethers.formatUnits(
          data.totalCollateralBase - data.totalDebtBase,
          8
        ),
        ltv: ethers.formatUnits(data.ltv, 2),
        healthFactor: ethers.formatUnits(data.healthFactor, 18),
        network: networkKey,
      };

      setUserData((prev) => ({ ...prev, [userAddress]: formatted }));

      // Only update badge if this is the starred address
      if (userAddress === starredAddress) {
        updateBadge(data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);

      // Set specific error for this address
      let errorMessage = "Failed to load data";

      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes("call revert exception")) {
          errorMessage =
            "Contract call failed. Invalid contract address or network issue.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes("Network configuration not found")) {
          errorMessage = `Network configuration not found for ${networkKey}`;
        } else {
          errorMessage = error.message;
        }
      }

      setErrors((prev) => ({ ...prev, [userAddress]: errorMessage }));

      if (userAddress === starredAddress) {
        browserAPI.action.setBadgeText({ text: "ERR" });
        browserAPI.action.setBadgeBackgroundColor({ color: "#f44336" });
      }
    } finally {
      setIsLoading((prev) => ({ ...prev, [userAddress]: false }));
    }
  };

  const refreshData = () => {
    // Clear global error when refreshing
    setGlobalError("");
    addresses.forEach((addressData) => {
      getUserData(addressData.address, addressData.network);
    });
  };

  const formatAmount = (amount: string) => {
    return privacyMode ? "****" : formatNumber(amount);
  };

  // Get network for an address
  const getAddressNetwork = (address: string): string => {
    const addressData = addresses.find((a) => a.address === address);
    return addressData ? addressData.network : "ethereum";
  };

  // Get network symbol
  const getNetworkSymbol = (networkKey: string): string => {
    return networks[networkKey]?.nativeCurrency.symbol || "ETH";
  };

  // Truncate address for display
  const truncateAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Show toast notification
        setToast({ message: "Address copied to clipboard", visible: true });
        // Hide toast after 3 seconds
        setTimeout(() => {
          setToast({ message: "", visible: false });
        }, 3000);
      })
      .catch((err) => {
        console.error("Failed to copy address: ", err);
        setToast({ message: "Failed to copy address", visible: true });
        setTimeout(() => {
          setToast({ message: "", visible: false });
        }, 3000);
      });
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    browserAPI.storage.local.set({ theme: newTheme });
  };

  // Format the last refresh time
  const formatLastRefreshTime = () => {
    if (!lastRefreshTime) return "Never";

    const now = new Date();
    const diffSeconds = Math.floor(
      (now.getTime() - lastRefreshTime.getTime()) / 1000
    );

    if (diffSeconds < 60) {
      return `${diffSeconds} seconds ago`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)} minutes ago`;
    } else {
      return lastRefreshTime.toLocaleTimeString();
    }
  };

  console.log(selectedNetwork);

  return (
    <div className="App">
      {globalError && (
        <div className="global-error">
          <div className="error-message">
            {globalError}
            <button className="close-error" onClick={() => setGlobalError("")}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast.visible && (
        <div className="toast-notification">{toast.message}</div>
      )}

      <div className="container">
        <div className="input-container">
          <div className="input-with-button">
            <input
              type="text"
              placeholder="Enter address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addAddress()}
            />
            <select
              className="network-select-small"
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
            >
              {Object.keys(networks).map((key) => (
                <option key={key} value={key}>
                  {networks[key].name}
                </option>
              ))}
            </select>
            <button className="add-button" onClick={addAddress}>
              Add
            </button>
          </div>
          <div className="action-icons">
            <img
              src="../public/assets/refresh.svg"
              alt="Refresh"
              className="action-icon"
              onClick={refreshData}
              title="Refresh data"
            />
            <img
              src="../public/assets/eye.svg"
              alt="Toggle Privacy Mode"
              className="action-icon"
              onClick={() => {
                const newPrivacyMode = !privacyMode;
                setPrivacyMode(newPrivacyMode);
                browserAPI.storage.local.set({ privacyMode: newPrivacyMode });
              }}
              title={privacyMode ? "Show values" : "Hide values"}
            />
            <img
              src="../public/assets/settings.svg"
              alt="Settings"
              className="action-icon"
              onClick={() =>
                window.open(browserAPI.runtime.getURL("public/options.html"))
              }
              title="Settings"
            />
          </div>
        </div>

        <div className="addresses-container">
          {addresses.length === 0 ? (
            <div className="error-container">
              No addresses added yet. Add an address to monitor.
            </div>
          ) : (
            // Sort addresses to keep starred address on top
            [...addresses]
              .sort((a, b) => {
                if (a.address === starredAddress) return -1;
                if (b.address === starredAddress) return 1;
                return 0;
              })
              .map(({ address, network }) => {
                return (
                  <div key={address} className="address-data">
                    {isLoading[address] ? (
                      <div className="loading">Loading...</div>
                    ) : errors[address] ? (
                      <div className="error-container">
                        <div className="address-header">
                          <div className="address-header-left">
                            <span className="truncated-address" title={address}>
                              {truncateAddress(address)}
                            </span>
                            <div
                              className="copy-icon-container"
                              onClick={() => copyToClipboard(address)}
                              title="Copy address to clipboard"
                            >
                              <svg
                                className="copy-icon"
                                viewBox="0 0 24 24"
                                width="14"
                                height="14"
                              >
                                <path
                                  fill="currentColor"
                                  d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="address-header-right">
                            <select
                              value={network}
                              onChange={(e) =>
                                updateAddressNetwork(address, e.target.value)
                              }
                              className="network-select-badge"
                              title={networks[network]?.name || "Ethereum"}
                            >
                              {getAllNetworks().map((net) => (
                                <option
                                  key={net.chainId}
                                  value={net.name.toLowerCase()}
                                  title={net.name}
                                >
                                  {net.name}
                                </option>
                              ))}
                            </select>
                            <button
                              className={`star-button ${starredAddress === address ? "starred" : ""}`}
                              onClick={() => toggleStar(address)}
                            >
                              {starredAddress === address ? "★" : "☆"}
                            </button>
                            <button
                              className="remove-button"
                              onClick={() => removeAddress(address)}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <div className="error-message">{errors[address]}</div>
                        <button
                          className="retry-button"
                          onClick={() => getUserData(address, network)}
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      userData[address] && (
                        <div className="container">
                          <div className="address-header">
                            <div className="address-header-left">
                              <span
                                className="truncated-address"
                                title={address}
                              >
                                {truncateAddress(address)}
                              </span>
                              <div
                                className="copy-icon-container"
                                onClick={() => copyToClipboard(address)}
                                title="Copy address to clipboard"
                              >
                                <svg
                                  className="copy-icon"
                                  viewBox="0 0 24 24"
                                  width="14"
                                  height="14"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div className="address-header-right">
                              <select
                                value={userData[address].network || network}
                                onChange={(e) =>
                                  updateAddressNetwork(address, e.target.value)
                                }
                                className="network-select-badge"
                                title={
                                  networks[userData[address].network || network]
                                    ?.name || "Ethereum"
                                }
                              >
                                {getAllNetworks().map((net) => (
                                  <option
                                    key={net.chainId}
                                    value={net.name.toLowerCase()}
                                    title={net.name}
                                  >
                                    {net.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                className={`star-button ${starredAddress === address ? "starred" : ""}`}
                                onClick={() => toggleStar(address)}
                              >
                                {starredAddress === address ? "★" : "☆"}
                              </button>
                              <button
                                className="remove-button"
                                onClick={() => removeAddress(address)}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                          <div className="data-row">
                            <span className="label">Total Collateral</span>
                            <span className="value">
                              ${" "}
                              {formatAmount(userData[address].totalCollateral)}
                            </span>
                          </div>
                          <div className="data-row">
                            <span className="label">Total Debt</span>
                            <span className="value">
                              $ {formatAmount(userData[address].totalDebt)}
                            </span>
                          </div>
                          <div className="data-row">
                            <span className="label">Available to Borrow</span>
                            <span className="value">
                              ${" "}
                              {formatAmount(userData[address].availableBorrows)}
                            </span>
                          </div>
                          <div className="data-row">
                            <span className="label">Net Worth</span>
                            <span className="value">
                              $ {formatAmount(userData[address].netWorth)}
                            </span>
                          </div>
                          <div className="data-row">
                            <span className="label">Liquidation Threshold</span>
                            <span className="value">
                              {userData[address].liquidationThreshold}%
                            </span>
                          </div>
                          <div className="data-row">
                            <span className="label">LTV</span>
                            <span className="value">
                              {userData[address].ltv}%
                            </span>
                          </div>
                          <div
                            className={`health-factor ${
                              parseFloat(userData[address].healthFactor) >=
                              warningThreshold
                                ? "safe"
                                : parseFloat(userData[address].healthFactor) >=
                                    dangerThreshold
                                  ? "warning"
                                  : "danger"
                            }`}
                          >
                            Health Factor:{" "}
                            {parseFloat(userData[address].totalDebt) === 0
                              ? "No debt"
                              : formatNumber(userData[address].healthFactor)}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>

      <div className="footer">
        <hr className="footer-divider" />
        <div className="footer-content">
          Made with
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

export default App;
