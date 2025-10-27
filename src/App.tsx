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
  ViewAgenda as ViewAgendaIcon,
  ViewStream as ViewStreamIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Edit as EditIcon,
  Check as CheckIcon,
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
        main: mode === "dark" ? "#eaebf0" : "#383d50",
      },
      secondary: {
        main: mode === "dark" ? "#00d4aa" : "#00d4aa",
      },
      background: {
        default: mode === "dark" ? "#1a2030" : "#f1f1f3",
        paper: mode === "dark" ? "#292e42" : "#ffffff",
      },
      text: {
        primary: mode === "dark" ? "#eaebf0" : "#383d50",
        secondary: mode === "dark" ? "#8b8b8b" : "#6b7280",
      },
      success: {
        main: mode === "dark" ? "#00d4aa" : "#00d4aa",
        light:
          mode === "dark" ? "rgba(0, 212, 170, 0.1)" : "rgba(0, 212, 170, 0.1)",
        dark: mode === "dark" ? "#00d4aa" : "#00d4aa",
      },
      warning: {
        main: mode === "dark" ? "#ffa726" : "#ffa726",
        light:
          mode === "dark"
            ? "rgba(255, 167, 38, 0.1)"
            : "rgba(255, 167, 38, 0.1)",
        dark: mode === "dark" ? "#ffa726" : "#ffa726",
      },
      error: {
        main: mode === "dark" ? "#ff6b6b" : "#ff6b6b",
        light:
          mode === "dark"
            ? "rgba(255, 107, 107, 0.1)"
            : "rgba(255, 107, 107, 0.1)",
        dark: mode === "dark" ? "#ff6b6b" : "#ff6b6b",
      },
      info: {
        main: mode === "dark" ? "#4fc3f7" : "#4fc3f7",
        light:
          mode === "dark"
            ? "rgba(79, 195, 247, 0.1)"
            : "rgba(79, 195, 247, 0.1)",
        dark: mode === "dark" ? "#4fc3f7" : "#4fc3f7",
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: 14,
      h6: {
        fontSize: "1.125rem",
        fontWeight: 600,
      },
      body1: {
        fontSize: "0.875rem",
        fontWeight: 400,
      },
      body2: {
        fontSize: "0.75rem",
        fontWeight: 400,
      },
      caption: {
        fontSize: "0.6875rem",
        fontWeight: 400,
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow:
              mode === "dark"
                ? "0 2px 8px rgba(0, 0, 0, 0.3)"
                : "0 2px 8px rgba(0, 0, 0, 0.08)",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow:
              mode === "dark"
                ? "0 2px 8px rgba(0, 0, 0, 0.3)"
                : "0 2px 8px rgba(0, 0, 0, 0.08)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 8,
              fontSize: "0.875rem",
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontSize: "0.75rem",
            fontWeight: 500,
          },
        },
      },
    },
  });

interface AppProps {
  closeSidePanel?: () => void;
  isSidePanel?: boolean;
}

function App({ closeSidePanel, isSidePanel: isSidePanelProp }: AppProps = {}) {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [userData, setUserData] = useState<{ [key: string]: any }>({});
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState<string>("");
  const [starredAddress, setStarredAddress] = useState<string>("");
  const [newAddress, setNewAddress] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("ethereum");
  const [privacyMode, setPrivacyMode] = useState(false);
  const [hideDetails, setHideDetails] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [addressLabels, setAddressLabels] = useState<{ [key: string]: string }>(
    {}
  );
  const [editingLabel, setEditingLabel] = useState<string>("");
  const [labelInput, setLabelInput] = useState<string>("");
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
    if (isSidePanelProp !== undefined) {
      setIsSidePanel(isSidePanelProp);
    } else {
      const isSidePanelContainer =
        document.querySelector(".sidepanel-container") !== null;
      setIsSidePanel(isSidePanelContainer);
    }
  }, [isSidePanelProp]);

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
        "hideDetails",
        "addressLabels",
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
            // Auto-collapse if addresses exist
            if (convertedAddresses.length > 0) {
              setIsHeaderCollapsed(true);
            }
          } else {
            setAddresses(result.savedAddresses);
            // Auto-collapse if addresses exist
            if (result.savedAddresses.length > 0) {
              setIsHeaderCollapsed(true);
            }
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
        if (result.hideDetails !== undefined) {
          setHideDetails(result.hideDetails);
        }
        if (result.addressLabels) {
          setAddressLabels(result.addressLabels);
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
    browserAPI.storage.local.get(["privacyMode", "hideDetails"], (result) => {
      if (result.privacyMode !== undefined) {
        setPrivacyMode(result.privacyMode);
      }
      if (result.hideDetails !== undefined) {
        setHideDetails(result.hideDetails);
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
      if (changes.hideDetails) {
        setHideDetails(changes.hideDetails.newValue);
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
    setIsHeaderCollapsed(true);
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
      <Box
        sx={{
          width: isSidePanel ? "100%" : "400px",
          maxHeight: isSidePanel ? "100vh" : "600px",
          bgcolor: "background.default",
          margin: 0,
          padding: 0,
        }}
      >
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

        <Container maxWidth={false} sx={{ py: 2, px: 2, width: "100%", mt: 0 }}>
          {/* Action buttons - always visible */}
          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
            sx={{ mt: 1, mb: 1.5 }}
          >
            <Tooltip
              title={
                isHeaderCollapsed ? "Show add address" : "Hide add address"
              }
            >
              <IconButton
                onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                size="small"
                sx={{
                  bgcolor: "background.default",
                  width: 32,
                  height: 32,
                  "&:hover": {
                    bgcolor: "background.default",
                    opacity: 0.8,
                  },
                }}
              >
                {isHeaderCollapsed ? (
                  <KeyboardArrowDownIcon fontSize="small" />
                ) : (
                  <KeyboardArrowUpIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh data">
              <IconButton
                onClick={refreshData}
                size="small"
                sx={{
                  bgcolor: "background.default",
                  width: 32,
                  height: 32,
                  "&:hover": {
                    bgcolor: "background.default",
                    opacity: 0.8,
                  },
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={privacyMode ? "Show values" : "Hide values"}>
              <IconButton
                onClick={() => {
                  const newPrivacyMode = !privacyMode;
                  setPrivacyMode(newPrivacyMode);
                  browserAPI.storage.local.set({
                    privacyMode: newPrivacyMode,
                  });
                }}
                size="small"
                sx={{
                  bgcolor: "background.default",
                  width: 32,
                  height: 32,
                  "&:hover": {
                    bgcolor: "background.default",
                    opacity: 0.8,
                  },
                }}
              >
                {privacyMode ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title={hideDetails ? "Show details" : "Hide details"}>
              <IconButton
                onClick={() => {
                  const newHideDetails = !hideDetails;
                  setHideDetails(newHideDetails);
                  browserAPI.storage.local.set({
                    hideDetails: newHideDetails,
                  });
                }}
                size="small"
                sx={{
                  bgcolor: "background.default",
                  width: 32,
                  height: 32,
                  "&:hover": {
                    bgcolor: "background.default",
                    opacity: 0.8,
                  },
                }}
              >
                {hideDetails ? (
                  <ViewStreamIcon fontSize="small" />
                ) : (
                  <ViewAgendaIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton
                onClick={() =>
                  window.open(browserAPI.runtime.getURL("public/options.html"))
                }
                size="small"
                sx={{
                  bgcolor: "background.default",
                  width: 32,
                  height: 32,
                  "&:hover": {
                    bgcolor: "background.default",
                    opacity: 0.8,
                  },
                }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {closeSidePanel && (
              <Tooltip title="Close">
                <IconButton
                  onClick={closeSidePanel}
                  size="small"
                  sx={{
                    bgcolor: "background.default",
                    width: 32,
                    height: 32,
                    "&:hover": {
                      bgcolor: "background.default",
                      opacity: 0.8,
                    },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>

          {/* Header with input - conditionally shown */}
          {!isHeaderCollapsed && (
            <Paper
              elevation={0}
              sx={{ p: 3, mb: 3, bgcolor: "background.paper" }}
            >
              <Stack spacing={2}>
                {/* Input section */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    fullWidth
                    placeholder="Enter wallet address"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addAddress()}
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "background.default",
                        height: 40,
                      },
                    }}
                  />
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Network</InputLabel>
                    <Select
                      value={selectedNetwork}
                      onChange={(e) => setSelectedNetwork(e.target.value)}
                      label="Network"
                      sx={{
                        bgcolor: "background.default",
                        height: 40,
                      }}
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
                    sx={{
                      minWidth: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "primary.main",
                      "&:hover": {
                        bgcolor: "primary.main",
                        opacity: 0.9,
                      },
                    }}
                  >
                    +
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          )}

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
                    <Card
                      key={addressKey}
                      elevation={0}
                      sx={{ mb: 3, bgcolor: "background.paper" }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        {/* Address Header */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 3,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {editingLabel === addressKey ? (
                              <TextField
                                value={labelInput}
                                onChange={(e) => setLabelInput(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    const updatedLabels = {
                                      ...addressLabels,
                                      [addressKey]: labelInput,
                                    };
                                    setAddressLabels(updatedLabels);
                                    browserAPI.storage.local.set({
                                      addressLabels: updatedLabels,
                                    });
                                    setEditingLabel("");
                                    setLabelInput("");
                                  } else if (e.key === "Escape") {
                                    setEditingLabel("");
                                    setLabelInput("");
                                  }
                                }}
                                size="small"
                                autoFocus
                                sx={{
                                  width: 150,
                                  "& .MuiOutlinedInput-root": {
                                    bgcolor: "background.default",
                                    height: 32,
                                  },
                                }}
                              />
                            ) : (
                              <Typography
                                variant="h6"
                                sx={{
                                  color: "text.primary",
                                  fontWeight: 600,
                                  fontSize: "1rem",
                                }}
                                title={addressLabels[addressKey] || address}
                              >
                                {addressLabels[addressKey] ||
                                  truncateAddress(address)}
                              </Typography>
                            )}
                            <Tooltip title="Copy address">
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(address)}
                                sx={{
                                  bgcolor: "background.default",
                                  width: 24,
                                  height: 24,
                                  "&:hover": {
                                    bgcolor: "background.default",
                                    opacity: 0.8,
                                  },
                                }}
                              >
                                <CopyIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                            {editingLabel === addressKey ? (
                              <>
                                <Tooltip title="Save label">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      const updatedLabels = {
                                        ...addressLabels,
                                        [addressKey]: labelInput,
                                      };
                                      setAddressLabels(updatedLabels);
                                      browserAPI.storage.local.set({
                                        addressLabels: updatedLabels,
                                      });
                                      setEditingLabel("");
                                      setLabelInput("");
                                    }}
                                    sx={{
                                      bgcolor: "background.default",
                                      width: 24,
                                      height: 24,
                                      "&:hover": {
                                        bgcolor: "success.main",
                                        opacity: 0.8,
                                      },
                                    }}
                                  >
                                    <CheckIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Cancel">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditingLabel("");
                                      setLabelInput("");
                                    }}
                                    sx={{
                                      bgcolor: "background.default",
                                      width: 24,
                                      height: 24,
                                      "&:hover": {
                                        bgcolor: "error.main",
                                        opacity: 0.8,
                                      },
                                    }}
                                  >
                                    <CloseIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <Tooltip title="Edit label">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingLabel(addressKey);
                                    setLabelInput(
                                      addressLabels[addressKey] || ""
                                    );
                                  }}
                                  sx={{
                                    bgcolor: "background.default",
                                    width: 24,
                                    height: 24,
                                    "&:hover": {
                                      bgcolor: "background.default",
                                      opacity: 0.8,
                                    },
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Chip
                              label={networks[network]?.name || "Ethereum"}
                              size="small"
                              sx={{
                                bgcolor: "background.default",
                                color: "text.primary",
                                border: "1px solid",
                                borderColor: "divider",
                                fontWeight: 500,
                              }}
                            />
                            <Tooltip title={isStarred ? "Unstar" : "Star"}>
                              <IconButton
                                size="small"
                                onClick={() => toggleStar(address, network)}
                                sx={{
                                  color: isStarred
                                    ? "warning.main"
                                    : "text.secondary",
                                  "&:hover": { bgcolor: "background.default" },
                                }}
                              >
                                {isStarred ? <StarIcon /> : <StarBorderIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove">
                              <IconButton
                                size="small"
                                onClick={() => removeAddress(address, network)}
                                sx={{
                                  color: "text.secondary",
                                  "&:hover": { bgcolor: "background.default" },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>

                        {/* Content */}
                        {isLoadingData ? (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              py: 2,
                            }}
                          >
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
                            {!hideDetails && (
                              <Box
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: {
                                    xs: "repeat(2, 1fr)",
                                    sm: "repeat(3, 1fr)",
                                    md: "repeat(3, 1fr)",
                                  },
                                  gap: 2,
                                  mb: 3,
                                  width: "100%",
                                }}
                              >
                                <Box sx={{ width: "100%", minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 0, fontWeight: 500 }}
                                  >
                                    Total Collateral
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 600,
                                      color: "text.primary",
                                      fontSize: "1.125rem",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    ${formatAmount(data.totalCollateral)}
                                  </Typography>
                                </Box>
                                <Box sx={{ width: "100%", minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 0, fontWeight: 500 }}
                                  >
                                    Total Debt
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 600,
                                      color: "text.primary",
                                      fontSize: "1.125rem",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    ${formatAmount(data.totalDebt)}
                                  </Typography>
                                </Box>
                                <Box sx={{ width: "100%", minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 0, fontWeight: 500 }}
                                  >
                                    Available to Borrow
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 600,
                                      color: "text.primary",
                                      fontSize: "1.125rem",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    ${formatAmount(data.availableBorrows)}
                                  </Typography>
                                </Box>
                                <Box sx={{ width: "100%", minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 0, fontWeight: 500 }}
                                  >
                                    Net Worth
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 600,
                                      color: "text.primary",
                                      fontSize: "1.125rem",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    ${formatAmount(data.netWorth)}
                                  </Typography>
                                </Box>
                                <Box sx={{ width: "100%", minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 0, fontWeight: 500 }}
                                  >
                                    Liquidation Threshold
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 600,
                                      color: "text.primary",
                                      fontSize: "1.125rem",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {data.liquidationThreshold}%
                                  </Typography>
                                </Box>
                                <Box sx={{ width: "100%", minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 0, fontWeight: 500 }}
                                  >
                                    LTV
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 600,
                                      color: "text.primary",
                                      fontSize: "1.125rem",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {data.ltv}%
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                mt: 1,
                                bgcolor:
                                  parseFloat(data.healthFactor) >=
                                  warningThreshold
                                    ? "rgba(103, 173, 92, 0.1)"
                                    : parseFloat(data.healthFactor) >=
                                        dangerThreshold
                                      ? "rgba(236, 163, 64, 0.1)"
                                      : "error.light",
                                border: "1px solid",
                                borderColor:
                                  parseFloat(data.healthFactor) >=
                                  warningThreshold
                                    ? "#67ad5c"
                                    : parseFloat(data.healthFactor) >=
                                        dangerThreshold
                                      ? "#eca340"
                                      : "error.main",
                              }}
                            >
                              <Typography
                                variant="h6"
                                align="center"
                                sx={{
                                  fontWeight: 600,
                                  color:
                                    parseFloat(data.healthFactor) >=
                                    warningThreshold
                                      ? "#67ad5c"
                                      : parseFloat(data.healthFactor) >=
                                          dangerThreshold
                                        ? "#eca340"
                                        : "error.main",
                                  fontSize: "1rem",
                                }}
                              >
                                Health Factor:{" "}
                                {parseFloat(data.totalDebt) === 0
                                  ? "No Debt"
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
            Made with
            <HeartIcon
              sx={{
                fontSize: 12,
                color: "red",
                marginRight: "3px",
                marginLeft: "2px",
              }}
            />
            by{" "}
            <Typography
              component="a"
              href="https://notrustverify.ch"
              target="_blank"
              rel="noopener noreferrer"
              variant="caption"
              color="primary.main"
              sx={{
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
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
