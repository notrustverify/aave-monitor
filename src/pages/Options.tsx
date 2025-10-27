/// <reference types="chrome"/>
import React, { useState, useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Typography,
  Box,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import { LightMode, DarkMode, Refresh } from "@mui/icons-material";
import browserAPI from "../utils/browserAPI";
import networks from "../config/networks";

// Create theme matching the main app
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
        main: mode === "dark" ? "#67ad5c" : "#67ad5c",
        light:
          mode === "dark"
            ? "rgba(103, 173, 92, 0.1)"
            : "rgba(103, 173, 92, 0.1)",
        dark: mode === "dark" ? "#67ad5c" : "#67ad5c",
      },
      warning: {
        main: mode === "dark" ? "#eca340" : "#eca340",
        light:
          mode === "dark"
            ? "rgba(236, 163, 64, 0.1)"
            : "rgba(236, 163, 64, 0.1)",
        dark: mode === "dark" ? "#eca340" : "#eca340",
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
      h4: {
        fontSize: "1.5rem",
        fontWeight: 600,
      },
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
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 4,
            fontWeight: 500,
            fontSize: "0.875rem",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
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
            borderRadius: 8,
            boxShadow:
              mode === "dark"
                ? "0 2px 8px rgba(0, 0, 0, 0.3)"
                : "0 2px 8px rgba(0, 0, 0, 0.08)",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 4,
              fontSize: "0.875rem",
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            fontSize: "0.875rem",
          },
        },
      },
    },
  });

function Options() {
  const [updateFrequency, setUpdateFrequency] = useState(5);
  const [rpcProvider, setRpcProvider] = useState("https://eth.public-rpc.com");
  const [locale, setLocale] = useState(navigator.language);
  const [contractAddress, setContractAddress] = useState(
    "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"
  );
  const [selectedNetwork, setSelectedNetwork] = useState<string>("ethereum");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [status, setStatus] = useState("");
  const [customRpc, setCustomRpc] = useState(false);
  const [warningThreshold, setWarningThreshold] = useState(2);
  const [dangerThreshold, setDangerThreshold] = useState(1);
  const [badgeDisplay, setBadgeDisplay] = useState<string>("healthFactor");
  const [preferSidePanel, setPreferSidePanel] = useState<boolean>(true);
  const [hideDetails, setHideDetails] = useState(false);

  const muiTheme = createAppTheme(theme);

  useEffect(() => {
    // Load saved settings
    browserAPI.storage.local.get(
      [
        "updateFrequency",
        "rpcProvider",
        "locale",
        "contractAddress",
        "selectedNetwork",
        "customRpc",
        "theme",
        "warningThreshold",
        "dangerThreshold",
        "badgeDisplay",
        "preferSidePanel",
        "hideDetails",
      ],
      (result) => {
        if (result.updateFrequency) {
          setUpdateFrequency(result.updateFrequency);
        }
        if (result.rpcProvider) {
          setRpcProvider(result.rpcProvider);
        }
        if (result.locale) {
          setLocale(result.locale);
        }
        if (result.selectedNetwork) {
          setSelectedNetwork(result.selectedNetwork);
          // Only update contract address and RPC if no custom values are set
          if (!result.customRpc && networks[result.selectedNetwork]) {
            setRpcProvider(networks[result.selectedNetwork].defaultRpcUrl);
            setContractAddress(
              networks[result.selectedNetwork].contractAddress
            );
          }
        }
        if (result.contractAddress) {
          setContractAddress(result.contractAddress);
        }
        if (result.customRpc !== undefined) {
          setCustomRpc(result.customRpc);
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
        if (result.badgeDisplay) {
          setBadgeDisplay(result.badgeDisplay);
        }
        if (result.preferSidePanel !== undefined) {
          setPreferSidePanel(result.preferSidePanel);
        }
        if (result.hideDetails !== undefined) {
          setHideDetails(result.hideDetails);
        }
      }
    );
  }, []);

  // Apply theme to document
  useEffect(() => {
    // Set body and html to full height
    document.body.style.height = "100%";
    document.documentElement.style.height = "100%";
  }, [theme]);

  const resetAllSettings = () => {
    // Reset to default values
    setSelectedNetwork("ethereum");
    setUpdateFrequency(5);
    setRpcProvider(networks.ethereum.defaultRpcUrl);
    setContractAddress(networks.ethereum.contractAddress);
    setLocale(navigator.language);
    setCustomRpc(false);
    setTheme("dark");
    setWarningThreshold(2);
    setDangerThreshold(1);
    setBadgeDisplay("healthFactor");
    setHideDetails(false);

    // Save the reset settings to storage
    browserAPI.storage.local.set({
      selectedNetwork: "ethereum",
      updateFrequency: 5,
      rpcProvider: networks.ethereum.defaultRpcUrl,
      contractAddress: networks.ethereum.contractAddress,
      locale: navigator.language,
      customRpc: false,
      theme: "dark",
      warningThreshold: 2,
      dangerThreshold: 1,
      badgeDisplay: "healthFactor",
      hideDetails: false,
    });

    // Update the alarm interval
    browserAPI.alarms.clear("healthCheck");
    browserAPI.alarms.create("healthCheck", {
      periodInMinutes: 5,
    });

    setStatus("All settings reset to defaults");
    setTimeout(() => setStatus(""), 3000);
  };

  const saveSetting = async (key: string, value: any) => {
    try {
      await browserAPI.storage.local.set({ [key]: value });
      setStatus(`${key} updated successfully`);
      setTimeout(() => setStatus(""), 2000);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      setStatus(`Error saving ${key}`);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    saveSetting("theme", newTheme);
  };

  const handleBadgeDisplayChange = (e: any) => {
    const newBadgeDisplay = e.target.value;
    setBadgeDisplay(newBadgeDisplay);
    saveSetting("badgeDisplay", newBadgeDisplay);
  };

  const handleWarningThresholdChange = (value: number) => {
    setWarningThreshold(value);
    saveSetting("warningThreshold", value);
  };

  const handleDangerThresholdChange = (value: number) => {
    setDangerThreshold(value);
    saveSetting("dangerThreshold", value);
  };

  const handleLocaleChange = (e: any) => {
    const newLocale = e.target.value;
    setLocale(newLocale);
    saveSetting("locale", newLocale);
  };

  const handleSidePanelChange = (e: any) => {
    const newPreferSidePanel = e.target.value === "sidepanel";
    setPreferSidePanel(newPreferSidePanel);
    saveSetting("preferSidePanel", newPreferSidePanel);
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box
        sx={{
          height: "100vh",
          bgcolor: "background.default",
          py: 1,
          overflow: "hidden",
        }}
      >
        <Container maxWidth="md" sx={{ height: "100%", overflow: "hidden" }}>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              Aave Monitor Settings
            </Typography>
            <Alert
              severity="success"
              sx={{
                mb: 1,
                borderRadius: 2,
                bgcolor: "success.light",
                color: "success.dark",
                py: 0.5,
              }}
            >
              Settings are saved automatically when you change them
            </Alert>
            {/* Status Message */}
            {status && (
              <Alert
                severity="success"
                onClose={() => setStatus("")}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  py: 0.5,
                  bgcolor: "success.light",
                  color: "success.dark",
                  "& .MuiAlert-message": {
                    color: "success.dark",
                    fontWeight: 500,
                  },
                }}
              >
                {status}
              </Alert>
            )}
            <Typography variant="caption" color="text.secondary">
              Configure your monitoring preferences
            </Typography>
          </Box>

          <Stack
            spacing={1.5}
            sx={{ height: "calc(100vh - 120px)", overflow: "hidden" }}
          >
            {/* Compact View Section */}
            <Card elevation={0}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  Display Mode
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={hideDetails}
                      onChange={(e) => {
                        const newHideDetails = e.target.checked;
                        setHideDetails(newHideDetails);
                        saveSetting("hideDetails", newHideDetails);
                      }}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "primary.main",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                          {
                            backgroundColor: "primary.main",
                          },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">Compact View</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Hide detailed metrics and show only health factor
                      </Typography>
                    </Box>
                  }
                />
              </CardContent>
            </Card>

            {/* Theme Section */}
            <Card elevation={0}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  Appearance
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={theme === "light"}
                      onChange={toggleTheme}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "primary.main",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                          {
                            backgroundColor: "primary.main",
                          },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {theme === "dark" ? (
                        <DarkMode fontSize="small" />
                      ) : (
                        <LightMode fontSize="small" />
                      )}
                      <Typography variant="body1">
                        {theme === "dark" ? "Dark Mode" : "Light Mode"}
                      </Typography>
                    </Box>
                  }
                />
              </CardContent>
            </Card>

            {/* Health Factor Thresholds */}
            <Card elevation={0}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  Health Factor Thresholds
                </Typography>

                <Stack direction="row" spacing={3}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1, fontWeight: 500 }}
                    >
                      Warning Threshold
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TextField
                        type="number"
                        value={warningThreshold}
                        onChange={(e) =>
                          handleWarningThresholdChange(
                            parseFloat(e.target.value)
                          )
                        }
                        inputProps={{ min: 0.1, max: 10, step: 0.1 }}
                        size="small"
                        sx={{ width: 100 }}
                      />
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          bgcolor: "warning.main",
                        }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1, fontWeight: 500 }}
                    >
                      Danger Threshold
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TextField
                        type="number"
                        value={dangerThreshold}
                        onChange={(e) =>
                          handleDangerThresholdChange(
                            parseFloat(e.target.value)
                          )
                        }
                        inputProps={{ min: 0.1, max: 10, step: 0.1 }}
                        size="small"
                        sx={{ width: 100 }}
                      />
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          bgcolor: "error.main",
                        }}
                      />
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Display Settings */}
            <Card elevation={0}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  Display Settings
                </Typography>

                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Badge Display</InputLabel>
                    <Select
                      value={badgeDisplay}
                      onChange={handleBadgeDisplayChange}
                      label="Badge Display"
                    >
                      <MenuItem value="healthFactor">Health Factor</MenuItem>
                      <MenuItem value="totalCollateralBase">
                        Total Collateral
                      </MenuItem>
                      <MenuItem value="totalDebtBase">Total Debt</MenuItem>
                      <MenuItem value="availableBorrowsBase">
                        Available to borrow
                      </MenuItem>
                      <MenuItem value="netWorth">Net Worth</MenuItem>
                      <MenuItem value="currentLiquidationThreshold">
                        Liquidation Threshold
                      </MenuItem>
                      <MenuItem value="ltv">Loan to Value</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Number Format</InputLabel>
                    <Select
                      value={locale}
                      onChange={handleLocaleChange}
                      label="Number Format"
                    >
                      <MenuItem value="en-US">, (Comma)</MenuItem>
                      <MenuItem value="de-DE">. (Period)</MenuItem>
                      <MenuItem value="fr-FR">Space</MenuItem>
                      <MenuItem value="en-CH">' (Apostrophe)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Click Behavior</InputLabel>
                    <Select
                      value={preferSidePanel ? "sidepanel" : "popup"}
                      onChange={handleSidePanelChange}
                      label="Click Behavior"
                    >
                      <MenuItem value="sidepanel">Side Panel</MenuItem>
                      <MenuItem value="popup">Popup</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Box
              sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 1 }}
            >
              <Button
                variant="outlined"
                onClick={resetAllSettings}
                startIcon={<Refresh />}
                size="small"
                sx={{
                  borderColor: "error.main",
                  color: "error.main",
                  "&:hover": {
                    borderColor: "error.main",
                    bgcolor: "error.light",
                    color: "error.main",
                  },
                }}
              >
                Reset All Settings
              </Button>
            </Box>

            {/* Footer */}
            <Box
              sx={{
                textAlign: "center",
                mt: 1,
                pt: 1,
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Made with{" "}
                <Box component="span" sx={{ color: "error.main", mx: 0.5 }}>
                  ♥
                </Box>
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
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default Options;
