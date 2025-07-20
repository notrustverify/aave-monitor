import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import "./App.css";
import browserAPI from "./utils/browserAPI";

// Side Panel specific component
const SidePanel: React.FC = () => {
  // Function to close the side panel
  const closeSidePanel = () => {
    // Send message before closing
    browserAPI.runtime
      .sendMessage({ action: "sidePanelClosed" })
      .then(() => {
        // The Chrome API doesn't have a direct sidePanel.close() method
        // Using window.close() is the recommended way to close the side panel
        window.close();
      })
      .catch((error) => {
        console.error("Error sending side panel closed notification:", error);
        window.close();
      });
  };

  // Set document title and notify background script when side panel is opened/closed
  useEffect(() => {
    // Add a class to the body for side panel specific styling
    document.body.classList.add("sidepanel-body");

    // Notify background script that side panel is opened
    browserAPI.runtime
      .sendMessage({ action: "sidePanelOpened" })
      .then((response) => {
        console.log("Side panel opened notification sent:", response);
      })
      .catch((error) => {
        console.error("Error sending side panel opened notification:", error);
      });

    // Add an event listener for the beforeunload event
    const handleBeforeUnload = () => {
      browserAPI.runtime
        .sendMessage({ action: "sidePanelClosed" })
        .catch((error) => {
          console.error("Error sending side panel closed notification:", error);
        });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.body.classList.remove("sidepanel-body");
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div className="sidepanel-container">
      <div className="sidepanel-header">
        <h2 className="sidepanel-title">Aave Monitor</h2>
        <button
          className="close-button"
          onClick={closeSidePanel}
          title="Close side panel"
        >
          <img src="../public/assets/close.svg" alt="Close" />
        </button>
      </div>
      <App />
    </div>
  );
};

// Create root container and render the Side Panel component
const root = document.getElementById("root");
if (root) {
  const reactRoot = ReactDOM.createRoot(root);
  reactRoot.render(
    <React.StrictMode>
      <SidePanel />
    </React.StrictMode>
  );
}
