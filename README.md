# Aave Health Factor Extension

[![Build extensions](https://github.com/notrustverify/aave-monitor/actions/workflows/build-chrome.yml/badge.svg)](https://github.com/notrustverify/aave-monitor/actions/workflows/build-chrome.yml)

Stay on top of your Aave account with the Aave Account Monitor Chrome Extension. This tool provides real-time insights into your Aave account data, helping you manage your crypto assets more effectively.

Features:

- Real-Time Data: Automatically fetches and displays your Aave account data, including total collateral, total debt, available borrows, liquidation threshold, LTV, and health factor.
- Starred Address: Highlight a specific address to monitor its health factor directly from your browser's toolbar.
- Badge Notifications: Get visual alerts on your browser's badge for quick insights into your account's health status.
- Easy Management: Add or remove Ethereum addresses with a simple interface, and save your preferences directly in your browser.
- Monitor your Aave positions across multiple networks: supporting Ethereum, Gnosis, Arbitrum, etc

How It Works:

1. Add Addresses: Enter Ethereum addresses to monitor their Aave account data.
2. Star an Address: Click the star icon to set an address as your primary focus, and receive badge updates for its health factor.

Monitor Health Factor: The badge color changes based on the health factor, alerting you to potential risks:

- Green: Healthy (> 2)
- Orange: Warning (1 - 2)
- Red: Danger (< 1)
- No Debt Indicator: If an address has no debt, the badge will display "ND" for "No Debt."

Why Use Aave Health Factor?

- Convenience: Access your Aave account data without leaving your browser.
- Security: Keep track of your account's health to avoid liquidation risks.
- Efficiency: Quickly identify and respond to changes in your account status.

Get Started:
Install the Aave Account Monitor extension today and take control of your Aave account management with ease and confidence.

## Requirements

- Node.js (v16.0.0 or higher)
- npm (v7.0.0 or higher)
- Git

## Build Instructions

1. Clone the repository

   ```bash
   git clone [your-repository-url]
   cd aave-health-factor
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Build the extension
   ```bash
   npm run build
   ```

This will create a `build` directory with the extension files.

## Screenshots

![](https://github.com/user-attachments/assets/3cf5fe5e-81c1-48ce-b58a-8c3b80d56cc2)

## Development Setup

### Chrome Development

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `build` directory

### Firefox Development

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" on the left sidebar
3. Click "Load Temporary Add-on"
4. Navigate to the `build` directory and select `manifest.json`

## Project Structure

```
aave-health-factor/
├── src/
│ ├── App.tsx # Main popup component
│ ├── background.ts # Background service worker
│ ├── utils/
│ │ └── browserAPI.ts # Browser compatibility layer
│ └── pages/
│ └── Options.tsx # Options page component
├── public/
│ ├── manifest.json # Extension manifest
│ ├── options.html # Options page HTML
│ └── icons/ # Extension icons
└── package.json
```

## Build Environment Details

### Operating System

- The extension can be built on any operating system that supports Node.js (Windows, macOS, Linux)

### Build Environment

- Node.js environment
- npm package manager
- Create React App build system
- TypeScript compiler
- Webpack (included in Create React App)

### Dependencies

All dependencies are managed through npm and listed in package.json. Key dependencies include:

- React 18.x
- TypeScript 4.x
- ethers.js 5.x
- @types/chrome for Chrome extension type definitions

## Production Build Process

The production build process:

1. Compiles TypeScript files
2. Bundles modules with Webpack
3. Minifies JavaScript and CSS
4. Copies static assets
5. Generates source maps
6. Creates a production-ready build in the `build` directory

## Firefox Add-on Specific Notes

For Firefox distribution:

1. Ensure you have a valid extension ID in manifest.json
2. The build process creates a Firefox-compatible extension
3. Test the extension in Firefox before submission
4. Submit to Firefox Add-ons (AMO) using the built files

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Aave Protocol](https://aave.com/) for providing the DeFi lending platform
- [Alephium](https://alephium.org/) for supporting the development
- [Ethers.js](https://docs.ethers.io/) for Ethereum interactions
- [React](https://reactjs.org/) for the UI framework

---

Made with ❤️ by No Trust Verify
