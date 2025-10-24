/// <reference types="chrome"/>
import "reflect-metadata";
import "./App.css";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import browserAPI from "./utils/browserAPI";
import networks from "./config/networks";
import { POOL_ABI } from "./config/abi";
import { updateBadge } from "./utils/utils";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Settings as SettingsIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Favorite as HeartIcon,
} from "@mui/icons-material";

// Interface for address data including network
interface AddressData {
  address: string;
  network: string;
}

// Create theme
const createAppTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "dark" ? "#ffffff" : "#212121",
      },
      secondary: {
        main: mode === "dark" ? "#ff5252" : "#c62828",
      },
      background: {
        default: mode === "dark" ? "#121212" : "#f5f5f5",
        paper: mode === "dark" ? "#1e1e1e" : "#ffffff",
      },
      text: {
        primary: mode === "dark" ? "#ffffff" : "#212121",
        secondary: mode === "dark" ? "#b0b0b0" : "#757575",
      },
      success: {
        main: mode === "dark" ? "#4caf50" : "#2e7d32",
        light: mode === "dark" ? "rgba(76, 175, 80, 0.2)" : "rgba(46, 125, 50, 0.1)",
        dark: mode === "dark" ? "#4caf50" : "#2e7d32",
      },
      warning: {
        main: mode === "dark" ? "#ff9800" : "#e65100",
        light: mode === "dark" ? "rgba(255, 152, 0, 0.2)" : "rgba(230, 81, 0, 0.1)",
        dark: mode === "dark" ? "#ff9800" : "#e65100",
      },
      error: {
        main: mode === "dark" ? "#f44336" : "#c62828",
        light: mode === "dark" ? "rgba(244, 67, 54, 0.2)" : "rgba(198, 40, 40, 0.1)",
        dark: mode === "dark" ? "#f44336" : "#c62828",
      },
      info: {
        main: mode === "dark" ? "#2196f3" : "#1565c0",
        light: mode === "dark" ? "rgba(33, 150, 243, 0.2)" : "rgba(21, 101, 192, 0.1)",
        dark: mode === "dark" ? "#2196f3" : "#1565c0",
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: 13,
      h6: {
        fontSize: '1rem',
      },
      body1: {
        fontSize: '0.875rem',
      },
      body2: {
        fontSize: '0.75rem',
      },
      caption: {
        fontSize: '0.6875rem',
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === "dark" 
              ? "0 4px 20px rgba(0, 0, 0, 0.3)" 
              : "0 4px 20px rgba(0, 0, 0, 0.1)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 500,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 8,
            },
          },
        },
      },
    },
  });

function App() {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [userData, setUserData] = useState<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState<string>("");
  const [starredAddress, setStarredAddress] = useState<string>("");
  const [newAddress, setNewAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("ethereum");
  const [privacyMode, setPrivacyMode] = useState(false);
  const [locale, setLocale] = useState(navigator.language);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [warningThreshold, setWarningThreshold] = useState(2);
  const [dangerThreshold, setDangerThreshold] = useState(1);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });
  const [isSidePanel, setIsSidePanel] = useState(false);

  const muiTheme = createAppTheme(theme);

  // Detect if running in side panel
  useEffect(() => {
    const isSidePanelContainer =
      document.querySelector(".sidepanel-container") !== null;
    setIsSidePanel(isSidePanelContainer);
  }, []);

  // Load initial addresses, starred address, and locale from chrome storage
  useEffect(() => {
    browserAPI.storage.local
      .get([
        "savedAddresses",
        "starredAddress",
        "locale",
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
        if (result.locale) {
          setLocale(result.locale);
        }
        if (result.selectedNetwork) {
          setSelectedNetwork(result.selectedNetwork);
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

      if (changes.locale) {
        setLocale(changes.locale.newValue);
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


  const formatNumber = (value: string | number) => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currency: "USD",
      currencyDisplay: "code",
      useGrouping: true,
    }).format(Number(value));
  };

  const toggleStar = async (address: string, network: string) => {
    const addressKey = `${address}-${network}`;
    const newStarred = starredAddress === addressKey ? "" : addressKey;
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
    if (
      !newAddress ||
      addresses.some(
        (a) => a.address === newAddress && a.network === selectedNetwork
      )
    )
      return;

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

  const removeAddress = async (
    addressToRemove: string,
    networkToRemove?: string
  ) => {
    const updatedAddresses = addresses.filter((a) => {
      if (networkToRemove) {
        // Remove specific address+network combination
        return !(
          a.address === addressToRemove && a.network === networkToRemove
        );
      } else {
        // Remove all instances of this address (backward compatibility)
        return a.address !== addressToRemove;
      }
    });
    setAddresses(updatedAddresses);
    await browserAPI.storage.local.set({ savedAddresses: updatedAddresses });

    // Remove data for this address
    const updatedUserData = { ...userData };
    if (networkToRemove) {
      delete updatedUserData[`${addressToRemove}-${networkToRemove}`];
    } else {
      // Remove all instances of this address (backward compatibility)
      Object.keys(updatedUserData).forEach((key) => {
        if (key.startsWith(`${addressToRemove}-`)) {
          delete updatedUserData[key];
        }
      });
    }
    setUserData(updatedUserData);

    // Clear starred address if removed
    const addressKey = networkToRemove
      ? `${addressToRemove}-${networkToRemove}`
      : addressToRemove;
    if (
      starredAddress === addressKey ||
      (networkToRemove === undefined &&
        starredAddress.startsWith(`${addressToRemove}-`))
    ) {
      setStarredAddress("");
      await browserAPI.storage.local.set({ starredAddress: "" });
      browserAPI.action.setBadgeText({ text: "" });
    }
  };


  const getUserData = async (
    userAddress: string,
    networkKey: string = "ethereum"
  ) => {
    if (!userAddress) return;

    const userDataKey = `${userAddress}-${networkKey}`;
    setIsLoading((prev) => ({ ...prev, [userDataKey]: true }));
    // Clear any previous errors for this address
    setErrors((prev) => ({ ...prev, [userDataKey]: "" }));
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

      const userDataKey = `${userAddress}-${networkKey}`;
      setUserData((prev) => ({ ...prev, [userDataKey]: formatted }));

      // Only update badge if this is the starred address
      const addressKey = `${userAddress}-${networkKey}`;
      if (starredAddress === addressKey) {
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

      setErrors((prev) => ({ ...prev, [userDataKey]: errorMessage }));

      const addressKey = `${userAddress}-${networkKey}`;
      if (starredAddress === addressKey) {
        browserAPI.action.setBadgeText({ text: "ERR" });
        browserAPI.action.setBadgeBackgroundColor({ color: "#f44336" });
      }
    } finally {
      setIsLoading((prev) => ({ ...prev, [userDataKey]: false }));
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


  console.log(selectedNetwork);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ 
        width: isSidePanel ? "100%" : "400px", 
        maxHeight: isSidePanel ? "100vh" : "600px", 
        bgcolor: "background.default",
        margin: 0,
        padding: 0
      }}>
        {/* Global Error Alert */}
        {globalError && (
          <Alert
            severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setGlobalError("")}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ m: 0, mt: 0 }}
          >
            {globalError}
          </Alert>
        )}

        {/* Toast notification */}
        <Snackbar
          open={toast.visible}
          autoHideDuration={3000}
          onClose={() => setToast({ message: "", visible: false })}
          message={toast.message}
        />

        <Container maxWidth={false} sx={{ py: 0, px: 0, width: "100%", mt: 0 }}>
          {/* Header with input and actions */}
          <Paper elevation={3} sx={{ p: 1, mb: 1, mt: 0 }}>
            <Stack spacing={1}>
              {/* Input section */}
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  placeholder="Enter wallet address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addAddress()}
                  size="small"
                />
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Network</InputLabel>
                  <Select
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value)}
                    label="Network"
                  >
                    {Object.keys(networks).map((key) => (
                      <MenuItem key={key} value={key}>
                        {networks[key].name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={addAddress}
                  disabled={!newAddress}
                  size="small"
                  sx={{ minWidth: "auto", px: 1 }}
                >
                  +
                </Button>
              </Stack>

              {/* Action buttons */}
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Tooltip title="Refresh data">
                  <IconButton onClick={refreshData} color="primary">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={privacyMode ? "Show values" : "Hide values"}>
                  <IconButton
                    onClick={() => {
                      const newPrivacyMode = !privacyMode;
                      setPrivacyMode(newPrivacyMode);
                      browserAPI.storage.local.set({ privacyMode: newPrivacyMode });
                    }}
                    color="primary"
                  >
                    {privacyMode ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Settings">
                  <IconButton
                    onClick={() =>
                      window.open(browserAPI.runtime.getURL("public/options.html"))
                    }
                    color="primary"
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>

          {/* Addresses List */}
          <Stack>
            {addresses.length === 0 ? (
              <Paper elevation={1} sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No addresses added yet. Add an address to monitor.
                </Typography>
              </Paper>
            ) : (
              // Sort addresses to keep starred address on top
              [...addresses]
                .sort((a, b) => {
                  const aKey = `${a.address}-${a.network}`;
                  const bKey = `${b.address}-${b.network}`;
                  if (aKey === starredAddress) return -1;
                  if (bKey === starredAddress) return 1;
                  return 0;
                })
                .map(({ address, network }) => {
                  const addressKey = `${address}-${network}`;
                  const isLoadingData = isLoading[addressKey];
                  const error = errors[addressKey];
                  const data = userData[addressKey];
                  const isStarred = starredAddress === addressKey;

                  return (
                    <Card key={addressKey} elevation={2} sx={{ mb: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        {/* Address Header */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1.5,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ 
                                fontFamily: "monospace",
                                color: "primary.main",
                                fontWeight: 600
                              }}
                              title={address}
                            >
                              {truncateAddress(address)}
                            </Typography>
                            <Tooltip title="Copy address">
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(address)}
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Chip
                              label={networks[network]?.name || "Ethereum"}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Tooltip title={isStarred ? "Unstar" : "Star"}>
                              <IconButton
                                size="small"
                                onClick={() => toggleStar(address, network)}
                                color={isStarred ? "warning" : "default"}
                              >
                                {isStarred ? <StarIcon /> : <StarBorderIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove">
                              <IconButton
                                size="small"
                                onClick={() => removeAddress(address, network)}
                                sx={{ color: "primary.main" }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>

                        {/* Content */}
                        {isLoadingData ? (
                          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                            <CircularProgress size={24} />
                            <Typography variant="body2" sx={{ ml: 2 }}>
                              Loading...
                            </Typography>
                          </Box>
                        ) : error ? (
                          <Alert
                            severity="error"
                            action={
                              <Button
                                size="small"
                                onClick={() => getUserData(address, network)}
                              >
                                Retry
                              </Button>
                            }
                          >
                            {error}
                          </Alert>
                        ) : data ? (
                          <Box>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                              <Box sx={{ flex: "1 1 180px", minWidth: 0 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Total Collateral
                                </Typography>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: "primary.main"
                                  }}
                                >
                                  ${formatAmount(data.totalCollateral)}
                                </Typography>
                              </Box>
                              <Box sx={{ flex: "1 1 180px", minWidth: 0 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Total Debt
                                </Typography>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: "primary.main"
                                  }}
                                >
                                  ${formatAmount(data.totalDebt)}
                                </Typography>
                              </Box>
                              <Box sx={{ flex: "1 1 180px", minWidth: 0 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Available to Borrow
                                </Typography>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: "primary.main"
                                  }}
                                >
                                  ${formatAmount(data.availableBorrows)}
                                </Typography>
                              </Box>
                              <Box sx={{ flex: "1 1 180px", minWidth: 0 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Net Worth
                                </Typography>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: "primary.main"
                                  }}
                                >
                                  ${formatAmount(data.netWorth)}
                                </Typography>
                              </Box>
                              <Box sx={{ flex: "1 1 180px", minWidth: 0 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Liquidation Threshold
                                </Typography>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: "primary.main"
                                  }}
                                >
                                  {data.liquidationThreshold}%
                                </Typography>
                              </Box>
                              <Box sx={{ flex: "1 1 180px", minWidth: 0 }}>
                                <Typography variant="caption" color="text.secondary">
                                  LTV
                                </Typography>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: "text.primary"
                                  }}
                                >
                                  {data.ltv}%
                                </Typography>
                              </Box>
                            </Box>
                            <Divider sx={{ my: 1.5 }} />
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: parseFloat(data.healthFactor) >= warningThreshold
                                  ? "success.light"
                                  : parseFloat(data.healthFactor) >= dangerThreshold
                                  ? "warning.light"
                                  : "error.light",
                                color: parseFloat(data.healthFactor) >= warningThreshold
                                  ? "success.dark"
                                  : parseFloat(data.healthFactor) >= dangerThreshold
                                  ? "warning.dark"
                                  : "error.dark",
                              }}
                            >
                              <Typography variant="body1" align="center" sx={{ fontWeight: 600 }}>
                                Health Factor:{" "}
                                {parseFloat(data.totalDebt) === 0
                                  ? "No debt"
                                  : formatNumber(data.healthFactor)}
                              </Typography>
                            </Box>
                          </Box>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </Stack>
        </Container>

        {/* Footer */}
        <Box
          sx={{
            mt: 2,
            py: 1,
            textAlign: "center",
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Made with{" "}
            <HeartIcon sx={{ fontSize: 12, color: "secondary.main", mx: 0.5 }} />
            by{" "}
            <Typography
              component="a"
              href="https://notrustverify.ch"
              target="_blank"
              rel="noopener noreferrer"
              variant="caption"
              color="primary.main"
              sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
            >
              No Trust Verify
            </Typography>
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
