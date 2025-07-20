import { ethers } from "ethers";
import browserAPI from "./browserAPI";

// Format large numbers with K/M suffix
export const formatLargeNumber = (value: string | number): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (numValue >= 1e9) {
    return (numValue / 1e9).toFixed(0) + "B";
  } else if (numValue >= 1e6) {
    return (numValue / 1e6).toFixed(0) + "M";
  } else if (numValue >= 1e3) {
    return (numValue / 1e3).toFixed(0) + "K";
  } else {
    return numValue.toFixed(1);
  }
};

export const updateBadge = (data: any) => {
  // Get user data and badge display preference from storage
  browserAPI.storage.local.get(
    ["warningThreshold", "dangerThreshold", "badgeDisplay"],
    (result) => {
      const warningThreshold = result.warningThreshold || 2;
      const dangerThreshold = result.dangerThreshold || 1;
      const badgeDisplay = result.badgeDisplay || "healthFactor";

      const userData = {
        totalCollateral: ethers.formatUnits(data.totalCollateralBase, 8),
        totalDebt: ethers.formatUnits(data.totalDebtBase, 8),
        availableBorrows: ethers.formatUnits(data.availableBorrowsBase, 8),
        netWorth: ethers.formatUnits(
          data.totalCollateralBase - data.totalDebtBase,
          8
        ),
        liquidationThreshold: ethers.formatUnits(
          data.currentLiquidationThreshold,
          2
        ),
        ltv: ethers.formatUnits(data.ltv, 2),
        healthFactor: ethers.formatUnits(data.healthFactor, 18),
      };

      // Default to health factor
      const hf = parseFloat(userData.healthFactor);
      let badgeText = hf.toFixed(2);
      console.log("badgeText", hf);
      let color = "#649dfa"; // Blue color for non-health factor metrics

      // Determine badge text based on selected display option
      switch (badgeDisplay) {
        case "totalCollateralBase":
          if (userData.totalCollateral) {
            badgeText = formatLargeNumber(userData.totalCollateral);
          }
          break;
        case "totalDebtBase":
          if (parseFloat(userData.totalDebt) <= 0) {
            badgeText = "ND";
            color = "#4CAF50";
          } else {
            badgeText = formatLargeNumber(userData.totalDebt);
          }
          break;
        case "availableBorrowsBase":
          if (userData.availableBorrows) {
            badgeText = formatLargeNumber(userData.availableBorrows);
          }
          break;
        case "netWorth":
          if (userData.netWorth) {
            badgeText = formatLargeNumber(userData.netWorth);
          }
          break;
        case "currentLiquidationThreshold":
          if (userData.liquidationThreshold) {
            badgeText =
              parseFloat(userData.liquidationThreshold).toFixed(0) + "%";
          }
          break;
        case "ltv":
          if (userData.ltv) {
            badgeText = parseFloat(userData.ltv).toFixed(0) + "%";
          }
          break;
        case "healthFactor":
        default:
          console.log("totalDebt", userData.totalDebt);
          // Check for no debt
          if (parseFloat(userData.totalDebt) <= 0) {
            badgeText = "ND";
            color = "#4CAF50";
            break;
          }

          badgeText = hf.toFixed(2);
          // Set color based on health factor thresholds
          color = "#4CAF50"; // Blue color for non-health factor metrics
          if (hf <= dangerThreshold) {
            color = "#f44336"; // Red for danger
          } else if (hf <= warningThreshold) {
            color = "#FFA726"; // Orange for warning
          }
          break;
      }

      // Ensure badge text is not too long
      if (
        badgeText.endsWith("K") ||
        badgeText.endsWith("M") ||
        badgeText.endsWith("B")
      ) {
        if (badgeText.length > 5) {
          badgeText = badgeText.substring(0, 4) + badgeText.slice(-1);
        }
      } else if (badgeText.endsWith("%")) {
        if (badgeText.length > 5) {
          badgeText = badgeText.substring(0, 3) + "%";
        }
      } else {
        if (badgeText.length > 5) {
          badgeText = badgeText.substring(0, 5);
        }
      }

      console.log("hf", badgeText, userData);

      browserAPI.action.setBadgeText({ text: badgeText });
      browserAPI.action.setBadgeBackgroundColor({ color });
    }
  );
};
