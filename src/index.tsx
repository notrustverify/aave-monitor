import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}
const rootDiv = ReactDOM.createRoot(rootElement);
rootDiv.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
